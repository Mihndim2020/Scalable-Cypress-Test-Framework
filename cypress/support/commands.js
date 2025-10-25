// ***********************************************
// Custom Cypress Commands
// Reusable commands for common flows and interactions
// ***********************************************

// ===== Selector Helper Commands =====

/**
 * Custom command to get element by data-test attribute
 * @example cy.getByTestId('submit-button')
 */
Cypress.Commands.add('getByTestId', (selector) => {
  return cy.get(`[data-testid="${selector}"]`);
});

/**
 * Custom command to get element by data-test attribute
 * @example cy.getByTestId('submit-button')
 */
Cypress.Commands.add('getByTest', (selector) => {
  return cy.get(`[data-test="${selector}"]`);
});

/**
 * Custom command to get element by data-cy attribute
 * @example cy.getByCy('submit-button')
 */
Cypress.Commands.add('getByCy', (selector) => {
  return cy.get(`[data-cy="${selector}"]`);
});

// ===== Authentication Commands =====

/**
 * Custom command to log in a user with session management
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @example cy.login('testuser', 'password123')
 */
Cypress.Commands.add('login', (username, password) => {
  cy.session(
    [username, password],
    () => {
      cy.visit('/login');
      cy.getByTestId('username').type(username);
      cy.getByTestId('password').type(password);
      cy.getByTestId('signin-submit').click();
      cy.url().should('include', '/dashboard');
    },
    {
      validate() {
        // Validate session is still valid
        cy.getCookie('session').should('exist');
      },
      cacheAcrossSpecs: true,
    }
  );
});

/**
 * Login with user from fixture
 * @param {string} userType - Type of user (validUser, adminUser, etc.)
 * @example cy.loginWithFixture('validUser')
 */
Cypress.Commands.add('loginWithFixture', (userType = 'validUser') => {
  cy.fixture('users').then((users) => {
    const user = users[userType];
    cy.login(user.username, user.password);
  });
});

/**
 * Login using environment variables
 * @example cy.loginUser()
 */
Cypress.Commands.add('loginUser', () => {
  const username = Cypress.env('username') || 'testuser';
  const password = Cypress.env('password') || 'Password123!';
  cy.login(username, password);
});

/**
 * Logout user
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.getByTestId('sidenav-signout').click();
  cy.url().should('include', '/login');
  cy.clearCookies();
  cy.clearLocalStorage();
});

// ===== Data Seeding Commands =====

/**
 * Seed test data via API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to seed
 * @example cy.seedData('/api/transactions', { amount: 100 })
 */
Cypress.Commands.add('seedData', (endpoint, data) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001';

  cy.request({
    method: 'POST',
    url: `${apiUrl}${endpoint}`,
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
    return cy.wrap(response.body);
  });
});

/**
 * Seed multiple transactions
 * @param {number} count - Number of transactions to create
 * @example cy.seedTransactions(5)
 */
Cypress.Commands.add('seedTransactions', (count = 5) => {
  for (let i = 0; i < count; i++) {
    cy.seedData('/api/transactions', {
      amount: (Math.random() * 1000).toFixed(2),
      description: `Test transaction ${i + 1}`,
      type: i % 2 === 0 ? 'payment' : 'request',
    });
  }
});

/**
 * Seed notifications
 * @param {number} count - Number of notifications to create
 * @example cy.seedNotifications(3)
 */
Cypress.Commands.add('seedNotifications', (count = 3) => {
  for (let i = 0; i < count; i++) {
    cy.seedData('/api/notifications', {
      message: `Test notification ${i + 1}`,
      type: 'info',
      read: false,
    });
  }
});

// ===== State Reset Commands =====

/**
 * Reset application state
 * Clears cookies, localStorage, and resets database
 * @example cy.resetState()
 */
Cypress.Commands.add('resetState', () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });

  // Call API to reset database (if available)
  const apiUrl = Cypress.env('apiUrl');
  if (apiUrl) {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/reset`,
      failOnStatusCode: false,
    });
  }
});

/**
 * Reset user data only
 * @param {string} username - Username to reset
 * @example cy.resetUser('testuser')
 */
Cypress.Commands.add('resetUser', (username) => {
  const apiUrl = Cypress.env('apiUrl');

  if (apiUrl) {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/users/${username}/reset`,
      failOnStatusCode: false,
    });
  }
});

// ===== API Intercept Commands =====

/**
 * Intercept and stub authentication API
 * @param {string} response - Response type (success, failure)
 * @example cy.interceptAuth('success')
 */
Cypress.Commands.add('interceptAuth', (response = 'success') => {
  if (response === 'success') {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');
  } else {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Invalid credentials',
      },
    }).as('loginRequest');
  }
});

