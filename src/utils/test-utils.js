/**
 * Test Utilities Module
 * Reusable helper functions for test automation
 */

/**
 * API Helper Functions
 */

/**
 * Wait for API call to complete and verify response
 * @param {string} alias - Cypress alias for the intercepted request
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Cypress.Chainable} API response
 * @example waitForApi('loginRequest', 200)
 */
export const waitForApi = (alias, expectedStatus = 200, timeout = 10000) => {
  return cy.wait(`@${alias}`, { timeout }).then((interception) => {
    expect(interception.response.statusCode).to.eq(expectedStatus);
    return cy.wrap(interception.response.body);
  });
};

/**
 * Intercept authentication endpoints
 * @param {boolean} shouldSucceed - Whether auth should succeed
 * @returns {void}
 * @example interceptAuth(true)
 */
export const interceptAuth = (shouldSucceed = true) => {
  if (shouldSucceed) {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        token: 'fake-jwt-token-' + Date.now(),
      },
      headers: {
        'content-type': 'application/json',
      },
    }).as('authRequest');
  } else {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Username or password is invalid',
      },
      headers: {
        'content-type': 'application/json',
      },
    }).as('authRequest');
  }
};

/**
 * Intercept API endpoint with custom response
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} urlPattern - URL pattern to match
 * @param {Object} responseData - Response data to return
 * @param {string} alias - Alias for the intercept
 * @param {number} statusCode - HTTP status code
 * @returns {void}
 * @example interceptEndpoint('GET', '**/api/transactions', { data: [] }, 'getTransactions')
 */
export const interceptEndpoint = (
  method,
  urlPattern,
  responseData,
  alias,
  statusCode = 200
) => {
  cy.intercept(method, urlPattern, {
    statusCode,
    body: responseData,
    headers: {
      'content-type': 'application/json',
    },
  }).as(alias);
};

/**
 * Intercept and delay API response
 * @param {string} method - HTTP method
 * @param {string} urlPattern - URL pattern to match
 * @param {number} delay - Delay in milliseconds
 * @param {string} alias - Alias for the intercept
 * @returns {void}
 * @example interceptWithDelay('GET', '**/api/transactions', 3000, 'slowTransactions')
 */
export const interceptWithDelay = (method, urlPattern, delay, alias) => {
  cy.intercept(method, urlPattern, (req) => {
    req.reply((res) => {
      res.setDelay(delay);
    });
  }).as(alias);
};

/**
 * DOM Interaction Helpers
 */

/**
 * Stable click - waits for element to be actionable before clicking
 * @param {string} selector - CSS selector or data-test attribute value
 * @param {boolean} useTestId - Whether to use data-test attribute
 * @returns {void}
 * @example stableClick('submit-button', true)
 */
export const stableClick = (selector, useTestId = true) => {
  const element = useTestId ? cy.getByTestId(selector) : cy.get(selector);

  element
    .should('exist')
    .should('be.visible')
    .should('not.be.disabled')
    .click({ force: false });
};

/**
 * Safe type - clears input and types with validation
 * @param {string} selector - CSS selector or data-test attribute value
 * @param {string} text - Text to type
 * @param {boolean} useTestId - Whether to use data-test attribute
 * @returns {void}
 * @example safeType('username', 'testuser')
 */
export const safeType = (selector, text, useTestId = true) => {
  const element = useTestId ? cy.getByTestId(selector) : cy.get(selector);

  element
    .should('be.visible')
    .should('not.be.disabled')
    .clear()
    .type(text)
    .should('have.value', text);
};

/**
 * Retry until condition is met
 * @param {Function} checkFunction - Function that performs the check
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Cypress.Chainable}
 * @example retryUntil(() => cy.get('.status').should('contain', 'Complete'), 5, 1000)
 */
export const retryUntil = (checkFunction, maxRetries = 10, retryDelay = 1000) => {
  const attempt = (retriesLeft) => {
    if (retriesLeft <= 0) {
      throw new Error('Max retries exceeded');
    }

    return cy.then(() => {
      try {
        return checkFunction();
      } catch (error) {
        cy.wait(retryDelay);
        return attempt(retriesLeft - 1);
      }
    });
  };

  return attempt(maxRetries);
};

/**
 * Wait for element to appear and be visible
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Cypress.Chainable}
 * @example waitForElement('.loading-spinner', 5000)
 */
export const waitForElement = (selector, timeout = 10000) => {
  return cy.get(selector, { timeout }).should('be.visible');
};

