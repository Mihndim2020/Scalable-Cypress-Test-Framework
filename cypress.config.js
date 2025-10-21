const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const preprocessor = require('@badeball/cypress-cucumber-preprocessor');
const createEsbuildPlugin = require('@badeball/cypress-cucumber-preprocessor/esbuild');
require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    // Base URL from environment variable or default
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',

    // Spec pattern for test files
    specPattern: 'cypress/e2e/**/*.{feature,cy.js}',

    // Support file
    supportFile: 'cypress/support/e2e.js',

    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',

    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Video recording
    video: true,
    videoCompression: 32,

    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Environment variables
    env: {
      // Add your custom environment variables here
      apiUrl: process.env.API_URL || 'http://localhost:3001',
      username: process.env.TEST_USERNAME || '',
      password: process.env.TEST_PASSWORD || '',
      tags: process.env.TAGS || '',
    },

    // Setup node event listeners
    setupNodeEvents(on, config) {
      // Cucumber preprocessor
      on('file:preprocessor', async (file) => {
        const bundler = createBundler({
          plugins: [createEsbuildPlugin.default(config)],
        });

        await preprocessor.addCucumberPreprocessorPlugin(on, config);
        return bundler(file);
      });

      // Task for logging to terminal
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
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
