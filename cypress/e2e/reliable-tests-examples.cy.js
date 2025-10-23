/**
 * Reliable Test Examples
 * Demonstrates best practices for stable, non-flaky tests
 */

import { LoginPage, DashboardPage } from '../../src/pages';
import {
  retryUntil,
  waitForText,
  waitForCount,
  waitForStable,
  waitForApiReady,
  waitForUrl,
} from '../../src/utils';
import { TIMEOUTS } from '../support/test-config';
import { stubAllThirdParty, allowRealBackend } from '../support/network-stubs';

describe('Reliable Test Patterns', () => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();

  beforeEach(() => {
    // Stub third-party services to prevent external dependencies
    stubAllThirdParty();

    // Allow real backend for integration tests
    allowRealBackend();

    cy.resetState();
  });

  context('❌ FRAGILE PATTERNS (AVOID)', () => {
    it.skip('BAD: Using arbitrary cy.wait()', () => {
      // ❌ FRAGILE: Fixed wait time is unreliable
      loginPage.load();
      cy.wait(2000); // BAD: What if page loads faster/slower?
      loginPage.login('user', 'pass');
    });

    it.skip('BAD: Using nth-child selectors', () => {
      // ❌ FRAGILE: Breaks when DOM structure changes
      cy.get('div.container > div:nth-child(3) > button').click();
    });

    it.skip('BAD: Using class names as primary selectors', () => {
      // ❌ FRAGILE: CSS classes change frequently
      cy.get('.btn-primary.submit-button').click();
    });

    it.skip('BAD: Using text content for selection', () => {
      // ❌ FRAGILE: Breaks with text changes or i18n
      cy.contains('Submit Form').click();
    });
  });

  context('✅ RELIABLE PATTERNS (USE THESE)', () => {
    it('GOOD: Using data-cy selectors', () => {
      // ✅ STABLE: Independent of styling and structure
      cy.getByCy('login-submit').click();
    });

    it('GOOD: Using retryUntil instead of cy.wait', () => {
      loginPage.load();

      // ✅ STABLE: Wait for actual condition instead of fixed time
      retryUntil(
        () => cy.getByCy('login-form').should('be.visible'),
        { timeout: TIMEOUTS.element.default }
      );

      loginPage.loginWithEnv();
    });

    it('GOOD: Using waitForText for dynamic content', () => {
      cy.getByCy('status-indicator').should('exist');

      // ✅ STABLE: Wait for specific text to appear
      waitForText('[data-cy="status-indicator"]', 'Ready', {
        timeout: TIMEOUTS.element.medium,
      });
    });

    it('GOOD: Using waitForCount for lists', () => {
      dashboardPage.load();

      // Seed 5 transactions
      cy.seedTransactions(5);

      // ✅ STABLE: Wait for specific count instead of arbitrary delay
      waitForCount('[data-cy="transaction-item"]', 5, {
        timeout: TIMEOUTS.api.default,
      });
    });

    it('GOOD: Using waitForStable for animations', () => {
      // Click button that triggers animation
      cy.getByCy('animate-button').click();

      // ✅ STABLE: Wait for animation to complete
      waitForStable('[data-cy="animated-element"]', {
        property: 'width',
        stableFor: TIMEOUTS.animation.medium,
      });
    });

    it('GOOD: Using waitForUrl for navigation', () => {
      loginPage.load();
      loginPage.loginWithEnv();

      // ✅ STABLE: Wait for URL change instead of fixed delay
      waitForUrl('/dashboard', { timeout: TIMEOUTS.pageLoad.default });

      dashboardPage.verifyPageLoaded();
    });
  });

  context('API Waiting Patterns', () => {
    it('BAD: Arbitrary wait for API', () => {
      cy.intercept('POST', '/api/login').as('loginRequest');

      loginPage.load();
      loginPage.loginWithEnv();

      // ❌ FRAGILE: What if API is slow?
      cy.wait(3000);

      // Better but still not ideal
      cy.wait('@loginRequest');
    });

    it('GOOD: Wait for API with validation', () => {
      cy.intercept('POST', '/api/login').as('loginRequest');

      loginPage.load();
      loginPage.loginWithEnv();

      // ✅ STABLE: Wait for API and validate response
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.body).to.have.property('token');
      });

      dashboardPage.verifyPageLoaded();
    });

    it('GOOD: Wait for API to be ready', () => {
      // ✅ STABLE: Poll API until it's ready
      waitForApiReady('/api/health', {
        expectedStatus: 200,
        validateResponse: (body) => body.status === 'healthy',
        timeout: TIMEOUTS.api.long,
      });

      // Now safe to proceed with tests
      loginPage.load();
    });

    it('GOOD: Retry until API returns expected data', () => {
      cy.intercept('GET', '/api/user/profile').as('getProfile');

      dashboardPage.load();

      // ✅ STABLE: Retry until data is loaded
      retryUntil(
        () => {
          return cy.request('/api/user/profile').then((response) => {
            if (response.body.loaded === true) {
              return true;
            }
            throw new Error('Profile not loaded yet');
          });
        },
        {
          timeout: TIMEOUTS.api.long,
          interval: TIMEOUTS.retry.normal,
          errorMessage: 'Profile never loaded',
        }
      );
    });
  });

  context('DOM Waiting Patterns', () => {
    it('GOOD: Wait for element to appear', () => {
      loginPage.load();

      // ✅ STABLE: Cypress automatically retries
      cy.getByCy('login-form', { timeout: TIMEOUTS.element.default })
        .should('be.visible');
    });

    it('GOOD: Wait for element to disappear', () => {
      loginPage.load();
      loginPage.loginWithEnv();

      // ✅ STABLE: Wait for loading spinner to disappear
      cy.getByCy('loading-spinner', { timeout: TIMEOUTS.element.long })
        .should('not.exist');

      dashboardPage.verifyPageLoaded();
    });

    it('GOOD: Wait for element attribute', () => {
      cy.getByCy('submit-button').should('exist');

      // ✅ STABLE: Wait for button to become enabled
      cy.getByCy('submit-button')
        .should('not.be.disabled')
        .and('not.have.attr', 'aria-disabled', 'true');
    });

    it('GOOD: Wait with custom retry logic', () => {
      // ✅ STABLE: Custom polling until condition met
      retryUntil(
        () => {
          return cy.getByCy('counter').invoke('text').then((text) => {
            const count = parseInt(text);
            if (count >= 10) {
              return true;
            }
            throw new Error(`Count is ${count}, need 10`);
          });
        },
        {
          timeout: TIMEOUTS.element.medium,
          interval: TIMEOUTS.retry.fast,
        }
      );
    });
  });

  context('Network Stubbing for Stability', () => {
    it('GOOD: Stub unreliable third-party services', () => {
      // Already done in beforeEach with stubAllThirdParty()

      // Verify stubs are in place
      cy.get('@googleAnalytics').should('not.be.null');
      cy.get('@googleTagManager').should('not.be.null');

      loginPage.load();
      // Third-party calls won't cause flakiness
    });

    it('GOOD: Stub slow endpoints for consistent timing', () => {
      // Stub slow endpoint with controlled delay
      cy.intercept('GET', '/api/slow-endpoint', {
        statusCode: 200,
        body: { data: 'test' },
        delay: 100, // Consistent delay
      }).as('slowEndpoint');

      cy.request('/api/slow-endpoint');
      cy.wait('@slowEndpoint');
    });

    it('GOOD: Selective stubbing - stub non-essential, allow essential', () => {
      // Stub analytics (non-essential)
      cy.intercept('POST', '/api/analytics', { statusCode: 200 }).as('analytics');

      // Allow real backend (essential for integration test)
      cy.intercept('POST', '/api/login', (req) => req.continue()).as('login');

      loginPage.load();
      loginPage.loginWithEnv();

      cy.wait('@login').its('response.statusCode').should('eq', 200);
    });
  });

  context('Handling Timing Issues', () => {
    it('GOOD: Wait for animations to complete', () => {
      cy.getByCy('dropdown-trigger').click();

      // ✅ STABLE: Wait for animation before interacting
      cy.getByCy('dropdown-menu')
        .should('be.visible')
        .and('have.css', 'opacity', '1');

      cy.getByCy('dropdown-item-1').click();
    });

    it('GOOD: Wait for async data to load', () => {
      dashboardPage.load();

      // ✅ STABLE: Wait for skeleton loader to disappear
      cy.getByCy('skeleton-loader').should('not.exist');

      // Now safe to interact with loaded content
      cy.getByCy('user-data').should('be.visible');
    });

    it('GOOD: Handle race conditions', () => {
      // Multiple async operations
      cy.intercept('GET', '/api/user').as('getUser');
      cy.intercept('GET', '/api/settings').as('getSettings');

      dashboardPage.load();

      // ✅ STABLE: Wait for all APIs to complete
      cy.wait(['@getUser', '@getSettings']);

      // Now all data is loaded
      dashboardPage.verifyPageLoaded();
    });
  });

  context('Error State Handling', () => {
    it('GOOD: Gracefully handle API errors', () => {
      // Force API error
      cy.intercept('POST', '/api/login', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('loginError');

      loginPage.load();
      loginPage.loginWithEnv();

      // ✅ STABLE: Verify error handling
      cy.wait('@loginError');
      loginPage.verifyErrorMessage('Server error');
    });

    it('GOOD: Handle network timeouts', () => {
      // Simulate slow response
      cy.intercept('POST', '/api/login', (req) => {
        req.reply((res) => {
          res.delay = 5000; // 5 second delay
        });
      }).as('slowLogin');

      loginPage.load();
      loginPage.loginWithEnv();

      // ✅ STABLE: Wait with appropriate timeout
      cy.wait('@slowLogin', { timeout: TIMEOUTS.api.long });
    });
  });

  context('Cleanup and Isolation', () => {
    it('GOOD: Reset state before test', () => {
      // ✅ STABLE: Clean slate for each test
      cy.resetState();

      loginPage.load();
      loginPage.verifyPageLoaded();
    });

    it('GOOD: Use unique test data', () => {
      const uniqueEmail = `test_${Date.now()}@example.com`;

      // ✅ STABLE: No conflicts with other tests
      cy.getByCy('email-input').type(uniqueEmail);
    });

    it('GOOD: Cleanup after test', () => {
      const userId = `user_${Date.now()}`;

      // Create test data
      cy.createTestData('user', { id: userId });

      // ... run test ...

      // ✅ STABLE: Cleanup to prevent interference
      cy.cleanupEntity('users', userId);
    });
  });
});
