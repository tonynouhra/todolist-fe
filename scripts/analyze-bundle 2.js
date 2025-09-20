#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBuildFolder() {
  const buildPath = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildPath)) {
    log('Build folder not found. Run "npm run build" first.', colors.red);
    process.exit(1);
  }

  log('\n📊 Bundle Analysis Report', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);

  // Analyze static folder
  const staticPath = path.join(buildPath, 'static');
  if (fs.existsSync(staticPath)) {
    analyzeStaticAssets(staticPath);
  }

  // Analyze main HTML file
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    analyzeIndexFile(indexPath);
  }

  // Performance recommendations
  provideRecommendations();
}

function analyzeStaticAssets(staticPath) {
  log('\n📁 Static Assets:', colors.bright + colors.blue);
  
  const folders = ['js', 'css', 'media'];
  let totalSize = 0;

  folders.forEach(folder => {
    const folderPath = path.join(staticPath, folder);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      let folderSize = 0;

      log(`\n  ${folder.toUpperCase()} Files:`, colors.yellow);
      
      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        folderSize += stats.size;
        
        const sizeColor = stats.size > 500000 ? colors.red : 
                         stats.size > 250000 ? colors.yellow : colors.green;
        
        log(`    ${file}: ${formatBytes(stats.size)}`, sizeColor);
      });

      totalSize += folderSize;
      log(`  Total ${folder}: ${formatBytes(folderSize)}`, colors.bright);
    }
  });

  log(`\n📦 Total Bundle Size: ${formatBytes(totalSize)}`, colors.bright + colors.magenta);
  
  // Check against performance budgets
  const budgets = {
    javascript: 250 * 1024, // 250KB
    css: 50 * 1024, // 50KB
    total: 500 * 1024, // 500KB
  };

  if (totalSize > budgets.total) {
    log(`⚠️  Bundle size exceeds recommended budget (${formatBytes(budgets.total)})`, colors.red);
  } else {
    log(`✅ Bundle size within recommended budget`, colors.green);
  }
}

function analyzeIndexFile(indexPath) {
  const content = fs.readFileSync(indexPath, 'utf8');
  
  log('\n📄 HTML Analysis:', colors.bright + colors.blue);
  
  // Check for performance optimizations
  const checks = [
    { pattern: /<link[^>]*rel="preload"/, name: 'Resource Preloading', found: false },
    { pattern: /<link[^>]*rel="dns-prefetch"/, name: 'DNS Prefetching', found: false },
    { pattern: /<link[^>]*rel="preconnect"/, name: 'Preconnect', found: false },
    { pattern: /loading="lazy"/, name: 'Lazy Loading', found: false },
    { pattern: /defer|async/, name: 'Script Optimization', found: false },
  ];

  checks.forEach(check => {
    check.found = check.pattern.test(content);
    const status = check.found ? '✅' : '❌';
    const color = check.found ? colors.green : colors.red;
    log(`  ${status} ${check.name}`, color);
  });
}

function provideRecommendations() {
  log('\n💡 Performance Recommendations:', colors.bright + colors.yellow);
  
  const recommendations = [
    'Enable gzip/brotli compression on your server',
    'Use a CDN for static assets',
    'Implement proper caching headers',
    'Consider code splitting for large components',
    'Optimize images with modern formats (WebP, AVIF)',
    'Use tree shaking to eliminate unused code',
    'Implement service worker for offline caching',
    'Monitor Core Web Vitals in production',
  ];

  recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`, colors.cyan);
  });
}

function runWebpackBundleAnalyzer() {
  try {
    log('\n🔍 Running Webpack Bundle Analyzer...', colors.bright + colors.blue);
    
    // Check if webpack-bundle-analyzer is installed
    try {
      require.resolve('webpack-bundle-analyzer');
    } catch (e) {
      log('Installing webpack-bundle-analyzer...', colors.yellow);
      execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
    }

    // Build with analyzer
    execSync('npm run build', { stdio: 'inherit' });
    
    // Run analyzer
    const analyzerScript = `
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      const path = require('path');
      
      const buildPath = path.join(__dirname, '..', 'build', 'static', 'js');
      const files = require('fs').readdirSync(buildPath).filter(f => f.endsWith('.js'));
      
      if (files.length > 0) {
        const analyzer = new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        });
        
        console.log('Opening bundle analyzer...');
      }
    `;
    
    fs.writeFileSync(path.join(__dirname, 'temp-analyzer.js'), analyzerScript);
    execSync('node scripts/temp-analyzer.js', { stdio: 'inherit' });
    fs.unlinkSync(path.join(__dirname, 'temp-analyzer.js'));
    
  } catch (error) {
    log('Could not run webpack bundle analyzer. Falling back to basic analysis.', colors.yellow);
    analyzeBuildFolder();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--detailed') || args.includes('-d')) {
  runWebpackBundleAnalyzer();
} else {
  analyzeBuildFolder();
}

log('\n🎯 For detailed analysis, run: npm run analyze:bundle -- --detailed', colors.bright + colors.green);
log('📚 Learn more about performance optimization at: https://web.dev/performance/', colors.blue);