/**
 * Centralized Test Configuration
 * All timeouts, retries, and test behavior configuration in one place
 */

// Environment detection
const isCI = Cypress.env('CI') === 'true' || Cypress.env('CI') === true;
const environment = Cypress.env('environment') || 'local';

/**
 * Timeout Configuration
 * All timeout values in milliseconds
 */
export const TIMEOUTS = {
  // Element interaction timeouts
  element: {
    default: 10000,
    short: 5000,
    medium: 15000,
    long: 30000,
  },

  // API request timeouts
  api: {
    default: 10000,
    short: 5000,
    long: 30000,
    veryLong: 60000,
  },

  // Page load timeouts
  pageLoad: {
    default: 60000,
    fast: 30000,
    slow: 90000,
  },

  // Network timeouts
  network: {
    idle: 2000,      // How long network should be idle
    response: 30000, // Max time to wait for response
  },

  // Animation timeouts
  animation: {
    short: 300,
    medium: 500,
    long: 1000,
  },

  // Retry intervals
  retry: {
    fast: 100,
    normal: 500,
    slow: 1000,
  },

  // Stability timeouts
  stability: {
    default: 1000,
    fast: 500,
    slow: 2000,
  },
};

/**
 * Retry Configuration
 * Number of retry attempts for various operations
 */
export const RETRIES = {
  // Test retries (CI vs local)
  test: {
    runMode: isCI ? 2 : 1,
    openMode: 0,
  },

  // API call retries
  api: {
    default: 3,
    critical: 5,
    nonCritical: 2,
  },

  // Element interaction retries
  element: {
    default: 3,
    stubborn: 5, // For elements that are slow to load
  },

  // Maximum retry attempts
  max: 10,
};

/**
 * Wait Strategy Configuration
 */
export const WAIT_STRATEGY = {
  // Use intelligent waiting instead of fixed waits
  preferRetryUntil: true,

  // Default retry intervals
  defaultInterval: 500,

  // Exponential backoff settings
  backoff: {
    initial: 100,
    max: 5000,
    multiplier: 2,
  },
};

/**
 * Selector Strategy Configuration
 */
export const SELECTOR_STRATEGY = {
  // Preferred selector attributes in order
  preferredAttributes: ['data-cy', 'data-test', 'aria-label'],

  // Timeout for selector operations
  timeout: TIMEOUTS.element.default,

  // Whether to use retries for selectors
  useRetry: true,
};

/**
 * Screenshot Configuration
 */
export const SCREENSHOT_CONFIG = {
  // Automatically screenshot on failure
  onFailure: true,

  // Screenshot on specific events
  onError: true,
  onTimeout: true,

  // Screenshot capture mode
  capture: 'fullPage', // 'fullPage' | 'viewport' | 'runner'

  // Screenshot quality
  quality: 90,

  // Include timestamp in screenshot name
  includeTimestamp: true,
};

/**
 * Video Configuration
 */
export const VIDEO_CONFIG = {
  // Record video in CI only
  enabled: isCI,

  // Video compression (0-100, higher = better quality)
  compression: 32,

  // Upload videos on failure only
  uploadOnFailure: true,
};

/**
 * Network Stubbing Configuration
 */
export const NETWORK_CONFIG = {
  // Stub third-party services
  stubThirdParty: {
    analytics: true,
    tracking: true,
    ads: true,
    fonts: environment === 'ci', // Stub fonts in CI only
  },

  // Allow real backend calls for integration tests
  allowRealBackend: {
    local: true,
    ci: false,
    staging: true,
    production: false,
  },

  // Default response delays (for stubbed requests)
  responseDelay: {
    min: 50,
    max: 200,
  },
};

/**
 * Flaky Test Detection Configuration
 */
export const FLAKY_DETECTION = {
  // Enable flaky test detection
  enabled: isCI,

  // Track last N test runs
  historySize: 50,

  // Threshold for marking test as flaky
  flakinessThreshold: 0.2, // 20% failure rate

  // Minimum runs before considering flakiness
  minimumRuns: 10,
};

/**
 * Logging Configuration
 */
export const LOGGING = {
  // Log level (error, warn, info, debug)
  level: isCI ? 'warn' : 'info',

  // Log retry attempts
  logRetries: !isCI,

  // Log network requests
  logNetwork: false,

  // Log performance metrics
  logPerformance: isCI,
};

/**
 * Get timeout value with environment adjustment
 * CI environments get 1.5x timeout multiplier
 */
export const getTimeout = (baseTimeout) => {
  const multiplier = isCI ? 1.5 : 1;
  return Math.round(baseTimeout * multiplier);
};

/**
 * Get retry count with environment adjustment
 * CI environments get more retries
 */
export const getRetryCount = (baseRetries) => {
  const addition = isCI ? 1 : 0;
  return baseRetries + addition;
};

/**
 * Check if network should be stubbed
 */
export const shouldStubNetwork = () => {
  return !NETWORK_CONFIG.allowRealBackend[environment];
};

/**
 * Get screenshot configuration
 */
export const getScreenshotConfig = () => {
  return {
    ...SCREENSHOT_CONFIG,
    screenshotOnRunFailure: SCREENSHOT_CONFIG.onFailure,
  };
};

/**
 * Get video configuration
 */
export const getVideoConfig = () => {
  return {
    ...VIDEO_CONFIG,
    video: VIDEO_CONFIG.enabled,
    videoCompression: VIDEO_CONFIG.compression,
  };
};

/**
 * Export environment info
 */
export const ENV_INFO = {
  isCI,
  environment,
  nodeEnv: Cypress.env('NODE_ENV') || 'test',
  workerId: Cypress.env('WORKER_ID') || '0',
};

// Default export with all configuration
export default {
  TIMEOUTS,
  RETRIES,
  WAIT_STRATEGY,
  SELECTOR_STRATEGY,
  SCREENSHOT_CONFIG,
  VIDEO_CONFIG,
  NETWORK_CONFIG,
  FLAKY_DETECTION,
  LOGGING,
  ENV_INFO,
  getTimeout,
  getRetryCount,
  shouldStubNetwork,
  getScreenshotConfig,
  getVideoConfig,
};
