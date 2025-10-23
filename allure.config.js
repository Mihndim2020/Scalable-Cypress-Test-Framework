/**
 * Allure Reporter Configuration
 *
 * This file configures the Allure test reporter for Cypress
 */

module.exports = {
  // Results directory
  resultsDir: 'allure-results',

  // Links configuration
  links: {
    issue: {
      nameTemplate: 'ISSUE-%s',
      urlTemplate: 'https://github.com/your-org/your-repo/issues/%s',
    },
    tms: {
      nameTemplate: 'TMS-%s',
      urlTemplate: 'https://jira.example.com/browse/%s',
    },
  },

  // Categories for test classification
  categories: [
    {
      name: 'Product Defects',
      messageRegex: '.*AssertionError.*',
      matchedStatuses: ['failed'],
    },
    {
      name: 'Test Defects',
      messageRegex: '.*TypeError.*',
      matchedStatuses: ['failed', 'broken'],
    },
    {
      name: 'Ignored Tests',
      matchedStatuses: ['skipped'],
    },
  ],

  // Environment information
  environmentInfo: {
    'Test Environment': process.env.ENVIRONMENT || 'development',
    'Base URL': process.env.BASE_URL || 'http://localhost:3000',
    'API URL': process.env.API_URL || 'http://localhost:3001',
    'CI': process.env.CI || 'false',
    'Node Version': process.version,
  },

  // Report configuration
  reportConfig: {
    reportName: 'Cypress Test Report',
    reportLanguage: 'en',
    reportEncoding: 'UTF-8',
    enableChart: true,
    enableStatistic: true,
    disableEnvVariablesExpansion: false,
  },
};
