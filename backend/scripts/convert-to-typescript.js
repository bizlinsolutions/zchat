#!/usr/bin/env node
/**
 * TypeScript Conversion Generator for Backend Controllers and Routes
 * This script generates TypeScript versions of all JS files in controllers and routes directories
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const DIRS_TO_CONVERT = ['controllers', 'routes'];

// Conversion templates
const CONTROLLER_TEMPLATE = (filename, content) => `
import type { Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { logger } from '../utils/logger'

// TODO: Implement controller methods
// This file was auto-generated from ${filename}
// Please review and add proper TypeScript types

${content}
`;

function convertFile(filePath) {
  const filename = path.basename(filePath, '.js');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Simple conversion: replace require with import
  let converted = content
    .replace(/const (\w+) = require\(['"]([^'"]+)['"]\)/g, "import $1 from '$2'")
    .replace(/module\.exports = /g, 'export ')
    .replace(/function (\w+)\(req, res/g, 'async function $1(req: Request, res: Response');
  
  const outputPath = filePath.replace('.js', '.ts');
  fs.writeFileSync(outputPath, converted);
  console.log(`✓ Converted: ${filename}.js → ${filename}.ts`);
}

// Main conversion
console.log('Starting TypeScript conversion...\n');

for (const dir of DIRS_TO_CONVERT) {
  const dirPath = path.join(SRC_DIR, dir);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    console.log(`\nConverting ${dir}/ (${files.length} files):`);
    files.forEach(file => convertFile(path.join(dirPath, file)));
  }
}

console.log('\n✓ TypeScript conversion complete!');
console.log('Note: Please review generated files and add proper type definitions.');
