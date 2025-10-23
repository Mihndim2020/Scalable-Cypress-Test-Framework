/**
 * Network Stubbing Strategy
 * Centralized network mocking for third-party services
 */

/**
 * Stub analytics and tracking services
 * Prevents external calls that can cause flakiness
 */
export const stubAnalytics = () => {
  // Google Analytics
  cy.intercept('**google-analytics.com/**', { statusCode: 200, body: {} }).as('googleAnalytics');
  cy.intercept('**googletagmanager.com/**', { statusCode: 200, body: {} }).as('googleTagManager');

  // Facebook Pixel
  cy.intercept('**facebook.com/tr**', { statusCode: 200, body: {} }).as('facebookPixel');

  // Mixpanel
  cy.intercept('**mixpanel.com/**', { statusCode: 200, body: {} }).as('mixpanel');

  // Segment
  cy.intercept('**segment.com/**', { statusCode: 200, body: {} }).as('segment');

  // Amplitude
  cy.intercept('**amplitude.com/**', { statusCode: 200, body: {} }).as('amplitude');
};

/**
 * Stub advertising and marketing services
 */
export const stubAdvertising = () => {
  // Google Ads
  cy.intercept('**googleadservices.com/**', { statusCode: 200, body: {} }).as('googleAds');
  cy.intercept('**doubleclick.net/**', { statusCode: 200, body: {} }).as('doubleclick');

  // Facebook Ads
  cy.intercept('**facebook.com/plugins/**', { statusCode: 200, body: {} }).as('facebookAds');

  // Twitter Ads
  cy.intercept('**ads-twitter.com/**', { statusCode: 200, body: {} }).as('twitterAds');
};

/**
 * Stub external font services
 */
export const stubFonts = () => {
  // Google Fonts
  cy.intercept('**fonts.googleapis.com/**', {
    statusCode: 200,
    headers: { 'Content-Type': 'text/css' },
    body: '',
  }).as('googleFonts');

  cy.intercept('**fonts.gstatic.com/**', {
    statusCode: 200,
    headers: { 'Content-Type': 'font/woff2' },
    body: '',
  }).as('googleFontsStatic');

  // Adobe Fonts
  cy.intercept('**use.typekit.net/**', {
    statusCode: 200,
    headers: { 'Content-Type': 'text/css' },
    body: '',
  }).as('adobeFonts');
};

/**
 * Stub CDN resources
 */
export const stubCDN = () => {
  // Cloudflare CDN
  cy.intercept('**cdnjs.cloudflare.com/**', (req) => {
    req.reply({
      statusCode: 200,
      headers: { 'Content-Type': 'application/javascript' },
      body: '// Stubbed CDN resource',
    });
  }).as('cloudflare');

  // JSDelivr
  cy.intercept('**cdn.jsdelivr.net/**', (req) => {
    req.reply({
      statusCode: 200,
      headers: { 'Content-Type': 'application/javascript' },
      body: '// Stubbed CDN resource',
    });
  }).as('jsdelivr');
};

/**
 * Stub chat and support widgets
 */
export const stubChatWidgets = () => {
  // Intercom
  cy.intercept('**intercom.io/**', { statusCode: 200, body: {} }).as('intercom');

  // Zendesk
  cy.intercept('**zendesk.com/**', { statusCode: 200, body: {} }).as('zendesk');

  // LiveChat
  cy.intercept('**livechatinc.com/**', { statusCode: 200, body: {} }).as('livechat');

  // Drift
  cy.intercept('**drift.com/**', { statusCode: 200, body: {} }).as('drift');
};

/**
 * Stub error tracking services
 */
export const stubErrorTracking = () => {
  // Sentry
  cy.intercept('**sentry.io/**', { statusCode: 200, body: {} }).as('sentry');

  // Bugsnag
  cy.intercept('**bugsnag.com/**', { statusCode: 200, body: {} }).as('bugsnag');

  // Rollbar
  cy.intercept('**rollbar.com/**', { statusCode: 200, body: {} }).as('rollbar');
};

/**
 * Stub all non-essential third-party services
 */
export const stubAllThirdParty = () => {
  stubAnalytics();
  stubAdvertising();
  stubFonts();
  stubCDN();
  stubChatWidgets();
  stubErrorTracking();

  cy.log('🔇 Stubbed all third-party services');
};

/**
 * Allow real backend API calls
 * Only intercepts for monitoring, doesn't stub
 */
