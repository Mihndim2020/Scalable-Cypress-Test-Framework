/**
 * Reliability Helpers
 * Utilities to make tests more stable and reduce flakiness
 */

/**
 * Advanced retry utility that polls until a condition is met
 * @param {Function} checkFn - Function that performs the check (should return boolean or throw)
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Maximum time to retry (ms)
 * @param {number} options.interval - Time between retries (ms)
 * @param {string} options.errorMessage - Custom error message on failure
 * @param {boolean} options.log - Whether to log retry attempts
 * @returns {Cypress.Chainable}
 *
 * @example
 * // Wait for API response
 * retryUntil(
 *   () => cy.request('/api/status').its('body.status').should('eq', 'ready'),
 *   { timeout: 10000, interval: 500 }
 * );
 *
 * @example
 * // Wait for DOM state
 * retryUntil(
 *   () => cy.get('[data-cy="count"]').invoke('text').then(text => parseInt(text) > 5),
 *   { timeout: 5000, interval: 200, errorMessage: 'Count never exceeded 5' }
 * );
 */
export const retryUntil = (checkFn, options = {}) => {
  const {
    timeout = 10000,
    interval = 500,
    errorMessage = 'Condition not met within timeout',
    log = true,
  } = options;

  const startTime = Date.now();
  let attemptCount = 0;

  const attempt = () => {
    attemptCount++;
    const elapsedTime = Date.now() - startTime;

    if (log) {
      cy.log(`Retry attempt ${attemptCount} (${elapsedTime}ms elapsed)`);
    }

    return cy.wrap(null).then(() => {
      try {
        const result = checkFn();

        // Handle promises/chainables
        if (result && typeof result.then === 'function') {
          return cy.wrap(result).then((value) => {
            if (value === true || value === undefined) {
              return cy.wrap(value);
            }
            throw new Error('Condition not met');
          });
        }

        // Handle synchronous results
        if (result === true) {
          return cy.wrap(result);
        }

        throw new Error('Condition not met');
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          throw new Error(`${errorMessage} (${attemptCount} attempts, ${elapsedTime}ms elapsed)`);
        }

        // Wait and retry
        return cy.wait(interval).then(() => attempt());
      }
    });
  };

  return attempt();
};

/**
 * Wait for API endpoint to return expected response
 * @param {string} url - API endpoint URL
 * @param {Object} options - Configuration options
 * @param {number} options.expectedStatus - Expected HTTP status code
 * @param {Function} options.validateResponse - Function to validate response body
 * @param {number} options.timeout - Maximum wait time (ms)
 * @param {number} options.interval - Poll interval (ms)
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForApiReady('/api/health', {
 *   validateResponse: (body) => body.status === 'healthy',
 *   timeout: 30000
 * });
 */
export const waitForApiReady = (url, options = {}) => {
  const {
    expectedStatus = 200,
    validateResponse = () => true,
    timeout = 30000,
    interval = 1000,
  } = options;

  return retryUntil(
    () => {
      return cy.request({ url, failOnStatusCode: false }).then((response) => {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }

        if (!validateResponse(response.body)) {
          throw new Error('Response validation failed');
        }

        return true;
      });
    },
    {
      timeout,
      interval,
      errorMessage: `API at ${url} not ready`,
    }
  );
};

/**
 * Wait for element to have specific text content
 * @param {string} selector - Element selector
 * @param {string} expectedText - Expected text content
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForText('[data-cy="status"]', 'Complete', { timeout: 5000 });
 */
export const waitForText = (selector, expectedText, options = {}) => {
  const { timeout = 10000, interval = 200 } = options;

  return retryUntil(
    () => {
      return cy.get(selector).invoke('text').then((text) => {
        if (text.trim() === expectedText.trim()) {
          return true;
        }
        throw new Error(`Expected "${expectedText}", got "${text}"`);
      });
    },
    {
      timeout,
      interval,
      errorMessage: `Element ${selector} never displayed "${expectedText}"`,
    }
  );
};