/**
 * Wait for element to disappear
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {void}
 * @example waitForElementToDisappear('.loading-spinner', 5000)
 */
export const waitForElementToDisappear = (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('not.exist');
};

/**
 * Scroll element into view and click
 * @param {string} selector - CSS selector
 * @param {boolean} useTestId - Whether to use data-test attribute
 * @returns {void}
 * @example scrollAndClick('submit-button')
 */
export const scrollAndClick = (selector, useTestId = true) => {
  const element = useTestId ? cy.getByTestId(selector) : cy.get(selector);
  element.scrollIntoView().should('be.visible').click();
};

/**
 * Data Generation Helpers
 */

/**
 * Generate random email address
 * @param {string} prefix - Email prefix
 * @returns {string} Random email
 * @example generateRandomEmail('test')
 */
export const generateRandomEmail = (prefix = 'test') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}@example.com`;
};

/**
 * Generate random username
 * @param {string} prefix - Username prefix
 * @returns {string} Random username
 * @example generateRandomUsername('user')
 */
export const generateRandomUsername = (prefix = 'user') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 * @example generateRandomString(10)
 */
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random number in range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 * @example generateRandomNumber(1, 100)
 */
export const generateRandomNumber = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency
 * @example formatCurrency(1234.56, '$')
 */
export const formatCurrency = (amount, currency = '$') => {
  return `${currency}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * Date and Time Helpers
 */

/**
 * Format date to string
 * @param {Date} date - Date object
 * @param {string} format - Format string
 * @returns {string} Formatted date
 * @example formatDate(new Date(), 'YYYY-MM-DD')
 */
export const formatDate = (date = new Date(), format = 'YYYY-MM-DD') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Get date in the past
 * @param {number} days - Number of days in the past
 * @returns {Date} Past date
 * @example getPastDate(7)
 */
export const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Get date in the future
 * @param {number} days - Number of days in the future
 * @returns {Date} Future date
 * @example getFutureDate(7)
 */
export const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Validation Helpers
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 * @example isValidEmail('test@example.com')
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 * @example isValidUrl('https://example.com')
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Environment Helpers
 */

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 * @example getEnv('apiUrl', 'http://localhost:3001')
 */
export const getEnv = (key, defaultValue = '') => {
  return Cypress.env(key) || defaultValue;
};

/**
 * Check if running in CI environment
 * @returns {boolean} Whether running in CI
 * @example isCI()
 */
export const isCI = () => {
  return Cypress.env('CI') === true || process.env.CI === 'true';
};

/**
 * Storage Helpers
 */

/**
 * Set local storage item
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {void}
 * @example setLocalStorage('token', 'abc123')
 */
export const setLocalStorage = (key, value) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, JSON.stringify(value));
  });
};

/**
 * Get local storage item
 * @param {string} key - Storage key
 * @returns {Cypress.Chainable} Stored value
 * @example getLocalStorage('token')
 */
export const getLocalStorage = (key) => {
  return cy.window().then((win) => {
    const value = win.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  });
};

/**
 * Clear all local storage
 * @returns {void}
 * @example clearAllStorage()
 */
export const clearAllStorage = () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
};

/**
 * Logging Helpers
 */

/**
 * Log to Cypress terminal
 * @param {string} message - Message to log
 * @param {*} data - Additional data to log
 * @returns {void}
 * @example logToTerminal('Test started', { testName: 'Login Test' })
 */
export const logToTerminal = (message, data = null) => {
  cy.task('log', data ? `${message}: ${JSON.stringify(data)}` : message);
};

/**
 * Log table to Cypress terminal
 * @param {Array|Object} data - Data to display as table
 * @returns {void}
 * @example logTable([{ name: 'Test 1', status: 'Passed' }])
 */
export const logTable = (data) => {
  cy.task('table', data);
};

// Default export with all utilities
export default {
  // API Helpers
  waitForApi,
  interceptAuth,
  interceptEndpoint,
  interceptWithDelay,

  // DOM Helpers
  stableClick,
  safeType,
  retryUntil,
  waitForElement,
  waitForElementToDisappear,
  scrollAndClick,

  // Data Generation
  generateRandomEmail,
  generateRandomUsername,
  generateRandomString,
  generateRandomNumber,
  formatCurrency,

  // Date Helpers
  formatDate,
  getPastDate,
  getFutureDate,

  // Validation
  isValidEmail,
  isValidUrl,

  // Environment
  getEnv,
  isCI,

  // Storage
  setLocalStorage,
  getLocalStorage,
  clearAllStorage,

  // Logging
  logToTerminal,
  logTable,
};
