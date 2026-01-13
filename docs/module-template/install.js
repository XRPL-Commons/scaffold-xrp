/**
 * Post-install script for scaffold-xrp module
 *
 * This script runs after the module files are copied.
 * Use it for custom setup like updating config files.
 *
 * Environment variables available:
 * - SCAFFOLD_XRP_PROJECT_DIR: Root project directory
 * - SCAFFOLD_XRP_FRAMEWORK: 'nextjs' or 'nuxt'
 * - SCAFFOLD_XRP_WEB_DIR: Path to apps/web
 */

const fs = require('fs');
const path = require('path');

const projectDir = process.env.SCAFFOLD_XRP_PROJECT_DIR;
const framework = process.env.SCAFFOLD_XRP_FRAMEWORK;
const webDir = process.env.SCAFFOLD_XRP_WEB_DIR;

console.log(`Running post-install for example-module...`);
console.log(`  Framework: ${framework}`);
console.log(`  Project: ${projectDir}`);

// Example: Add environment variables to .env.example
const envExamplePath = path.join(webDir, '.env.example');
const envVars = `
# Example Module Configuration
NEXT_PUBLIC_EXAMPLE_API_KEY=your-api-key-here
`;

if (fs.existsSync(envExamplePath)) {
  const content = fs.readFileSync(envExamplePath, 'utf-8');
  if (!content.includes('EXAMPLE_API_KEY')) {
    fs.appendFileSync(envExamplePath, envVars);
    console.log('  Added environment variables to .env.example');
  }
}

console.log('Post-install complete!');
