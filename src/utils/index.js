/**
 * Utils Module - Single Point Import
 * Import all utility functions from this file for better organization
 *
 * Usage:
 * import { waitForApi, stableClick, generateRandomEmail, SeedFactory } from '../utils';
 *
 * Or import everything:
 * import * as TestUtils from '../utils';
 */

// Import all utilities from test-utils
import * as TestUtils from './test-utils';

// Import legacy helpers
import {
  generateRandomEmail,
  generateRandomUsername,
  formatDate,
  wait,
  getEnv,
} from './helpers';

// Import data factory
import SeedFactory, {
  UserFactory,
  TransactionFactory,
  ProductFactory,
  OrderFactory,
  getNamespace,
  getEnvironmentConfig,
} from './data-factory';

// Import reliability helpers
import * as ReliabilityHelpers from './reliability-helpers';

// Re-export everything from test-utils
export * from './test-utils';

// Re-export legacy helpers
export { generateRandomEmail, generateRandomUsername, formatDate, wait, getEnv };

// Re-export data factory
export {
  SeedFactory,
  UserFactory,
  TransactionFactory,
  ProductFactory,
  OrderFactory,
  getNamespace,
  getEnvironmentConfig,
};

// Re-export reliability helpers
export * from './reliability-helpers';

// Default export combining all utilities
export default {
  ...TestUtils.default,
  ...ReliabilityHelpers.default,
  generateRandomEmail,
  generateRandomUsername,
  formatDate,
  wait,
  getEnv,
  SeedFactory,
  UserFactory,
  TransactionFactory,
  ProductFactory,
  OrderFactory,
  getNamespace,
  getEnvironmentConfig,
};
