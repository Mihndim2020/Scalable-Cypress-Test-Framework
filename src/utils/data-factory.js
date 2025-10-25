/**
 * Data Factory Utility
 * Creates unique test data entities via API
 * Supports environment-aware seeding and parallel execution
 */

import {
  generateRandomEmail,
  generateRandomUsername,
  generateRandomString,
  generateRandomNumber,
} from './helpers';

/**
 * Get unique namespace for parallel execution
 * Uses combination of timestamp, worker ID, and random string
 */
const getNamespace = () => {
  const timestamp = Date.now();
  const workerId = Cypress.env('WORKER_ID') || '0';
  const random = Math.floor(Math.random() * 10000);
  return `${timestamp}_${workerId}_${random}`;
};

/**
 * Get environment-specific configuration
 */
const getEnvironmentConfig = () => {
  const env = Cypress.env('environment') || 'local';
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001';

  const configs = {
    local: {
      apiUrl,
      cleanupAfterTest: true,
      useRealApi: false,
      maxRetries: 3,
    },
    ci: {
      apiUrl,
      cleanupAfterTest: true,
      useRealApi: false,
      maxRetries: 5,
    },
    ephemeral: {
      apiUrl,
      cleanupAfterTest: false, // Environment is destroyed after tests
      useRealApi: true,
      maxRetries: 3,
    },
    staging: {
      apiUrl,
      cleanupAfterTest: true,
      useRealApi: true,
      maxRetries: 5,
    },
  };

  return configs[env] || configs.local;
};

/**
 * Base factory class for creating test data
 */
class BaseFactory {
  constructor() {
    this.config = getEnvironmentConfig();
    this.createdEntities = [];
    this.namespace = getNamespace();
  }

  /**
   * Make API request
   */
  async makeRequest(method, endpoint, data = null) {
    const url = `${this.config.apiUrl}${endpoint}`;

    const options = {
      method,
      url,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Namespace': this.namespace,
      },
    };

    if (data) {
      options.body = data;
    }

    return cy.request(options);
  }

  /**
   * Track created entity for cleanup
   */
  trackEntity(type, id) {
    this.createdEntities.push({ type, id });
  }

  /**
   * Clean up all created entities
   */
  async cleanup() {
    if (!this.config.cleanupAfterTest) {
      return;
    }

    for (const entity of this.createdEntities.reverse()) {
      try {
        await this.makeRequest('DELETE', `/${entity.type}/${entity.id}`);
      } catch (error) {
        cy.log(`Failed to cleanup ${entity.type}:${entity.id}`, error);
      }
    }

    this.createdEntities = [];
  }
}

/**
 * User Factory
 * Creates unique user entities
 */
class UserFactory extends BaseFactory {
  /**
   * Create a user with unique data
   * @param {Object} overrides - Override default user properties
   * @returns {Promise} Created user data
   */
  create(overrides = {}) {
    const uniqueId = `${this.namespace}_${generateRandomString(8)}`;

    const defaultData = {
      id: `user-${uniqueId}`,
      username: generateRandomUsername('user'),
      email: generateRandomEmail('user'),
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'standard',
      status: 'active',
      balance: 1000.0,
      phone: `+1-555-${generateRandomNumber(1000, 9999)}`,
    };

    const userData = { ...defaultData, ...overrides };

    return this.makeRequest('POST', '/api/users', userData).then((response) => {
      if (response.status === 200 || response.status === 201) {
        this.trackEntity('users', userData.id);
        return cy.wrap(response.body);
      } else {
        throw new Error(`Failed to create user: ${response.body.error}`);
      }
    });
  }

