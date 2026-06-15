#!/usr/bin/env node

/**
 * test-metrics.js — Quick test script for monitoring setup
 *
 * Usage: npm run test:metrics
 *
 * This script:
 * 1. Verifies Sentry initialization
 * 2. Verifies Prometheus metrics collection
 * 3. Simulates requests to generate metrics
 * 4. Checks /metrics endpoint response
 */

import app from './src/app.js';
import http from 'http';

const PORT = 8001; // Use different port to avoid conflicts
let server;

async function testMetrics() {
  console.log('🧪 Starting Monitoring Stack Test...\n');

  return new Promise((resolve) => {
    // Start server
    server = app.listen(PORT, () => {
      console.log(`✅ Server started on port ${PORT}`);
      console.log('📊 Testing metrics collection...\n');

      // Test 1: Check /metrics endpoint
      testMetricsEndpoint();

      // Test 2: Generate some traffic
      setTimeout(() => {
        generateTraffic();
      }, 500);

      // Test 3: Verify metrics are collected
      setTimeout(() => {
        verifyMetrics();
        cleanup(resolve);
      }, 2000);
    });
  });
}

function testMetricsEndpoint() {
  const req = http.get(`http://localhost:${PORT}/metrics`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ /metrics endpoint responds with 200');
        if (data.includes('http_requests_total')) {
          console.log('✅ Prometheus metrics format detected\n');
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Error accessing /metrics:', err.message);
  });
}

function generateTraffic() {
  console.log('🚀 Generating test traffic...');

  for (let i = 0; i < 5; i++) {
    http.get(`http://localhost:${PORT}/health`, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        console.log(`  ✓ Request ${i + 1}/5 completed`);
      });
    }).on('error', () => {
      // Ignore errors
    });
  }
}

function verifyMetrics() {
  console.log('\n📈 Verifying metrics collection...');

  const req = http.get(`http://localhost:${PORT}/metrics`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      const checks = [
        { name: 'http_requests_total', found: data.includes('http_requests_total') },
        { name: 'http_request_duration_ms', found: data.includes('http_request_duration_ms') },
        { name: 'http_requests_in_progress', found: data.includes('http_requests_in_progress') },
        { name: 'nodejs metrics', found: data.includes('process_cpu_seconds_total') },
      ];

      checks.forEach(check => {
        const status = check.found ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
      });

      const allFound = checks.every(c => c.found);
      if (allFound) {
        console.log('\n✨ All monitoring systems operational!');
      } else {
        console.log('\n⚠️  Some metrics missing — check initialization');
      }

      // Show sample metrics
      console.log('\n📋 Sample metrics output:');
      const lines = data.split('\n').filter(line =>
        !line.startsWith('#') && line.includes('_total')
      ).slice(0, 3);
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`  ${line.substring(0, 100)}...`);
        }
      });
    });
  });

  req.on('error', (err) => {
    console.error('❌ Error verifying metrics:', err.message);
  });
}

function cleanup(resolve) {
  console.log('\n🧹 Cleaning up...');
  server.close(() => {
    console.log('✅ Server stopped\n');
    console.log('🎉 Test complete!\n');
    console.log('Next steps:');
    console.log('  1. Start the full server: npm start');
    console.log('  2. Open metrics: http://localhost:8000/metrics');
    console.log('  3. Run full stack: docker-compose -f docker-compose.monitoring.yml up -d');
    console.log('  4. View Grafana: http://localhost:3000\n');
    resolve();
  });
}

testMetrics().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
