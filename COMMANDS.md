# 🚀 Essential Shohan Package Commands

Quick reference for the most important commands you'll actually use.

## 📦 Daily Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Full validation (build + test + lint)
npm run validate
```

## 🔄 Version & Publishing

### Version Updates
```bash
# Bug fixes (1.0.0 → 1.0.1)
npm version patch

# New features (1.0.0 → 1.1.0)  
npm version minor

# Breaking changes (1.0.0 → 2.0.0)
npm version major
```

### Publishing
```bash
# Quick patch release (bug fixes: 1.0.0 → 1.0.1)
npm run release:patch

# Quick minor release (new features: 1.0.0 → 1.1.0)
npm run release:minor

# Quick major release (breaking changes: 1.0.0 → 2.0.0)
npm run release:major

# Default to patch release
npm run release 

# Manual publishing
npm publish

# Check what will be published
npm pack --dry-run
```

## 🗑️ Cleanup Commands

```bash
# Clean build artifacts
rm -rf dist coverage *.tgz

# Full clean and reinstall
rm -rf node_modules dist
npm install

# Remove examples folder (before publishing)
rm -rf examples

# Clear npm cache
npm cache clean --force
```

## 🔍 Package Inspection

```bash
# Check published package info
npm view shohan

# Check package size
npm pack && ls -lh *.tgz && rm *.tgz

# Security check
npm audit
```

## ⚡ Quick Actions

```bash
# Most common workflow
npm run validate && npm version patch && npm publish

# Emergency reset
rm -rf node_modules dist && npm install && npm run build

# Check if package works locally
npm pack && npm install ./shohan-*.tgz
```