/**
 * Ephemeral Test User Management
 *
 * Creates temporary test users for CI/testing that are automatically cleaned up.
 * Implements best practices for secure test user management.
 *
 * Features:
 * - Time-limited user credentials
 * - Automatic cleanup after test runs
 * - Unique user generation per test run
 * - No hardcoded credentials
 * - API key rotation support
 */

const crypto = require('crypto');

/**
 * Generate ephemeral test user credentials
 *
 * @param {Object} options - Configuration options
 * @param {string} options.prefix - Username prefix (default: 'test')
 * @param {number} options.ttl - Time-to-live in milliseconds (default: 1 hour)
 * @param {string} options.environment - Environment identifier
 * @returns {Object} User credentials with expiration
 */
function generateEphemeralUser(options = {}) {
  const {
    prefix = 'test',
    ttl = 60 * 60 * 1000, // 1 hour
    environment = process.env.ENVIRONMENT || 'local',
  } = options;

  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const username = `${prefix}_${environment}_${timestamp}_${random}`;

  // Generate secure random password
  const password = crypto.randomBytes(16).toString('base64');

  // Calculate expiration time
  const expiresAt = new Date(timestamp + ttl);

  return {
    username,
    password,
    email: `${username}@ephemeral.test`,
    createdAt: new Date(timestamp),
    expiresAt,
    ttl,
    environment,
    metadata: {
      isEphemeral: true,
      runId: process.env.GITHUB_RUN_ID || process.env.BUILD_NUMBER || random,
      workerId: process.env.WORKER_ID || '0',
    },
  };
}

/**
 * Generate rotatable API key
 *
 * @param {Object} options - Configuration options
 * @param {string} options.service - Service name
 * @param {number} options.ttl - Time-to-live in milliseconds
 * @returns {Object} API key with metadata
 */
function generateRotatableApiKey(options = {}) {
  const {
    service = 'api',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
  } = options;

  const timestamp = Date.now();
  const keyId = crypto.randomUUID();
  const keySecret = crypto.randomBytes(32).toString('base64url');

  // Create API key in format: service_keyId_secret
  const apiKey = `${service}_${keyId}_${keySecret}`;

  return {
    keyId,
    apiKey,
    service,
    createdAt: new Date(timestamp),
    expiresAt: new Date(timestamp + ttl),
    ttl,
    metadata: {
      rotatable: true,
      version: 1,
    },
  };
}

/**
 * Create ephemeral user via API (simulated)
 *
 * In a real implementation, this would call your backend API
 * to create a temporary user account.
 *
 * @param {Object} user - User credentials from generateEphemeralUser
 * @returns {Promise<Object>} Created user with ID
 */
async function createEphemeralUser(user) {
  // Simulate API call
  console.log(`[Ephemeral User] Creating user: ${user.username}`);

  // In reality, call your API:
  // const response = await fetch(`${API_URL}/users/ephemeral`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(user),
  // });
  // return response.json();

  return {
    ...user,
    id: crypto.randomUUID(),
    created: true,
  };
}

/**
 * Cleanup expired ephemeral users
 *
 * @param {string} environment - Environment to cleanup
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupExpiredUsers(environment = process.env.ENVIRONMENT) {
  console.log(`[Ephemeral User] Cleaning up expired users in ${environment}`);

  // In reality, call your cleanup API:
  // const response = await fetch(`${API_URL}/users/ephemeral/cleanup`, {
  //   method: 'DELETE',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${ADMIN_TOKEN}`,
  //   },
  //   body: JSON.stringify({ environment }),
  // });
  // return response.json();

  return {
    environment,
    deleted: 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Cypress command integration
 *
 * Usage in tests:
 * cy.createEphemeralUser().then((user) => {
 *   cy.login(user.username, user.password);
 * });
 */
if (typeof Cypress !== 'undefined') {
  Cypress.Commands.add('createEphemeralUser', (options = {}) => {
    const user = generateEphemeralUser(options);

    return cy.task('createEphemeralUser', user).then((createdUser) => {
      // Store for cleanup
      Cypress.env('ephemeralUsers', [
        ...(Cypress.env('ephemeralUsers') || []),
        createdUser,
      ]);

      return createdUser;
    });
  });

  Cypress.Commands.add('cleanupEphemeralUsers', () => {
    const users = Cypress.env('ephemeralUsers') || [];

    if (users.length === 0) {
      return cy.wrap(null);
    }

    return cy.task('cleanupEphemeralUsers', users).then((result) => {
      Cypress.env('ephemeralUsers', []);
      return result;
    });
  });

  // Automatic cleanup after tests
  after(() => {
    cy.cleanupEphemeralUsers();
  });
}

/**
 * Environment-specific user pools
 *
 * Manages pools of ephemeral users for different environments
 */
class EphemeralUserPool {
  constructor(environment, poolSize = 5) {
    this.environment = environment;
    this.poolSize = poolSize;
    this.users = [];
  }

  /**
   * Initialize user pool
   */
  async initialize() {
    console.log(`[User Pool] Initializing ${this.poolSize} users for ${this.environment}`);

    for (let i = 0; i < this.poolSize; i++) {
      const user = generateEphemeralUser({
        prefix: `pool`,
        environment: this.environment,
      });

      const created = await createEphemeralUser(user);
      this.users.push(created);
    }

    return this.users;
  }

  /**
   * Get next available user from pool
   */
  async getUser() {
    if (this.users.length === 0) {
      throw new Error('User pool is empty. Initialize first.');
    }

    // Return user in round-robin fashion
    const user = this.users.shift();
    this.users.push(user); // Add back to end

    return user;
  }

  /**
   * Cleanup all users in pool
   */
  async cleanup() {
    console.log(`[User Pool] Cleaning up ${this.users.length} users`);

    for (const user of this.users) {
      // Call cleanup API for each user
      console.log(`[User Pool] Deleting user: ${user.username}`);
    }

    this.users = [];
  }
}

/**
 * API Key rotation helper for CI
 */
class ApiKeyRotator {
  constructor(service, storageKey = 'API_KEY') {
    this.service = service;
    this.storageKey = storageKey;
    this.currentKey = null;
  }

  /**
   * Get current API key or generate new one
   */
  async getKey() {
    // Check if we have a valid key
    const stored = this.getStoredKey();

    if (stored && !this.isExpired(stored)) {
      this.currentKey = stored;
      return stored.apiKey;
    }

    // Generate new key
    return this.rotate();
  }

  /**
   * Rotate API key
   */
  async rotate() {
    console.log(`[API Key] Rotating key for ${this.service}`);

    const newKey = generateRotatableApiKey({
      service: this.service,
    });

    // In reality, store in secure vault (AWS Secrets Manager, etc.)
    // await storeInVault(this.storageKey, newKey);

    this.currentKey = newKey;
    return newKey.apiKey;
  }

  /**
   * Check if key is expired
   */
  isExpired(key) {
    return new Date() > new Date(key.expiresAt);
  }

  /**
   * Get stored key (simulated)
   */
  getStoredKey() {
    // In reality, retrieve from secure vault
    return this.currentKey;
  }
}

// Export functions
module.exports = {
  generateEphemeralUser,
  generateRotatableApiKey,
  createEphemeralUser,
  cleanupExpiredUsers,
  EphemeralUserPool,
  ApiKeyRotator,
};