  /**
   * Create user from fixture
   * @param {string} fixtureKey - Key in users.json fixture
   * @returns {Promise} Created user data
   */
  createFromFixture(fixtureKey) {
    return cy.fixture('users').then((users) => {
      const fixtureUser = users[fixtureKey];

      if (!fixtureUser) {
        throw new Error(`User fixture '${fixtureKey}' not found`);
      }

      // Make email and username unique
      const uniqueSuffix = `_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      const uniqueUser = {
        ...fixtureUser,
        email: fixtureUser.email.replace('@', `${uniqueSuffix}@`),
        username: `${fixtureUser.username}${uniqueSuffix}`,
      };

      return this.create(uniqueUser);
    });
  }

  /**
   * Create multiple users
   * @param {number} count - Number of users to create
   * @param {Object} baseData - Base data for all users
   * @returns {Promise} Array of created users
   */
  createMany(count, baseData = {}) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        this.create({
          ...baseData,
          username: `${baseData.username || 'user'}_${i}`,
        })
      );
    }

    return cy.wrap(Promise.all(promises));
  }

  /**
   * Create user with specific role
   * @param {string} role - User role (standard, premium, admin, etc.)
   * @returns {Promise} Created user data
   */
  createWithRole(role) {
    return cy.fixture('roles').then((roles) => {
      const roleData = roles[role];

      if (!roleData) {
        throw new Error(`Role '${role}' not found in fixtures`);
      }

      return this.create({
        role,
        permissions: roleData.permissions,
      });
    });
  }
}

/**
 * Transaction Factory
 * Creates unique transaction entities
 */
class TransactionFactory extends BaseFactory {
  /**
   * Create a transaction
   * @param {Object} overrides - Override default transaction properties
   * @returns {Promise} Created transaction data
   */
  create(overrides = {}) {
    const uniqueId = `${this.namespace}_${generateRandomString(8)}`;

    const defaultData = {
      id: `txn-${uniqueId}`,
      amount: generateRandomNumber(10, 1000),
      type: 'payment',
      status: 'completed',
      description: `Test transaction ${uniqueId}`,
      createdAt: new Date().toISOString(),
    };

    const transactionData = { ...defaultData, ...overrides };

    return this.makeRequest('POST', '/api/transactions', transactionData).then(
      (response) => {
        if (response.status === 200 || response.status === 201) {
          this.trackEntity('transactions', transactionData.id);
          return cy.wrap(response.body);
        } else {
          throw new Error(
            `Failed to create transaction: ${response.body.error}`
          );
        }
      }
    );
  }

  /**
   * Create multiple transactions
   * @param {number} count - Number of transactions to create
   * @param {Object} baseData - Base data for all transactions
   * @returns {Promise} Array of created transactions
   */
  createMany(count, baseData = {}) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        this.create({
          ...baseData,
          description: `${baseData.description || 'Transaction'} ${i + 1}`,
        })
      );
    }

    return cy.wrap(Promise.all(promises));
  }

  /**
   * Create transaction for specific user
   * @param {string} userId - User ID
   * @param {Object} overrides - Override default properties
   * @returns {Promise} Created transaction data
   */
  createForUser(userId, overrides = {}) {
    return this.create({
      userId,
      ...overrides,
    });
  }
}

/**
 * Product Factory
 * Creates unique product entities
 */
class ProductFactory extends BaseFactory {
  /**
   * Create a product
   * @param {Object} overrides - Override default product properties
   * @returns {Promise} Created product data
   */
  create(overrides = {}) {
    const uniqueId = `${this.namespace}_${generateRandomString(8)}`;

    const defaultData = {
      id: `prod-${uniqueId}`,
      sku: `SKU-${uniqueId}`,
      name: `Test Product ${uniqueId}`,
      description: 'Test product description',
      category: 'widgets',
      price: generateRandomNumber(10, 100),
      currency: 'USD',
      stock: generateRandomNumber(10, 100),
      status: 'active',
    };

    const productData = { ...defaultData, ...overrides };

    return this.makeRequest('POST', '/api/products', productData).then(
      (response) => {
        if (response.status === 200 || response.status === 201) {
          this.trackEntity('products', productData.id);
          return cy.wrap(response.body);
        } else {
          throw new Error(`Failed to create product: ${response.body.error}`);
        }
      }
    );
  }

  /**
   * Create product from fixture
   * @param {string} fixtureKey - Key in products.json fixture
   * @returns {Promise} Created product data
   */
  createFromFixture(fixtureKey) {
    return cy.fixture('products').then((products) => {
      const fixtureProduct = products[fixtureKey];

      if (!fixtureProduct) {
        throw new Error(`Product fixture '${fixtureKey}' not found`);
      }

      // Make SKU unique
      const uniqueSuffix = `_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      const uniqueProduct = {
        ...fixtureProduct,
        sku: `${fixtureProduct.sku}-${uniqueSuffix}`,
        id: `${fixtureProduct.id}-${uniqueSuffix}`,
      };

      return this.create(uniqueProduct);
    });
  }

