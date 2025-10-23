## Test Data Strategy Documentation

This document describes the scalable test data strategy implemented in the Cypress project.

## Table of Contents

- [Overview](#overview)
- [Fixtures](#fixtures)
- [Data Factory](#data-factory)
- [Environment-Aware Seeding](#environment-aware-seeding)
- [Data-Driven Tests](#data-driven-tests)
- [Teardown & Cleanup](#teardown--cleanup)
- [Parallel Execution](#parallel-execution)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The test data strategy provides:

1. **JSON Fixtures** - Static test data for users, roles, and products
2. **Data Factory** - Dynamic entity creation with unique identifiers
3. **Environment Awareness** - Different behavior for local/CI/ephemeral environments
4. **Data-Driven Tests** - Parametrized tests using `Cypress.each` and BDD scenario outlines
5. **Cleanup Strategies** - Automatic teardown and namespace isolation
6. **Parallel Support** - Safe concurrent test execution

## Fixtures

### Location
```
cypress/fixtures/
├── users.json      # User test data
├── roles.json      # Role definitions and permissions
└── products.json   # Product catalog data
```

### Users Fixture ([cypress/fixtures/users.json](cypress/fixtures/users.json:1))

Contains predefined user accounts for different roles:

```json
{
  "standard": {
    "id": "user-standard-001",
    "username": "standard.user",
    "password": "Password123!",
    "role": "standard",
    "permissions": ["read", "write"],
    "balance": 1000.00
  },
  "premium": { ... },
  "admin": { ... },
  "manager": { ... },
  "readonly": { ... }
}
```

**Available Users:**
- `standard` - Basic user with limited permissions
- `premium` - Enhanced user with export capabilities
- `admin` - Full administrative access
- `manager` - Team management permissions
- `readonly` - View-only access
- `suspended` - Inactive account for negative testing

### Roles Fixture ([cypress/fixtures/roles.json](cypress/fixtures/roles.json:1))

Defines role hierarchies and permissions:

```json
{
  "admin": {
    "id": "role-admin",
    "name": "Administrator",
    "level": 4,
    "permissions": ["user:read", "user:create", "user:delete", ...],
    "features": {
      "maxTransactionAmount": -1,
      "canExportData": true,
      "canManageUsers": true
    },
    "limits": {
      "storageQuota": -1,
      "apiRateLimit": -1
    }
  }
}
```

**Role Hierarchy:**
- Level 0: `readonly`
- Level 1: `standard`
- Level 2: `premium`
- Level 3: `manager`
- Level 4: `admin`

### Products Fixture ([cypress/fixtures/products.json](cypress/fixtures/products.json:1))

Product catalog with various price ranges and statuses:

```json
{
  "basic": {
    "id": "prod-basic-001",
    "name": "Basic Widget",
    "price": 29.99,
    "stock": 100,
    "status": "active"
  },
  "outOfStock": { ... },
  "discontinued": { ... }
}
```

## Data Factory

### Overview

The Data Factory ([src/utils/data-factory.js](src/utils/data-factory.js:1)) creates unique test entities via API calls.

### Key Features

1. **Unique IDs** - Every entity gets a unique namespace-based ID
2. **Automatic Cleanup** - Track and cleanup created entities
3. **Environment Aware** - Adapts to local/CI/ephemeral environments
4. **Fixture Integration** - Create entities from fixture templates

### SeedFactory Usage

```javascript
import { SeedFactory } from '../utils';

const seedFactory = new SeedFactory();

// Create unique user
seedFactory.createUser({ role: 'admin' }).then((user) => {
  // user has unique ID, email, username
});

// Create from fixture
seedFactory.createUserFromFixture('admin').then((user) => {
  // Created based on admin fixture template
});

// Create with specific role
seedFactory.createUserWithRole('premium').then((user) => {
  // User created with premium role permissions
});

// Cleanup all created entities
seedFactory.cleanup();
```

### Available Factories

#### UserFactory
```javascript
const userFactory = new UserFactory();

// Single user
userFactory.create({ role: 'standard' });

// Multiple users
userFactory.createMany(5, { role: 'premium' });

// From fixture
userFactory.createFromFixture('admin');

// With specific role
userFactory.createWithRole('manager');
```

#### TransactionFactory
```javascript
const txnFactory = new TransactionFactory();

// Single transaction
txnFactory.create({ amount: 500, type: 'payment' });

// Multiple transactions
txnFactory.createMany(10);

// For specific user
txnFactory.createForUser('user-123', { amount: 100 });
```

#### ProductFactory
```javascript
const productFactory = new ProductFactory();

// Single product
productFactory.create({ name: 'Widget', price: 49.99 });

// From fixture
productFactory.createFromFixture('premium');

// Multiple products
productFactory.createMany(5);
```

#### OrderFactory
```javascript
const orderFactory = new OrderFactory();

// Single order
orderFactory.create({ total: 299.99 });

// Order with products
orderFactory.createWithProducts(['prod-1', 'prod-2']);
```

## Environment-Aware Seeding

### Configuration

The data factory adapts behavior based on environment:

```javascript
const envConfig = {
  local: {
    cleanupAfterTest: true,
    useRealApi: false,
    maxRetries: 3
  },
  ci: {
    cleanupAfterTest: true,
    useRealApi: false,
    maxRetries: 5
  },
  ephemeral: {
    cleanupAfterTest: false,  // Environment destroyed after tests
    useRealApi: true,
    maxRetries: 3
  },
  staging: {
    cleanupAfterTest: true,
    useRealApi: true,
    maxRetries: 5
  }
};
```

### Setting Environment

```bash
# Via environment variable
ENVIRONMENT=ci npm run test:run

# Via Cypress env
npx cypress run --env environment=staging
```

### Environment Detection

```javascript
import { getEnvironmentConfig } from '../utils';

const config = getEnvironmentConfig();

if (config.cleanupAfterTest) {
  // Perform cleanup
}
```

## Data-Driven Tests

### Using Cypress.each with Arrays

**File:** [cypress/e2e/data-driven-tests.cy.js](cypress/e2e/data-driven-tests.cy.js:1)

```javascript
// Test multiple user roles
['standard', 'premium', 'admin'].forEach((role) => {
  it(`should login as ${role} user`, () => {
    cy.fixture('users').then((users) => {
      const user = users[role];
      loginPage.login(user.username, user.password);
    });
  });
});
```

### Using Test Case Objects

```javascript
const testCases = [
  { amount: 10, shouldSucceed: true },
  { amount: 0, shouldSucceed: false },
  { amount: -100, shouldSucceed: false }
];

testCases.forEach(({ amount, shouldSucceed }) => {
  it(`should ${shouldSucceed ? 'accept' : 'reject'} amount ${amount}`, () => {
    // Test logic
  });
});
```

### BDD Scenario Outlines

**File:** [src/tests/features/multi-role-access.feature](src/tests/features/multi-role-access.feature:1)

```gherkin
Scenario Outline: Users with different roles can login
  Given I am on the login page
  When I login as a "<role>" user
  Then I should see features for "<role>" role

  Examples:
    | role     |
    | standard |
    | premium  |
    | admin    |
```

### Parametrized Step Definitions

```javascript
When('I login as a {string} user', (role) => {
  cy.fixture('users').then((users) => {
    const user = users[role];
    loginPage.login(user.username, user.password);
  });
});
```

## Teardown & Cleanup

### Automatic Cleanup

The SeedFactory tracks all created entities and cleans them up:

```javascript
describe('My Tests', () => {
  let seedFactory;

  beforeEach(() => {
    seedFactory = new SeedFactory();
  });

  afterEach(() => {
    // Cleanup all entities created in this test
    seedFactory.cleanup();
  });

  it('should create and cleanup user', () => {
    seedFactory.createUser();
    // User will be automatically cleaned up after test
  });
});
```

### Manual Cleanup Commands

```javascript
// Cleanup specific entity
cy.cleanupEntity('users', 'user-123');

// Cleanup by namespace
cy.cleanupNamespace('test-run-12345');

// Reset entire database (local/CI only)
cy.resetDatabase();
```

### Cleanup Strategies

#### 1. Per-Test Cleanup
```javascript
afterEach(() => {
  seedFactory.cleanup();
});
```

#### 2. Per-Suite Cleanup
```javascript
after(() => {
  seedFactory.cleanup();
});
```

#### 3. Namespace-Based Cleanup
```javascript
const namespace = seedFactory.getNamespace();

after(() => {
  cy.cleanupNamespace(namespace);
});
```

## Parallel Execution

### Namespace Isolation

Each test run gets a unique namespace to prevent data conflicts:

```javascript
const namespace = getNamespace();
// Returns: "1634567890_0_1234"
//          timestamp_workerId_random
```

### Worker ID

Set worker ID for parallel execution:

```bash
# GitHub Actions
WORKER_ID=${{ matrix.index }} npm run test:run

# Locally
WORKER_ID=1 npm run test:run
```

### Unique Entity IDs

All created entities include the namespace:

```javascript
seedFactory.createUser();
// Creates user with ID: "user-1634567890_0_1234_abc123"
```

### Parallel Safety Example

```javascript
it('should handle parallel execution', () => {
  const factory1 = new SeedFactory();
  const factory2 = new SeedFactory();

  // Different namespaces
  expect(factory1.getNamespace()).to.not.equal(factory2.getNamespace());

  // No conflicts when creating entities
  factory1.createUser();
  factory2.createUser();
});
```

## Usage Examples

### Example 1: Simple Fixture-Based Test

```javascript
it('should login with admin user', () => {
  cy.fixture('users').then((users) => {
    const admin = users.admin;
    loginPage.login(admin.username, admin.password);
    loginPage.verifyLoginSuccess();
  });
});
```

### Example 2: Data Factory with Cleanup

```javascript
it('should create and verify transaction', () => {
  const seedFactory = new SeedFactory();

  seedFactory.createTransaction({ amount: 100 }).then((txn) => {
    expect(txn.amount).to.equal(100);
    expect(txn.id).to.include('txn-');
  });

  // Cleanup after test
  cy.wrap(null).then(() => seedFactory.cleanup());
});
```

### Example 3: Multi-Role Testing

```javascript
const roles = ['standard', 'premium', 'admin'];

roles.forEach((role) => {
  it(`should have correct permissions for ${role}`, () => {
    cy.fixture('users').then((users) => {
      loginPage.login(users[role].username, users[role].password);
    });

    cy.fixture('roles').then((roles) => {
      const permissions = roles[role].permissions;

      // Verify each permission
      permissions.forEach((perm) => {
        cy.log(`Checking permission: ${perm}`);
      });
    });
  });
});
```

### Example 4: BDD with Data Tables

```gherkin
Scenario Outline: Transaction limits by role
  Given I am logged in as a "<role>" user
  When I create a transaction of "<amount>"
  Then the result should be "<outcome>"

  Examples:
    | role     | amount | outcome  |
    | standard | 500    | accepted |
    | standard | 1500   | rejected |
    | admin    | 50000  | accepted |
```

### Example 5: Environment-Aware Testing

```javascript
it('should seed data based on environment', () => {
  const config = getEnvironmentConfig();

  if (config.useRealApi) {
    // Call real API
    seedFactory.createUser();
  } else {
    // Use mocked API
    cy.intercept('POST', '/api/users', { statusCode: 200 });
  }
});
```

### Example 6: Bulk Data Creation

```javascript
it('should create multiple products', () => {
  const seedFactory = new SeedFactory();

  seedFactory.product.createMany(10, {
    category: 'widgets',
    status: 'active'
  }).then((products) => {
    expect(products).to.have.length(10);

    // All products have unique IDs
    const ids = products.map(p => p.id);
    expect(new Set(ids).size).to.equal(10);
  });
});
```

## Best Practices

### 1. Always Cleanup Test Data

```javascript
afterEach(() => {
  seedFactory.cleanup();
});
```

### 2. Use Fixtures for Static Data

```javascript
// GOOD - Use fixtures for role definitions
cy.fixture('roles').then((roles) => {
  const adminPerms = roles.admin.permissions;
});

// AVOID - Hardcoding test data
const adminPerms = ['read', 'write', 'delete'];
```

### 3. Use Data Factory for Dynamic Data

```javascript
// GOOD - Generate unique users
seedFactory.createUser({ role: 'admin' });

// AVOID - Reusing same test user (causes conflicts)
const user = { username: 'admin', password: 'admin123' };
```

### 4. Parameterize Tests for Multiple Scenarios

```javascript
// GOOD - Test all roles
roles.forEach((role) => {
  it(`works for ${role}`, () => { /* test */ });
});

// AVOID - Separate tests for each role
it('works for standard', () => { /* test */ });
it('works for premium', () => { /* test */ });
it('works for admin', () => { /* test */ });
```

### 5. Use Namespaces for Parallel Tests

```javascript
// GOOD - Namespace isolation
const namespace = seedFactory.getNamespace();
const user = seedFactory.createUser();
// user.id includes namespace

// AVOID - Shared IDs across parallel tests
const user = { id: 'test-user-1' };
```

### 6. Environment-Specific Behavior

```javascript
// GOOD - Adapt to environment
const config = getEnvironmentConfig();
if (config.cleanupAfterTest) {
  seedFactory.cleanup();
}

// AVOID - Hardcoded behavior
seedFactory.cleanup(); // Always cleanup (may fail in ephemeral envs)
```

### 7. Document Fixture Structure

```javascript
// GOOD - Clear fixture structure
{
  "admin": {
    "id": "user-admin-001",
    "role": "admin",
    "permissions": ["all"]
  }
}

// AVOID - Unclear or nested structure
{
  "users": {
    "type1": {
      "data": {
        "admin": { /* ... */ }
      }
    }
  }
}
```

## Troubleshooting

### Issue: Test data conflicts in parallel runs

**Solution:** Ensure each test uses unique namespace:
```javascript
const factory = new SeedFactory();
const namespace = factory.getNamespace();
```

### Issue: Cleanup not working

**Solution:** Check environment configuration:
```javascript
const config = getEnvironmentConfig();
console.log('Cleanup enabled:', config.cleanupAfterTest);
```

### Issue: Fixture data not found

**Solution:** Verify fixture file exists and key is correct:
```javascript
cy.fixture('users').then((users) => {
  if (!users.admin) {
    throw new Error('Admin user not found in fixture');
  }
});
```

### Issue: API calls failing

**Solution:** Check environment and use mocks if needed:
```javascript
if (!config.useRealApi) {
  cy.intercept('POST', '/api/users', { fixture: 'user-response.json' });
}
```

## Summary

The test data strategy provides:

✅ **Fixtures** - 3 comprehensive JSON files with multiple entities
✅ **Data Factory** - 4 factories (User, Transaction, Product, Order)
✅ **Environment Awareness** - 4 environment configs (local, CI, ephemeral, staging)
✅ **Data-Driven Tests** - Examples using `forEach` and BDD scenario outlines
✅ **Cleanup** - Automatic and manual cleanup strategies
✅ **Parallel Support** - Namespace isolation for concurrent execution
✅ **BDD Integration** - Multi-role feature with 15+ scenarios

**Total Test Data Coverage:**
- 6 User Roles (standard, premium, admin, manager, readonly, suspended)
- 5 Role Definitions with permissions and limits
- 5 Product Templates with various statuses
- 4 Entity Factories with 30+ methods
- 15+ BDD Scenarios for role-based testing
