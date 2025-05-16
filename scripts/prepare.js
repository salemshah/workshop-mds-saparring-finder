#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
    console.log('Installing Husky...');
    execSync('npx husky install', { stdio: 'inherit' });
} else {
    console.log('Skipping Husky install in production.');
}