/**
 * Wait for element to have specific attribute value
 * @param {string} selector - Element selector
 * @param {string} attribute - Attribute name
 * @param {string} expectedValue - Expected attribute value
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForAttribute('[data-cy="button"]', 'disabled', 'false');
 */
export const waitForAttribute = (selector, attribute, expectedValue, options = {}) => {
  const { timeout = 10000, interval = 200 } = options;

  return retryUntil(
    () => {
      return cy.get(selector).invoke('attr', attribute).then((value) => {
        if (value === expectedValue) {
          return true;
        }
        throw new Error(`Expected ${attribute}="${expectedValue}", got "${value}"`);
      });
    },
    {
      timeout,
      interval,
      errorMessage: `Element ${selector} ${attribute} never became "${expectedValue}"`,
    }
  );
};

/**
 * Wait for element count to match expected value
 * @param {string} selector - Element selector
 * @param {number} expectedCount - Expected number of elements
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForCount('[data-cy="list-item"]', 5, { timeout: 3000 });
 */
export const waitForCount = (selector, expectedCount, options = {}) => {
  const { timeout = 10000, interval = 200 } = options;

  return retryUntil(
    () => {
      return cy.get(selector).then(($elements) => {
        if ($elements.length === expectedCount) {
          return true;
        }
        throw new Error(`Expected ${expectedCount} elements, found ${$elements.length}`);
      });
    },
    {
      timeout,
      interval,
      errorMessage: `Element count for ${selector} never reached ${expectedCount}`,
    }
  );
};

/**
 * Wait for element to become stable (not changing)
 * Useful for waiting for animations or loading states
 * @param {string} selector - Element selector
 * @param {Object} options - Configuration options
 * @param {string} options.property - Property to check (text, width, etc.)
 * @param {number} options.stableFor - How long value must be stable (ms)
 * @param {number} options.timeout - Maximum wait time (ms)
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForStable('[data-cy="count"]', { property: 'text', stableFor: 500 });
 */
export const waitForStable = (selector, options = {}) => {
  const {
    property = 'text',
    stableFor = 1000,
    timeout = 10000,
    interval = 100,
  } = options;

  let lastValue = null;
  let stableStartTime = null;

  return retryUntil(
    () => {
      return cy.get(selector).then(($el) => {
        let currentValue;

        if (property === 'text') {
          currentValue = $el.text();
        } else if (property === 'html') {
          currentValue = $el.html();
        } else {
          currentValue = $el.css(property);
        }

        if (currentValue !== lastValue) {
          lastValue = currentValue;
          stableStartTime = Date.now();
          throw new Error('Value changed');
        }

        const stableDuration = Date.now() - stableStartTime;
        if (stableDuration >= stableFor) {
          return true;
        }

        throw new Error(`Stable for ${stableDuration}ms, need ${stableFor}ms`);
      });
    },
    {
      timeout,
      interval,
      errorMessage: `Element ${selector} ${property} never became stable`,
      log: false,
    }
  );
};

/**
 * Wait for network to be idle (no pending requests)
 * @param {Object} options - Configuration options
 * @param {number} options.idleTime - How long to wait with no requests (ms)
 * @param {number} options.timeout - Maximum wait time (ms)
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
 */
export const waitForNetworkIdle = (options = {}) => {
  const { idleTime = 500, timeout = 10000 } = options;

  let lastRequestTime = Date.now();
  let requestCount = 0;

  // Intercept all requests
  cy.intercept('**/*', (req) => {
    lastRequestTime = Date.now();
    requestCount++;
    req.continue();
  });

  return retryUntil(
    () => {
      const idleDuration = Date.now() - lastRequestTime;
      if (idleDuration >= idleTime) {
        cy.log(`Network idle (${requestCount} requests completed)`);
        return true;
      }
      throw new Error(`Idle for ${idleDuration}ms, need ${idleTime}ms`);
    },
    {
      timeout,
      interval: 100,
      errorMessage: 'Network never became idle',
      log: false,
    }
  );
};

