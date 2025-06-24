# Publishing Guide for @shohan/cache

## Pre-publishing Checklist

### 1. Version Update
```bash
# Update version in package.json
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes
```

### 2. Quality Checks
```bash
# Run all quality checks
npm run lint        # Check code style
npm run type-check  # Verify TypeScript types
npm test           # Run test suite
npm run build      # Build the package
```

### 3. Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md includes latest changes
- [ ] Examples are working and current
- [ ] API documentation is complete

## NPM Registry Setup

### 1. NPM Account Setup
```bash
# Create NPM account at npmjs.com
# Login to NPM
npm login
```

### 2. Organization Setup (Optional)
```bash
# Create @shohan organization on npmjs.com
# Or use your own organization
```

### 3. Package Verification
```bash
# Check package details
npm pack --dry-run

# Verify package contents
npm pack
tar -tzf shohan-cache-1.0.0.tgz
```

## Publishing Steps

### 1. First-time Publish
```bash
# Make sure you're in the correct directory
cd /path/to/shohan-cache

# Run pre-publish checks
npm run prepublishOnly

# Publish to NPM
npm publish

# Or publish with public access if using scoped package
npm publish --access=public
```

### 2. Beta/Preview Releases
```bash
# Publish beta version
npm version prerelease --preid=beta
npm publish --tag beta

# Install beta version
npm install @shohan/cache@beta
```

### 3. Update Releases
```bash
# For bug fixes
npm version patch
npm publish

# For new features
npm version minor
npm publish

# For breaking changes
npm version major
npm publish
```

## GitHub Package Registry (Optional)

### 1. Setup GitHub Registry
```bash
# Add to package.json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}

# Login to GitHub registry
npm login --registry=https://npm.pkg.github.com
```

### 2. Publish to GitHub
```bash
npm publish --registry=https://npm.pkg.github.com
```

## Post-publish Tasks

### 1. Verify Publication
```bash
# Check package on npmjs.com
# Test installation
npm install @shohan/cache
```

### 2. Update Documentation
- [ ] Update installation instructions
- [ ] Create GitHub release
- [ ] Update project website/documentation
- [ ] Announce on social media/community

### 3. GitHub Release
```bash
# Create GitHub release with changelog
git tag v1.0.0
git push origin v1.0.0

# Create release on GitHub with:
# - Release notes from CHANGELOG.md
# - Binary attachments if needed
```

## Automation with GitHub Actions

The project includes GitHub Actions for:
- ✅ Automated testing on push/PR
- ✅ Automated publishing on release
- ✅ Cross-platform testing (Node 16, 18, 20)

### Manual Trigger
```bash
# Create a GitHub release to trigger automated publishing
# Go to GitHub → Releases → Create new release
# Tag: v1.0.0
# Title: v1.0.0 - Initial Release
# Description: Copy from CHANGELOG.md
```

## Troubleshooting

### Common Issues
1. **Authentication Error**
   ```bash
   npm login
   # Verify login
   npm whoami
   ```

2. **Package Name Conflict**
   - Change package name in package.json
   - Or use scoped package: @yourusername/cache

3. **Permission Issues**
   ```bash
   # Make sure you have publish rights
   npm owner ls @shohan/cache
   ```

4. **Build Failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run build
   ```

### Rollback if Needed
```bash
# Unpublish within 72 hours (not recommended for production)
npm unpublish @shohan/cache@1.0.0

# Deprecate instead (recommended)
npm deprecate @shohan/cache@1.0.0 "This version has issues, please upgrade"
```

## Best Practices

1. **Semantic Versioning**: Always follow semver
2. **Changelog**: Keep detailed changelog
3. **Testing**: Comprehensive test coverage
4. **Documentation**: Clear examples and API docs
5. **Backwards Compatibility**: Avoid breaking changes in minor/patch
6. **Security**: Regular dependency updates
7. **Performance**: Monitor bundle size and performance

## Ready to Publish!

Your package is ready for publication. Follow these final steps:

```bash
# Final check
npm run prepublishOnly

# Publish
npm publish --access=public

# Verify
npm view @shohan/cache
```
