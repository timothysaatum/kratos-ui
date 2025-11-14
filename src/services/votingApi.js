const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000; // Refresh if less than 2 minutes left

class VotingApiService {
  constructor() {
    this.tokenKey = "voting_token";
    this.voterDataKey = "voter_data";
    this.tokenExpiryKey = "token_expiry";
    this.refreshPromise = null; // Prevent concurrent refresh requests
  }

  // Helper: Get stored token
  getToken() {
    return sessionStorage.getItem(this.tokenKey);
  }

  // Helper: Set token with expiry tracking
  setToken(token, expiresIn = 600) {
    sessionStorage.setItem(this.tokenKey, token);
    // Store when token expires (current time + expiresIn seconds)
    const expiryTime = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
  }

  // Helper: Check if token needs refresh
  needsRefresh() {
    const expiryTime = sessionStorage.getItem(this.tokenExpiryKey);
    if (!expiryTime) return false;

    const timeUntilExpiry = parseInt(expiryTime) - Date.now();
    return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
  }

  // Helper: Check if token is expired
  isTokenExpired() {
    const expiryTime = sessionStorage.getItem(this.tokenExpiryKey);
    if (!expiryTime) return true;

    return Date.now() >= parseInt(expiryTime);
  }

  // Helper: Clear token
  clearToken() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.voterDataKey);
    sessionStorage.removeItem(this.tokenExpiryKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.voterDataKey);
  }

  // Helper: Refresh access token using refresh token cookie
  async refreshAccessToken() {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include", // Important: sends cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        const data = await response.json();

        // Store new access token
        this.setToken(data.access_token, data.expires_in);

        console.log("Access token refreshed successfully");
        return data.access_token;
      } catch (error) {
        console.error("Token refresh error:", error);
        this.clearToken();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Helper: Retry logic with exponential backoff
  async retryRequest(fn, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * Math.pow(2, i))
        );
      }
    }
  }

  // Helper: Make authenticated request with auto-refresh
  async request(endpoint, options = {}) {
    // Check if token needs refresh before making request
    if (this.needsRefresh() && !this.isTokenExpired()) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // Continue with existing token - it might still be valid
      }
    }

    let token = this.getToken();

    // If token is expired, try to refresh
    if (this.isTokenExpired()) {
      try {
        token = await this.refreshAccessToken();
      } catch (error) {
        this.clearToken();
        throw new Error("Session expired. Please verify your token again.");
      }
    }

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for CSRF and refresh token
    });

    // Handle token expiration - try to refresh once
    if (response.status === 401 && !options._isRetry) {
      try {
        const newToken = await this.refreshAccessToken();

        // Retry request with new token
        return this.request(endpoint, { ...options, _isRetry: true });
      } catch (refreshError) {
        this.clearToken();
        throw new Error("Session expired. Please verify your token again.");
      }
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new Error(
        `Rate limit exceeded. Please try again ${
          retryAfter ? `in ${retryAfter} seconds` : "later"
        }.`
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Request failed with status ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Verify voting token
   * @param {string} token - 8-character voting token
   * @param {Object} options - Additional verification options
   * @returns {Promise<Object>} Verification result with access token and voter data
   */
  async verifyToken(token, options = {}) {
    const cleanToken = token.replace(/[^A-Za-z0-9]/g, "");

    if (cleanToken.length !== 8) {
      throw new Error("Token must be exactly 8 characters");
    }

    const data = await this.request("/auth/verify-id", {
      method: "POST",
      body: JSON.stringify({
        token: cleanToken,
        current_location: options.location || null,
      }),
    });

    // Store token with expiry tracking
    this.setToken(data.access_token, data.expires_in);
    sessionStorage.setItem(this.voterDataKey, JSON.stringify(data.electorate));

    return data;
  }

  /**
   * Get voting ballot for authenticated voter
   * @returns {Promise<Array>} List of portfolios with candidates
   */
  async getBallot() {
    return this.retryRequest(() => this.request("/voting/ballot"));
  }

  /**
   * Cast votes for selected candidates
   * @param {Array} votes - Array of {portfolio_id, candidate_id} objects
   * @returns {Promise<Object>} Vote submission result
   */
  async castVote(votes) {
    if (!Array.isArray(votes) || votes.length === 0) {
      throw new Error("Votes must be a non-empty array");
    }

    // Validate vote structure
    votes.forEach((vote) => {
      if (!vote.portfolio_id || !vote.candidate_id) {
        throw new Error("Each vote must have portfolio_id and candidate_id");
      }
    });

    const result = await this.request("/voting/vote", {
      method: "POST",
      body: JSON.stringify({ votes }),
    });

    // Clear tokens after successful vote
    this.clearToken();

    return result;
  }

  /**
   * Get votes cast by current voter
   * @returns {Promise<Array>} List of votes
   */
  async getMyVotes() {
    return this.request("/voting/my-votes");
  }

  /**
   * Check if current session is valid
   * @returns {Promise<boolean>} Session validity
   */
  async checkSession() {
    try {
      await this.request("/auth/verify");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get stored voter data
   * @returns {Object|null} Voter data
   */
  getVoterData() {
    const data = sessionStorage.getItem(this.voterDataKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Logout and clear all session data
   */
  logout() {
    this.clearToken();
  }
}

export const votingApi = new VotingApiService();
export default votingApi;