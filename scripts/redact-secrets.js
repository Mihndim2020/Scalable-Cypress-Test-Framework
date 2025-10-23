#!/usr/bin/env node

/**
 * Secrets Redaction Script
 *
 * Redacts sensitive information from test recordings, logs, and artifacts.
 * Prevents accidental exposure of passwords, tokens, and API keys.
 *
 * Usage:
 *   node scripts/redact-secrets.js --input FILE --output FILE
 *   node scripts/redact-secrets.js --dir DIRECTORY
 */

const fs = require('fs');
const path = require('path');

// Sensitive patterns to redact
const PATTERNS = [
  // Passwords
  {
    name: 'Password',
    regex: /(password|passwd|pwd)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
    replacement: (match, key, value) => `${key}": "***REDACTED***`,
  },
  // API Keys
  {
    name: 'API Key',
    regex: /(api[_-]?key|apikey)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
    replacement: (match, key, value) => `${key}": "***REDACTED***`,
  },
  // Access Tokens
  {
    name: 'Access Token',
    regex: /(access[_-]?token|accesstoken|bearer\s+)([a-zA-Z0-9_\-\.]+)/gi,
    replacement: (match, key, value) => `${key}***REDACTED***`,
  },
  // Secret Keys
  {
    name: 'Secret Key',
    regex: /(secret[_-]?key|secretkey)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
    replacement: (match, key, value) => `${key}": "***REDACTED***`,
  },
  // Authorization Headers
  {
    name: 'Authorization Header',
    regex: /(authorization|auth)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
    replacement: (match, key, value) => `${key}": "***REDACTED***`,
  },
  // Credit Card Numbers
  {
    name: 'Credit Card',
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: () => '**** **** **** ****',
  },
  // Email addresses (partial redaction)
  {
    name: 'Email',
    regex: /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    replacement: (match, user, domain) => {
      const redactedUser = user.length > 2
        ? `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}`
        : '***';
      return `${redactedUser}@${domain}`;
    },
  },
  // JWT Tokens
  {
    name: 'JWT Token',
    regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: () => 'eyJ***REDACTED***.eyJ***REDACTED***.***REDACTED***',
  },
  // SSH Keys
  {
    name: 'SSH Key',
    regex: /-----BEGIN [A-Z]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z]+ PRIVATE KEY-----/g,
    replacement: () => '-----BEGIN PRIVATE KEY-----\n***REDACTED***\n-----END PRIVATE KEY-----',
  },
  // Generic secrets in environment variables
  {
    name: 'Environment Secret',
    regex: /(SECRET|PRIVATE|CREDENTIALS)=([^\s]+)/gi,
    replacement: (match, key, value) => `${key}=***REDACTED***`,
  },
];

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  redactionsByType: {},
  totalRedactions: 0,
};

function log(message, color = '') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function redactContent(content) {
  let redacted = content;
  let redactionCount = 0;

  PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern.regex);
    if (matches) {
      const count = matches.length;
      redactionCount += count;
      stats.redactionsByType[pattern.name] = (stats.redactionsByType[pattern.name] || 0) + count;

      redacted = redacted.replace(pattern.regex, pattern.replacement);
    }
  });

  stats.totalRedactions += redactionCount;
  return { redacted, redactionCount };
}

function processFile(filePath, outputPath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { redacted, redactionCount } = redactContent(content);

    stats.filesProcessed++;

    if (redactionCount > 0) {
      fs.writeFileSync(outputPath || filePath, redacted);
      stats.filesModified++;
      log(`✓ ${path.basename(filePath)}: ${redactionCount} redaction(s)`, 'green');
    } else {
      if (outputPath) {
        fs.copyFileSync(filePath, outputPath);
      }
      log(`  ${path.basename(filePath)}: No redactions needed`, 'blue');
    }
  } catch (error) {
    log(`✗ Error processing ${filePath}: ${error.message}`, 'red');
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!file.startsWith('.') && file !== 'node_modules') {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Process text files only
      const ext = path.extname(file).toLowerCase();
      const textExtensions = ['.json', '.log', '.txt', '.xml', '.html', '.js', '.ts', '.md'];

      if (textExtensions.includes(ext)) {
        processFile(fullPath);
      }
    }
  });
}

function printReport() {
  log('\n' + '='.repeat(60), 'blue');
  log('Secrets Redaction Report', 'blue');
  log('='.repeat(60), 'blue');

  log(`\n📊 Summary:`);
  log(`  Files Processed: ${stats.filesProcessed}`);
  log(`  Files Modified: ${stats.filesModified}`);
  log(`  Total Redactions: ${stats.totalRedactions}`);

  if (Object.keys(stats.redactionsByType).length > 0) {
    log(`\n🔒 Redactions by Type:`);
    Object.entries(stats.redactionsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        log(`  ${type}: ${count}`, 'yellow');
      });
  }

  if (stats.totalRedactions > 0) {
    log(`\n✅ ${stats.totalRedactions} sensitive item(s) redacted`, 'green');
  } else {
    log(`\n✓ No sensitive data found`, 'blue');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    log('Secrets Redaction Script\n');
    log('Usage:');
    log('  node scripts/redact-secrets.js --input FILE --output FILE');
    log('  node scripts/redact-secrets.js --dir DIRECTORY\n');
    log('Options:');
    log('  --input FILE    Input file to redact');
    log('  --output FILE   Output file (default: overwrite input)');
    log('  --dir DIR       Directory to process recursively');
    process.exit(0);
  }

  if (args.includes('--input')) {
    const inputIndex = args.indexOf('--input');
    const outputIndex = args.indexOf('--output');

    const inputFile = args[inputIndex + 1];
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;

    log(`🔍 Processing file: ${inputFile}`, 'blue');
    processFile(inputFile, outputFile);
  } else if (args.includes('--dir')) {
    const dirIndex = args.indexOf('--dir');
    const directory = args[dirIndex + 1];

    log(`🔍 Processing directory: ${directory}`, 'blue');
    processDirectory(directory);
  } else {
    log('❌ No input specified. Use --help for usage information.', 'red');
    process.exit(1);
  }

  printReport();
}

main();