  /**
   * Create multiple products
   * @param {number} count - Number of products to create
   * @param {Object} baseData - Base data for all products
   * @returns {Promise} Array of created products
   */
  createMany(count, baseData = {}) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        this.create({
          ...baseData,
          name: `${baseData.name || 'Product'} ${i + 1}`,
        })
      );
    }

    return cy.wrap(Promise.all(promises));
  }
}

/**
 * Order Factory
 * Creates unique order entities
 */
class OrderFactory extends BaseFactory {
  /**
   * Create an order
   * @param {Object} overrides - Override default order properties
   * @returns {Promise} Created order data
   */
  create(overrides = {}) {
    const uniqueId = `${this.namespace}_${generateRandomString(8)}`;

    const defaultData = {
      id: `order-${uniqueId}`,
      orderNumber: `ORD-${uniqueId}`,
      status: 'pending',
      total: generateRandomNumber(100, 1000),
      currency: 'USD',
      items: [],
      createdAt: new Date().toISOString(),
    };

    const orderData = { ...defaultData, ...overrides };

    return this.makeRequest('POST', '/api/orders', orderData).then(
      (response) => {
        if (response.status === 200 || response.status === 201) {
          this.trackEntity('orders', orderData.id);
          return cy.wrap(response.body);
        } else {
          throw new Error(`Failed to create order: ${response.body.error}`);
        }
      }
    );
  }

  /**
   * Create order with products
   * @param {Array} productIds - Array of product IDs
   * @param {Object} overrides - Override default properties
   * @returns {Promise} Created order data
   */
  createWithProducts(productIds, overrides = {}) {
    const items = productIds.map((productId, index) => ({
      productId,
      quantity: generateRandomNumber(1, 5),
      price: generateRandomNumber(10, 100),
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return this.create({
      items,
      total,
      ...overrides,
    });
  }
}

/**
 * Main Seed Factory
 * Orchestrates all factories and provides unified interface
 */
class SeedFactory {
  constructor() {
    this.user = new UserFactory();
    this.transaction = new TransactionFactory();
    this.product = new ProductFactory();
    this.order = new OrderFactory();
    this.namespace = getNamespace();
  }

  /**
   * Create user via API
   */
  createUser(overrides = {}) {
    return this.user.create(overrides);
  }

  /**
   * Create user from fixture
   */
  createUserFromFixture(fixtureKey) {
    return this.user.createFromFixture(fixtureKey);
  }

  /**
   * Create user with specific role
   */
  createUserWithRole(role) {
    return this.user.createWithRole(role);
  }

  /**
   * Create transaction via API
   */
  createTransaction(overrides = {}) {
    return this.transaction.create(overrides);
  }

  /**
   * Create product via API
   */
  createProduct(overrides = {}) {
    return this.product.create(overrides);
  }

  /**
   * Create product from fixture
   */
  createProductFromFixture(fixtureKey) {
    return this.product.createFromFixture(fixtureKey);
  }

  /**
   * Create order via API
   */
  createOrder(overrides = {}) {
    return this.order.create(overrides);
  }

  /**
   * Create order with products
   */
  createOrderWithProducts(productIds, overrides = {}) {
    return this.order.createWithProducts(productIds, overrides);
  }

  /**
   * Cleanup all created entities
   */
  cleanup() {
    return Promise.all([
      this.user.cleanup(),
      this.transaction.cleanup(),
      this.product.cleanup(),
      this.order.cleanup(),
    ]);
  }

  /**
   * Get current namespace
   */
  getNamespace() {
    return this.namespace;
  }
}

// Export factories
export {
  SeedFactory,
  UserFactory,
  TransactionFactory,
  ProductFactory,
  OrderFactory,
  getNamespace,
  getEnvironmentConfig,
};

// Default export
export default SeedFactory;