export const allowRealBackend = (baseUrl = Cypress.env('apiUrl')) => {
  cy.intercept(`${baseUrl}/**`, (req) => {
    // Log the request but let it through
    cy.log(`API: ${req.method} ${req.url}`);
    req.continue();
  }).as('backendRequest');

  cy.log('✅ Allowing real backend API calls');
};

/**
 * Stub backend with delay to simulate slow network
 * Useful for testing loading states
 */
export const stubBackendWithDelay = (baseUrl, delay = 1000) => {
  cy.intercept(`${baseUrl}/**`, (req) => {
    req.continue((res) => {
      res.delay = delay;
    });
  }).as('delayedBackend');

  cy.log(`⏱️ Backend responses delayed by ${delay}ms`);
};

/**
 * Stub specific backend endpoints while allowing others
 */
export const selectiveStub = (stubs = []) => {
  stubs.forEach(({ method = 'GET', url, response, statusCode = 200, delay = 0 }) => {
    cy.intercept(method, url, (req) => {
      setTimeout(() => {
        req.reply({
          statusCode,
          body: response,
        });
      }, delay);
    }).as(`stub_${method}_${url.replace(/[^a-zA-Z0-9]/g, '_')}`);
  });

  cy.log(`🎯 Stubbed ${stubs.length} specific endpoints`);
};

/**
 * Stub with fixtures
 * Load response data from fixture files
 */
export const stubWithFixtures = (mappings = []) => {
  mappings.forEach(({ method = 'GET', url, fixture, statusCode = 200 }) => {
    cy.intercept(method, url, {
      statusCode,
      fixture,
    }).as(`fixture_${method}_${url.replace(/[^a-zA-Z0-9]/g, '_')}`);
  });

  cy.log(`📁 Stubbed ${mappings.length} endpoints with fixtures`);
};

/**
 * Network error simulation
 * Force network errors for testing error states
 */
export const forceNetworkError = (url) => {
  cy.intercept(url, { forceNetworkError: true }).as('networkError');
  cy.log(`❌ Forcing network error for ${url}`);
};

/**
 * Slow network simulation
 * Simulate slow 3G connection
 */
export const simulateSlowNetwork = () => {
  cy.intercept('**/*', (req) => {
    req.continue((res) => {
      // Simulate slow 3G: 750ms RTT, 250-750Kbps throughput
      res.delay = Math.random() * 500 + 500; // 500-1000ms delay
    });
  }).as('slowNetwork');

  cy.log('🐌 Simulating slow network');
};

/**
 * Offline mode simulation
 */
export const simulateOffline = () => {
  cy.intercept('**/*', { forceNetworkError: true }).as('offline');
  cy.log('📴 Simulating offline mode');
};

/**
 * Conditional stubbing based on environment
 */
export const environmentAwareStubbing = () => {
  const env = Cypress.env('environment') || 'local';
  const isCI = Cypress.env('CI') === 'true';

  // Always stub third-party in CI
  if (isCI) {
    stubAllThirdParty();
  }

  // Environment-specific stubbing
  switch (env) {
    case 'local':
      // Minimal stubbing in local development
      stubAnalytics();
      break;

    case 'ci':
      // Comprehensive stubbing in CI
      stubAllThirdParty();
      break;

    case 'staging':
      // Only stub analytics and ads in staging
      stubAnalytics();
      stubAdvertising();
      allowRealBackend();
      break;

    case 'production':
      // No stubbing in production (e2e tests only)
      allowRealBackend();
      break;

    default:
      // Default: stub third-party only
      stubAllThirdParty();
  }

  cy.log(`🌐 Network stubbing configured for ${env} environment`);
};

/**
 * Request count tracker
 * Track number of requests to specific URLs
 */
export const trackRequests = (pattern) => {
  const requests = [];

  cy.intercept(pattern, (req) => {
    requests.push({
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    req.continue();
  }).as('trackedRequests');

  return requests;
};

// Export all stubbing functions
export default {
  stubAnalytics,
  stubAdvertising,
  stubFonts,
  stubCDN,
  stubChatWidgets,
  stubErrorTracking,
  stubAllThirdParty,
  allowRealBackend,
  stubBackendWithDelay,
  selectiveStub,
  stubWithFixtures,
  forceNetworkError,
  simulateSlowNetwork,
  simulateOffline,
  environmentAwareStubbing,
  trackRequests,
};
