#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * Validates that all required environment variables are set before running tests.
 * Prevents tests from running with missing or invalid configuration.
 *
 * Usage:
 *   node scripts/validate-env.js [--environment ENV] [--strict]
 *
 * Options:
 *   --environment  Specify environment (local, ci, staging, production)
 *   --strict       Fail on warnings
 *   --silent       Suppress output except errors
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Configuration
const config = {
  environment: process.argv.includes('--environment')
    ? process.argv[process.argv.indexOf('--environment') + 1]
    : process.env.ENVIRONMENT || 'local',
  strict: process.argv.includes('--strict'),
  silent: process.argv.includes('--silent'),
};

// Required environment variables by environment
const requiredVars = {
  // Required in all environments
  all: ['BASE_URL', 'API_URL'],

  // Local development
  local: [],

  // CI environment
  ci: ['CI', 'GITHUB_ACTIONS'],

  // Staging environment
  staging: ['TEST_USERNAME', 'TEST_PASSWORD'],

  // Production (read-only smoke tests)
  production: ['TEST_USERNAME', 'TEST_PASSWORD'],
};

// Sensitive variables that should NEVER be committed
const sensitiveVars = [
  'PASSWORD',
  'SECRET',
  'KEY',
  'TOKEN',
  'API_KEY',
  'PRIVATE',
  'CREDENTIALS',
  'ACCESS_KEY',
];

// Optional but recommended variables
const recommendedVars = {
  all: ['NODE_ENV', 'ENVIRONMENT'],
  ci: ['BUILD_NUMBER', 'BRANCH_NAME'],
  staging: ['SLACK_WEBHOOK_URL'],
  production: [],
};

// Validation results
const results = {
  missing: [],
  invalid: [],
  warnings: [],
  sensitive: [],
  redacted: [],
};

// Helper functions
function log(message, color = 'reset') {
  if (!config.silent) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  if (!config.silent) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  }
}

function logWarning(message) {
  if (!config.silent) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  }
}

function isSensitive(key) {
  return sensitiveVars.some((pattern) => key.toUpperCase().includes(pattern));
}

function redactValue(value) {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return `${value.substring(0, 2)}${'*'.repeat(value.length - 4)}${value.substring(value.length - 2)}`;
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    logWarning('.env file not found. Using environment variables only.');
    results.warnings.push('.env file not found');
    return false;
  }

  logSuccess('.env file found');
  return true;
}

// Load .env file
function loadEnvFile() {
  try {
    require('dotenv').config();
    return true;
  } catch (error) {
    logWarning(`Could not load .env file: ${error.message}`);
    return false;
  }
}

// Validate required variables
function validateRequired() {
  log('\n📋 Checking Required Variables...', 'blue');

  const required = [
    ...requiredVars.all,
    ...(requiredVars[config.environment] || []),
  ];

  required.forEach((key) => {
    const value = process.env[key];

    if (!value) {
      results.missing.push(key);
      logError(`Missing: ${key}`);
    } else if (isSensitive(key)) {
      results.redacted.push(key);
      log(`  ${key}: ${redactValue(value)}`, 'cyan');
    } else {
      log(`  ${key}: ${value}`, 'cyan');
    }
  });

  if (results.missing.length === 0) {
    logSuccess('All required variables are set');
  }
}

// Validate optional variables
function validateRecommended() {
  log('\n📝 Checking Recommended Variables...', 'blue');

  const recommended = [
    ...recommendedVars.all,
    ...(recommendedVars[config.environment] || []),
  ];

  recommended.forEach((key) => {
    const value = process.env[key];

    if (!value) {
      results.warnings.push(`Recommended variable not set: ${key}`);
      logWarning(`Not set: ${key}`);
    } else {
      log(`  ${key}: ${value}`, 'cyan');
    }
  });
}

// Validate URLs
function validateUrls() {
  log('\n🔗 Validating URLs...', 'blue');

  const urlVars = ['BASE_URL', 'API_URL', 'STAGING_BASE_URL', 'STAGING_API_URL'];

  urlVars.forEach((key) => {
    const value = process.env[key];

    if (value) {
      if (!validateUrl(value)) {
        results.invalid.push(`${key}: Invalid URL format`);
        logError(`Invalid URL: ${key}=${value}`);
      } else {
        log(`  ${key}: ${value} ✓`, 'cyan');
      }
    }
  });
}

