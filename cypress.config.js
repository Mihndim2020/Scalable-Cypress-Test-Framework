const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const preprocessor = require('@badeball/cypress-cucumber-preprocessor');
const createEsbuildPlugin = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');
require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    // Base URL from environment variable or default
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',

    // Spec pattern for test files (includes both feature files and standard Cypress tests)
    specPattern: [
      'cypress/e2e/**/*.{feature,cy.js}',
      'src/tests/features/**/*.feature',
    ],

    // Support file
    supportFile: 'cypress/support/e2e.js',

    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',

    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Video recording (enabled in CI, disabled locally by default)
    video: process.env.CI === 'true',
    videoCompression: 32,
    videoUploadOnPasses: false, // Only upload failed test videos

    // Screenshot settings
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,

    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    execTimeout: 60000,

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Reporter configuration for CI
    reporter: process.env.CI === 'true' ? 'cypress-multi-reporters' : 'spec',
    reporterOptions: {
      configFile: 'reporter-config.json',
    },

    // Experiment flags
    experimentalMemoryManagement: true,
    experimentalModifyObstructiveThirdPartyCode: true,

    // Environment variables
    env: {
      // API Configuration
      apiUrl: process.env.API_URL || 'http://localhost:3001',

      // Test User Credentials
      username: process.env.TEST_USERNAME || 'testuser',
      password: process.env.TEST_PASSWORD || 'Password123!',

      // BDD Tags
      tags: process.env.TAGS || '',

      // Environment
      environment: process.env.ENVIRONMENT || 'development',

      // Feature flags
      enableApiMocking: process.env.ENABLE_API_MOCKING === 'true',
      enableCoverage: process.env.ENABLE_COVERAGE === 'true',
    },

    // Setup node event listeners
    setupNodeEvents(on, config) {
      // Allure reporter
      allureWriter(on, config);

      // Cucumber preprocessor
      on('file:preprocessor', async (file) => {
        const bundler = createBundler({
          plugins: [createEsbuildPlugin.default(config)],
        });

        await preprocessor.addCucumberPreprocessorPlugin(on, config);
        return bundler(file);
      });

      // Tasks for logging, data seeding, and cleanup
      on('task', {
        // Logging tasks
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },

        // Data seeding tasks
        seedUser(userData) {
          console.log('Seeding user:', userData.username || userData.email);
          // In a real scenario, this would call your backend API
          // For now, we'll just return success
          return {
            success: true,
            id: `user-${Date.now()}`,
            ...userData,
          };
        },

        seedTransaction(transactionData) {
          console.log('Seeding transaction:', transactionData.description);
          return {
            success: true,
            id: `txn-${Date.now()}`,
            ...transactionData,
          };
        },

        seedProduct(productData) {
          console.log('Seeding product:', productData.name);
          return {
            success: true,
            id: `prod-${Date.now()}`,
            ...productData,
          };
        },

        seedOrder(orderData) {
          console.log('Seeding order:', orderData.orderNumber);
          return {
            success: true,
            id: `order-${Date.now()}`,
            ...orderData,
          };
        },

        // Cleanup tasks
        cleanupEntity({ type, id }) {
          console.log(`Cleaning up ${type}:${id}`);
          // In a real scenario, this would call your backend API to delete
          return { success: true, type, id };
        },

        cleanupByNamespace({ namespace }) {
          console.log(`Cleaning up all entities in namespace: ${namespace}`);
          // In a real scenario, this would delete all entities with this namespace
          return { success: true, namespace, deleted: 0 };
        },

        // Database reset task (for local/CI environments)
        resetDatabase() {
          console.log('Resetting database to clean state');
          // In a real scenario, this would reset your test database
          return { success: true, message: 'Database reset complete' };
        },

        // Get environment info
        getEnvironmentInfo() {
          return {
            nodeEnv: process.env.NODE_ENV || 'development',
            ci: process.env.CI === 'true',
            workerId: process.env.WORKER_ID || '0',
          };
        },

        // Save test metadata
        saveTestMetadata(metadata) {
          const fs = require('fs');
          const path = require('path');
          const metadataDir = path.join(__dirname, 'test-metadata');

          if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = path.join(metadataDir, `metadata-${timestamp}.json`);

          fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
          console.log(`Test metadata saved to: ${filename}`);

          return { success: true, filename };
        },
      });

      // Make sure to return the config object
      return config;
    },
  },

  // Component testing configuration (optional)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
});
