#!/usr/bin/env node

/**
 * Test Dashboard Generator
 *
 * Generates an HTML dashboard from test metrics for visualization
 * Suitable for publishing to GitHub Pages or S3
 *
 * Usage:
 *   node scripts/generate-dashboard.js [--metrics FILE] [--output DIR]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  metricsFile: process.argv.includes('--metrics')
    ? process.argv[process.argv.indexOf('--metrics') + 1]
    : 'test-metrics.json',
  outputDir: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : 'dashboard',
};

console.log('📊 Generating Test Dashboard...');
console.log(`Metrics File: ${config.metricsFile}`);
console.log(`Output Directory: ${config.outputDir}`);
console.log('');

// Read metrics
function readMetrics() {
  try {
    const content = fs.readFileSync(config.metricsFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading metrics file: ${error.message}`);
    process.exit(1);
  }
}

// Generate HTML dashboard
function generateHTML(metrics) {
  const passRate = metrics.summary.passRate || 0;
  const passRateColor = passRate >= 90 ? '#28a745' : passRate >= 70 ? '#ffc107' : '#dc3545';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cypress Test Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .stat-card h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .stat-card .value {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }

        .stat-card .subvalue {
            font-size: 14px;
            color: #999;
            margin-top: 5px;
        }

        .pass-rate {
            background: ${passRateColor};
            color: white;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px auto;
            font-size: 32px;
            font-weight: bold;
        }

        .section {
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #667eea;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #d4edda;
            color: #155724;
        }

        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }

        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }

        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
        }

        .chart {
            margin: 20px 0;
        }

        .bar-chart {
            display: flex;
            gap: 10px;
            align-items: flex-end;
            height: 200px;
        }

        .bar {
            flex: 1;
            background: #667eea;
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: all 0.3s ease;
        }

        .bar:hover {
            background: #764ba2;
        }

        .bar-label {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            color: #666;
            white-space: nowrap;
        }

        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: bold;
            color: #667eea;
        }

        .footer {
            text-align: center;
            color: white;
            padding: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Cypress Test Dashboard</h1>
            <p>Generated: ${metrics.generated || new Date().toISOString()}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Tests</h3>
                <div class="value">${metrics.summary.totalTests || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Passed</h3>
                <div class="value" style="color: #28a745;">${metrics.summary.passed || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">${metrics.summary.failed || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Duration</h3>
                <div class="value">${((metrics.summary.duration || 0) / 1000).toFixed(1)}s</div>
            </div>
            <div class="stat-card">
                <h3>Pass Rate</h3>
                <div class="pass-rate">${passRate}%</div>
            </div>
        </div>

        ${generateBrowserStats(metrics.browsers)}
        ${generateFlakyTestsSection(metrics.flakyTests)}
        ${generateSlowTestsSection(metrics.slowTests)}
        ${generateFailedTestsSection(metrics.failedTests)}

        <div class="footer">
            <p>Powered by Cypress | Last Updated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
}

function generateBrowserStats(browsers) {
  if (!browsers || Object.keys(browsers).length === 0) {
    return '';
  }

  const rows = Object.entries(browsers)
    .map(
      ([browser, stats]) => `
        <tr>
            <td>${browser}</td>
            <td>${stats.tests || 0}</td>
            <td>${stats.passed || 0}</td>
            <td>${stats.failed || 0}</td>
            <td>
                <span class="badge ${stats.failed === 0 ? 'badge-success' : 'badge-warning'}">
                    ${((stats.passed / (stats.tests || 1)) * 100).toFixed(1)}%
                </span>
            </td>
        </tr>
    `
    )
    .join('');

  return `
        <div class="section">
            <h2>📊 Browser Statistics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Browser</th>
                        <th>Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Pass Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

function generateFlakyTestsSection(flakyTests) {
  if (!flakyTests || flakyTests.length === 0) {
    return `
            <div class="section">
                <h2>✅ No Flaky Tests Detected</h2>
                <p>All tests are stable across multiple runs.</p>
            </div>
        `;
  }

  const rows = flakyTests
    .slice(0, 10)
    .map(
      (test) => `
        <tr>
            <td>${test.title}</td>
            <td>${test.suite}</td>
            <td>${test.totalRuns}</td>
            <td>${test.passed}</td>
            <td>${test.failed}</td>
            <td>
                <span class="badge badge-warning">${test.flakyRate}%</span>
            </td>
        </tr>
    `
    )
    .join('');

  return `
        <div class="section">
            <h2>⚠️ Flaky Tests (${flakyTests.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Suite</th>
                        <th>Total Runs</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Flaky Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

function generateSlowTestsSection(slowTests) {
  if (!slowTests || slowTests.length === 0) {
    return '';
  }

  const rows = slowTests
    .map(
      (test) => `
        <tr>
            <td>${test.title}</td>
            <td>${test.suite}</td>
            <td>${(test.duration / 1000).toFixed(2)}s</td>
        </tr>
    `
    )
    .join('');

  return `
        <div class="section">
            <h2>🐌 Slowest Tests (Top 10)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Suite</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

function generateFailedTestsSection(failedTests) {
  if (!failedTests || failedTests.length === 0) {
    return '';
  }

  const rows = failedTests
    .map(
      (test) => `
        <tr>
            <td>${test.title}</td>
            <td>${test.suite}</td>
            <td>${test.error}</td>
        </tr>
    `
    )
    .join('');

  return `
        <div class="section">
            <h2>❌ Failed Tests (${failedTests.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Suite</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Generate JSON summary for API/automation
function generateJSONSummary(metrics) {
  return {
    timestamp: metrics.generated,
    summary: metrics.summary,
    trends: {
      passRate: metrics.summary.passRate,
      flakyTests: metrics.flakyTests?.length || 0,
      slowTests: metrics.slowTests?.length || 0,
      failedTests: metrics.failedTests?.length || 0,
    },
    browsers: metrics.browsers,
  };
}

// Main execution
try {
  const metrics = readMetrics();

  // Create output directory
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Generate HTML dashboard
  const html = generateHTML(metrics);
  fs.writeFileSync(path.join(config.outputDir, 'index.html'), html);

  // Generate JSON summary
  const summary = generateJSONSummary(metrics);
  fs.writeFileSync(path.join(config.outputDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // Copy metrics file
  fs.copyFileSync(config.metricsFile, path.join(config.outputDir, 'metrics.json'));

  console.log('✅ Dashboard generated successfully!');
  console.log(`📄 HTML: ${path.join(config.outputDir, 'index.html')}`);
  console.log(`📄 Summary: ${path.join(config.outputDir, 'summary.json')}`);
  console.log(`📄 Metrics: ${path.join(config.outputDir, 'metrics.json')}`);
  console.log('');
  console.log('💡 Tip: Open index.html in a browser to view the dashboard');
} catch (error) {
  console.error('❌ Error generating dashboard:', error);
  process.exit(1);
}
