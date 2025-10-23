/**
 * Data-Driven Tests
 * Demonstrates parametrized testing with fixtures and Cypress.each
 */

import { LoginPage, DashboardPage } from '../../src/pages';
import { SeedFactory } from '../../src/utils';

describe('Data-Driven Tests', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  let seedFactory;

  beforeEach(() => {
    seedFactory = new SeedFactory();
    cy.resetState();
  });

  afterEach(() => {
    // Cleanup created test data
    seedFactory.cleanup();
  });

  context('@smoke - Multi-User Role Testing', () => {
    // Test with multiple user roles using fixture data
    ['standard', 'premium', 'admin'].forEach((role) => {
      it(`should login successfully as ${role} user`, () => {
        // Load user fixture
        cy.fixture('users').then((users) => {
          const user = users[role];

          // Login
          loginPage.load();
          loginPage.login(user.username, user.password);

          // Verify successful login
          loginPage.verifyLoginSuccess('/dashboard');
          dashboardPage.verifyPageLoaded();
          dashboardPage.verifyUserLoggedIn();
        });
      });
    });

    // Test with role-specific permissions
    const rolePermissions = [
      { role: 'standard', canExport: false, canDelete: false },
      { role: 'premium', canExport: true, canDelete: false },
      { role: 'admin', canExport: true, canDelete: true },
    ];

    rolePermissions.forEach(({ role, canExport, canDelete }) => {
      it(`should have correct permissions for ${role} role`, () => {
        cy.fixture('users').then((users) => {
          const user = users[role];

          loginPage.load().login(user.username, user.password);
          dashboardPage.load();

          // Verify export permission
          if (canExport) {
            cy.get('[data-test="export-button"]').should('be.visible');
          } else {
            cy.get('[data-test="export-button"]').should('not.exist');
          }

          // Verify delete permission
          if (canDelete) {
            cy.get('[data-test="delete-button"]').should('be.visible');
          } else {
            cy.get('[data-test="delete-button"]').should('not.exist');
          }
        });
      });
    });
  });

  context('@regression - Product Testing with Different Price Ranges', () => {
    const products = [
      { name: 'basic', expectedRange: 'budget' },
      { name: 'premium', expectedRange: 'midRange' },
      { name: 'enterprise', expectedRange: 'enterprise' },
    ];

    products.forEach(({ name, expectedRange }) => {
      it(`should correctly categorize ${name} product in ${expectedRange} range`, () => {
        cy.fixture('products').then((productsData) => {
          const product = productsData[name];
          const priceRanges = productsData.priceRanges;
          const range = priceRanges[expectedRange];

          // Verify product price is within expected range
          expect(product.price).to.be.at.least(range.min);
          expect(product.price).to.be.at.most(range.max);
        });
      });
    });
  });

  context('@regression - Data Factory Testing', () => {
    const userRoles = ['standard', 'premium', 'manager', 'admin'];

    userRoles.forEach((role) => {
      it(`should create unique ${role} user via data factory`, () => {
        // Create user with specific role
        seedFactory.createUserWithRole(role).then((user) => {
          // Verify user was created with correct role
          expect(user.role).to.equal(role);
          expect(user.id).to.include('user-');
          expect(user.username).to.not.be.empty;
          expect(user.email).to.not.be.empty;

          // Verify role-specific properties
          cy.fixture('roles').then((roles) => {
            const roleData = roles[role];
            expect(user.permissions).to.deep.equal(roleData.permissions);
          });
        });
      });
    });
  });

  context('@regression - Transaction Amount Validation', () => {
    const testCases = [
      { amount: 10, shouldSucceed: true, description: 'minimum amount' },
      { amount: 500, shouldSucceed: true, description: 'normal amount' },
      { amount: 10000, shouldSucceed: true, description: 'large amount' },
      { amount: 0, shouldSucceed: false, description: 'zero amount' },
      { amount: -100, shouldSucceed: false, description: 'negative amount' },
    ];

    testCases.forEach(({ amount, shouldSucceed, description }) => {
      it(`should ${shouldSucceed ? 'accept' : 'reject'} transaction with ${description}`, () => {
        if (shouldSucceed) {
          seedFactory.createTransaction({ amount }).then((transaction) => {
            expect(transaction.amount).to.equal(amount);
            expect(transaction.status).to.be.oneOf(['pending', 'completed']);
          });
        } else {
          // Expect validation error for invalid amounts
          cy.wrap(
            seedFactory.createTransaction({ amount })
          ).should('throw');
        }
      });
    });
  });

  context('@smoke - Bulk Data Creation', () => {
    const bulkTestCases = [
      { count: 5, type: 'users' },
      { count: 10, type: 'transactions' },
      { count: 3, type: 'products' },
    ];

    bulkTestCases.forEach(({ count, type }) => {
      it(`should create ${count} ${type} in bulk`, () => {
        let createPromise;

        switch (type) {
          case 'users':
            createPromise = seedFactory.user.createMany(count);
            break;
          case 'transactions':
            createPromise = seedFactory.transaction.createMany(count);
            break;
          case 'products':
            createPromise = seedFactory.product.createMany(count);
            break;
        }

        createPromise.then((entities) => {
          expect(entities).to.have.length(count);

          // Verify each entity has unique ID
          const ids = entities.map((e) => e.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).to.equal(count);
        });
      });
    });
  });

  context('@regression - Environment-Aware Testing', () => {
    it('should use environment-specific configuration', () => {
      cy.task('getEnvironmentInfo').then((envInfo) => {
        cy.log('Environment:', envInfo);

        // Verify test is aware of environment
        expect(envInfo).to.have.property('nodeEnv');
        expect(envInfo).to.have.property('ci');
        expect(envInfo).to.have.property('workerId');

        // Different behavior based on environment
        if (envInfo.ci) {
          cy.log('Running in CI environment');
          // CI-specific assertions
        } else {
          cy.log('Running in local environment');
          // Local-specific assertions
        }
      });
    });
  });

  context('@regression - Parallel Execution Safety', () => {
    it('should generate unique namespace for parallel runs', () => {
      const namespace1 = seedFactory.getNamespace();
      const seedFactory2 = new SeedFactory();
      const namespace2 = seedFactory2.getNamespace();

      // Namespaces should be different to prevent conflicts
      expect(namespace1).to.not.equal(namespace2);

      // Both should include timestamp and random component
      expect(namespace1).to.match(/\d+_\d+_\d+/);
      expect(namespace2).to.match(/\d+_\d+_\d+/);
    });

    it('should tag created entities with namespace', () => {
      seedFactory.createUser().then((user) => {
        const namespace = seedFactory.getNamespace();

        // User ID should be unique to this test run
        expect(user.id).to.include(namespace);
      });
    });
  });

  context('@smoke - Fixture-Driven Test Data', () => {
    it('should load and use all test users from fixture', () => {
      cy.fixture('users').then((users) => {
        const testUsers = users.testUsers;

        expect(testUsers).to.have.length.at.least(3);

        testUsers.forEach((user, index) => {
          // Verify each test user has required properties
          expect(user).to.have.property('username');
          expect(user).to.have.property('email');
          expect(user).to.have.property('role');

          cy.log(`Test User ${index + 1}:`, user.username, user.role);
        });
      });
    });

    it('should create products from fixture templates', () => {
      cy.fixture('products').then((productsData) => {
        const testProducts = productsData.testProducts;

        testProducts.forEach((template, index) => {
          seedFactory.createProduct(template).then((product) => {
            expect(product.name).to.equal(template.name);
            expect(product.price).to.equal(template.price);
            expect(product.stock).to.equal(template.stock);

            cy.log(`Created Product ${index + 1}:`, product.name);
          });
        });
      });
    });
  });
});