/**
 * Wait for API call to complete
 * @param {string} alias - Alias name
 * @param {number} timeout - Timeout in milliseconds
 * @example cy.waitForApi('loginRequest')
 */
Cypress.Commands.add('waitForApi', (alias, timeout = 10000) => {
  cy.wait(`@${alias}`, { timeout });
});

/*
 * Intercept and mock API response
 * @param {string} method - HTTP method
 * @param {string} url - URL pattern
 * @param {Object} response - Mock response
 * @param {string} alias - Alias name
 * @example
 */
Cypress.Commands.add('mockApi', (method, url, response, alias) => {
  cy.intercept(method, url, response).as(alias);
});

// ===== Child Commands (operate on previous subject) =====

/**
 * Stable click - waits for element to be visible and actionable
 * @example cy.get('button').stableClick()
 */
Cypress.Commands.add('stableClick', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible').should('not.be.disabled').click();
});

/**
 * Type with delay to simulate real user typing
 * @param {string} text - Text to type
 * @param {number} delay - Delay between keystrokes in ms
 * @example cy.get('input').slowType('hello', 50)
 */
Cypress.Commands.add('slowType', { prevSubject: 'element' }, (subject, text, delay = 100) => {
  cy.wrap(subject).type(text, { delay });
});

/**
 * Retry until condition is met
 * @param {Function} assertion - Assertion function
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @example cy.get('.status').retryUntil(($el) => $el.text() === 'Complete')
 */
Cypress.Commands.add(
  'retryUntil',
  { prevSubject: 'element' },
  (subject, assertion, maxRetries = 10, delay = 1000) => {
    const checkAssertion = (retriesLeft) => {
      cy.wrap(subject).then(($element) => {
        try {
          assertion($element);
        } catch (error) {
          if (retriesLeft > 0) {
            cy.wait(delay);
            checkAssertion(retriesLeft - 1);
          } else {
            throw error;
          }
        }
      });
    };

    checkAssertion(maxRetries);
  }
);

// ===== Utility Commands =====

/**
 * Take a full page screenshot with timestamp
 * @param {string} name - Screenshot name
 * @example cy.takeTimestampedScreenshot('login-page')
 */
Cypress.Commands.add('takeTimestampedScreenshot', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`, { capture: 'fullPage' });
});

/**
 * Log custom message to Cypress log
 * @param {string} message - Message to log
 * @example cy.logMessage('Starting test setup')
 */
Cypress.Commands.add('logMessage', (message) => {
  cy.task('log', message);
});

/**
 * Wait for network to be idle
 * @param {number} timeout - Timeout in milliseconds
 * @example cy.waitForNetworkIdle()
 */
Cypress.Commands.add('waitForNetworkIdle', (timeout = 2000) => {
  cy.intercept('**/*').as('allRequests');
  cy.wait(timeout);
});

// ===== Test Data Management Commands =====

/**
 * Create test data using seed factory
 * @param {string} entityType - Type of entity (user, transaction, product, order)
 * @param {Object} data - Entity data
 * @example cy.createTestData('user', { role: 'admin' })
 */
Cypress.Commands.add('createTestData', (entityType, data = {}) => {
  return cy.task(`seed${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`, data);
});

/**
 * Cleanup specific entity
 * @param {string} entityType - Type of entity
 * @param {string} id - Entity ID
 * @example cy.cleanupEntity('users', 'user-123')
 */
Cypress.Commands.add('cleanupEntity', (entityType, id) => {
  return cy.task('cleanupEntity', { type: entityType, id });
});

/**
 * Cleanup all entities in a namespace
 * @param {string} namespace - Test namespace
 * @example cy.cleanupNamespace('test-run-12345')
 */
Cypress.Commands.add('cleanupNamespace', (namespace) => {
  return cy.task('cleanupByNamespace', { namespace });
});

/**
 * Reset database to clean state (for local/CI only)
 * @example cy.resetDatabase()
 */
Cypress.Commands.add('resetDatabase', () => {
  return cy.task('resetDatabase');
});

/**
 * Load fixture data and create entities
 * @param {string} fixtureName - Name of fixture file
 * @param {string} fixtureKey - Key within fixture
 * @example cy.seedFromFixture('users', 'admin')
 */
Cypress.Commands.add('seedFromFixture', (fixtureName, fixtureKey) => {
  return cy.fixture(fixtureName).then((fixtures) => {
    const data = fixtures[fixtureKey];

    if (!data) {
      throw new Error(`Fixture key '${fixtureKey}' not found in ${fixtureName}.json`);
    }

    // Determine entity type from fixture name
    const entityType = fixtureName.slice(0, -1); // Remove 's' from plural
    return cy.createTestData(entityType, data);
  });
});