// Check for sensitive data in non-secure locations
function checkSensitiveData() {
  log('\n🔒 Checking for Sensitive Data...', 'blue');

  // Check all environment variables
  Object.keys(process.env).forEach((key) => {
    if (isSensitive(key)) {
      results.sensitive.push(key);

      // Warn if sensitive var is set but not in .env
      const value = process.env[key];
      if (value && value.length > 0) {
        log(`  ${key}: ${redactValue(value)} (SENSITIVE)`, 'yellow');
      }
    }
  });

  if (results.sensitive.length > 0) {
    logWarning(`Found ${results.sensitive.length} sensitive variable(s)`);
    logWarning('Ensure these are NEVER committed to version control');
  }
}

// Check for .env in .gitignore
function checkGitignore() {
  log('\n🚫 Checking .gitignore...', 'blue');

  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    logWarning('.gitignore not found');
    results.warnings.push('.gitignore not found');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n');

  const requiredPatterns = ['.env', '.env.local', '.env.*.local'];
  const missing = requiredPatterns.filter((pattern) =>
    !lines.some((line) => line.trim() === pattern)
  );

  if (missing.length > 0) {
    logWarning(`.gitignore missing patterns: ${missing.join(', ')}`);
    results.warnings.push('Some .env patterns missing from .gitignore');
  } else {
    logSuccess('.env patterns found in .gitignore');
  }
}

// Generate environment report
function generateReport() {
  log('\n' + '='.repeat(60), 'blue');
  log('Environment Validation Report', 'blue');
  log('='.repeat(60), 'blue');

  log(`\nEnvironment: ${config.environment}`, 'cyan');
  log(`Node Version: ${process.version}`, 'cyan');
  log(`Platform: ${process.platform}`, 'cyan');

  log('\n📊 Summary:', 'blue');
  log(`  Required Variables: ${requiredVars.all.length + (requiredVars[config.environment]?.length || 0)}`);
  log(`  Missing: ${results.missing.length}`, results.missing.length > 0 ? 'red' : 'green');
  log(`  Invalid: ${results.invalid.length}`, results.invalid.length > 0 ? 'red' : 'green');
  log(`  Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'yellow' : 'green');
  log(`  Sensitive: ${results.sensitive.length}`, results.sensitive.length > 0 ? 'yellow' : 'green');

  if (results.missing.length > 0) {
    log('\n❌ Missing Required Variables:', 'red');
    results.missing.forEach((key) => {
      log(`  - ${key}`, 'red');
    });
  }

  if (results.invalid.length > 0) {
    log('\n❌ Invalid Variables:', 'red');
    results.invalid.forEach((msg) => {
      log(`  - ${msg}`, 'red');
    });
  }

  if (results.warnings.length > 0 && !config.silent) {
    log('\n⚠️  Warnings:', 'yellow');
    results.warnings.forEach((msg) => {
      log(`  - ${msg}`, 'yellow');
    });
  }
}

// Save validation report to file
function saveReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: config.environment,
    results: {
      valid: results.missing.length === 0 && results.invalid.length === 0,
      missing: results.missing,
      invalid: results.invalid,
      warnings: results.warnings,
      sensitiveCount: results.sensitive.length,
    },
  };

  const reportPath = path.join(process.cwd(), '.env-validation.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (!config.silent) {
    log(`\n📄 Report saved: ${reportPath}`, 'cyan');
  }
}

// Main execution
function main() {
  log('\n🔍 Environment Validation Tool', 'blue');
  log(`Environment: ${config.environment}`, 'cyan');
  log(`Strict Mode: ${config.strict ? 'ON' : 'OFF'}`, 'cyan');
  log('');

  // Load .env file
  checkEnvFile();
  loadEnvFile();

  // Run validations
  validateRequired();
  validateRecommended();
  validateUrls();
  checkSensitiveData();
  checkGitignore();

  // Generate report
  generateReport();
  saveReport();

  // Determine exit code
  const hasErrors = results.missing.length > 0 || results.invalid.length > 0;
  const hasWarnings = results.warnings.length > 0;

  if (hasErrors) {
    log('\n❌ Validation FAILED', 'red');
    log('Fix the errors above before running tests.', 'red');
    process.exit(1);
  }

  if (config.strict && hasWarnings) {
    log('\n⚠️  Validation FAILED (strict mode)', 'yellow');
    log('Fix the warnings above or run without --strict flag.', 'yellow');
    process.exit(1);
  }

  log('\n✅ Validation PASSED', 'green');
  log('All required environment variables are set correctly.', 'green');
  process.exit(0);
}

// Run validation
try {
  main();
} catch (error) {
  logError(`Validation error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}