/**
 * Wait for local storage item to have expected value
 * @param {string} key - Local storage key
 * @param {*} expectedValue - Expected value (will be JSON parsed)
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForLocalStorage('user', { id: 123 });
 */
export const waitForLocalStorage = (key, expectedValue, options = {}) => {
  const { timeout = 5000, interval = 200 } = options;

  return retryUntil(
    () => {
      return cy.window().then((win) => {
        const value = win.localStorage.getItem(key);
        const parsedValue = value ? JSON.parse(value) : null;

        if (JSON.stringify(parsedValue) === JSON.stringify(expectedValue)) {
          return true;
        }

        throw new Error(
          `Expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(parsedValue)}`
        );
      });
    },
    {
      timeout,
      interval,
      errorMessage: `LocalStorage ${key} never matched expected value`,
    }
  );
};

/**
 * Wait for URL to match expected pattern
 * @param {string|RegExp} pattern - URL pattern to match
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitForUrl('/dashboard');
 * waitForUrl(/\/user\/\d+/);
 */
export const waitForUrl = (pattern, options = {}) => {
  const { timeout = 10000, interval = 100 } = options;

  return retryUntil(
    () => {
      return cy.url().then((url) => {
        const matches =
          typeof pattern === 'string'
            ? url.includes(pattern)
            : pattern.test(url);

        if (matches) {
          return true;
        }

        throw new Error(`URL "${url}" doesn't match pattern "${pattern}"`);
      });
    },
    {
      timeout,
      interval,
      errorMessage: `URL never matched pattern "${pattern}"`,
    }
  );
};

/**
 * Wait for condition with exponential backoff
 * Useful for expensive operations
 * @param {Function} checkFn - Function to check condition
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * waitWithBackoff(() => cy.request('/api/status').its('body.ready'));
 */
export const waitWithBackoff = (checkFn, options = {}) => {
  const {
    initialInterval = 100,
    maxInterval = 5000,
    backoffMultiplier = 2,
    timeout = 30000,
  } = options;

  let currentInterval = initialInterval;
  const startTime = Date.now();

  const attempt = () => {
    return cy.wrap(null).then(() => {
      try {
        const result = checkFn();

        if (result && typeof result.then === 'function') {
          return cy.wrap(result).then((value) => {
            if (value === true || value === undefined) {
              return cy.wrap(value);
            }
            throw new Error('Condition not met');
          });
        }

        if (result === true) {
          return cy.wrap(result);
        }

        throw new Error('Condition not met');
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          throw error;
        }

        const waitTime = Math.min(currentInterval, maxInterval);
        currentInterval *= backoffMultiplier;

        return cy.wait(waitTime).then(() => attempt());
      }
    });
  };

  return attempt();
};

/**
 * Replace fragile cy.wait(milliseconds) with intelligent waiting
 * @param {string} alias - Request alias to wait for
 * @param {Object} options - Configuration options
 * @returns {Cypress.Chainable}
 *
 * @example
 * cy.intercept('/api/login').as('loginRequest');
 * smartWait('@loginRequest', { timeout: 5000 });
 */
export const smartWait = (alias, options = {}) => {
  const { timeout = 10000, validateResponse } = options;

  return cy.wait(alias, { timeout }).then((interception) => {
    if (validateResponse) {
      validateResponse(interception.response);
    }
    return cy.wrap(interception);
  });
};

// Export all helpers
export default {
  retryUntil,
  waitForApiReady,
  waitForText,
  waitForAttribute,
  waitForCount,
  waitForStable,
  waitForNetworkIdle,
  waitForLocalStorage,
  waitForUrl,
  waitWithBackoff,
  smartWait,
};
