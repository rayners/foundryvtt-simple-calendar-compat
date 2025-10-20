# Simple Calendar Compatibility Bridge Release Process

## Pre-Release Checklist

### Development Ready

- [ ] All planned features completed
- [ ] All tests passing (`npm run test:run`)
- [ ] Clean build with no critical errors (`npm run build`)
- [ ] TypeScript compilation clean (`npm run typecheck`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Code formatting consistent (`npm run format:check`)
- [ ] Version updated in `module.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] Documentation updated if needed

### Quality Assurance

- [ ] Manual testing in Foundry VTT with Seasons & Stars
- [ ] Simple Calendar API compatibility verified
- [ ] Simple Weather integration tested (if applicable)
- [ ] Cross-browser compatibility verified
- [ ] Module integration testing completed
- [ ] Performance testing for calendar operations
- [ ] Security review completed

### Repository Preparation

- [ ] All changes committed to main branch
- [ ] Repository is clean (`git status`)
- [ ] Branch is up to date with origin
- [ ] No uncommitted development files
- [ ] All validation checks pass (`npm run validate`)

## Release Steps

### 1. Create Release Tag

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create and push release tag
git tag v0.1.0
git push origin v0.1.0
```

### 2. Monitor Release Workflow

- GitHub Actions will automatically:
  - Install dependencies
  - Run tests and linting
  - Build module
  - Create release package
  - Upload module.zip and module.json
  - Create GitHub release with changelog

### 3. Verify Release

- [ ] GitHub release created successfully
- [ ] module.zip contains all required files
- [ ] module.json is accessible at release URL
- [ ] Release notes are accurate and complete
- [ ] Download links work correctly

### 4. Post-Release Tasks

- [ ] Test installation from GitHub URL
- [ ] Verify Simple Calendar compatibility in fresh world
- [ ] Announce in Foundry Discord (#module-showcase)
- [ ] Post on Reddit r/FoundryVTT
- [ ] Update documentation site if needed
- [ ] Monitor for immediate issues/feedback

## Release URLs

After successful release, these URLs should be functional:

- **Module Manifest**: `https://github.com/rayners/foundryvtt-simple-calendar-compat/releases/latest/download/module.json`
- **Module Package**: `https://github.com/rayners/foundryvtt-simple-calendar-compat/releases/latest/download/module.zip`
- **Release Page**: `https://github.com/rayners/foundryvtt-simple-calendar-compat/releases/latest`

## Troubleshooting

### Common Issues

**Build Failure**

- Check TypeScript compilation errors
- Verify all dependencies are installed
- Ensure dist directory is clean before build

**Test Failure**

- Review failing test output
- Update tests if API changes were made
- Verify mock data is current

**Release Upload Failure**

- Check GitHub Actions permissions
- Verify GITHUB_TOKEN has required scopes
- Ensure release tag follows semantic versioning

**Package Missing Files**

- Update rollup.config.js copy targets
- Verify working-directory in GitHub Actions
- Check module-files parameter in workflow

### Rollback Process

If critical issues are discovered after release:

1. **Immediate Fix Available**

   ```bash
   # Fix the issue, commit changes
   git add .
   git commit -m "hotfix: critical issue description"

   # Create patch version
   git tag v0.1.1
   git push origin v0.1.1
   ```

2. **Need Time to Fix**
   - Edit GitHub release to mark as pre-release
   - Add warning in release description
   - Communicate issue in Discord/Reddit posts

## Version Strategy

**v0.1.0** - Initial public release

- Core Simple Calendar API compatibility
- Basic Simple Weather support
- Production-ready for early adopters

**v0.1.x** - Patch releases

- Bug fixes only
- No breaking changes
- Rapid deployment for critical issues

**v0.2.0** - Minor feature release

- Enhanced API compatibility
- Additional module integrations
- Community-requested enhancements

**v1.0.0** - Stable major release

- Complete Simple Calendar API coverage
- Extensive module compatibility testing
- Comprehensive documentation and examples

## Compatibility Testing

### Required Testing Scenarios

- [ ] Fresh Foundry world with Seasons & Stars + this module
- [ ] Simple Weather integration (if installed)
- [ ] Calendar date changes and time advancement
- [ ] Note creation and calendar highlighting
- [ ] Widget button functionality
- [ ] Hook event propagation

### Test Environments

- [ ] Chrome browser
- [ ] Firefox browser
- [ ] Foundry VTT v13+ (latest stable)
- [ ] Multiple game systems (D&D 5e, PF2e, etc.)

## Support and Monitoring

### Week 1 Monitoring

- Daily check of GitHub issues
- Monitor Foundry Discord discussions
- Track download metrics
- Respond to user feedback within 24 hours

### Month 1 Goals

- 100+ downloads
- 5+ GitHub stars
- 3+ community discussions
- <2 critical issues reported
- 80%+ positive feedback

## Security Considerations

- [ ] No sensitive data exposed in logs
- [ ] Safe handling of calendar data
- [ ] Proper input validation for API calls
- [ ] No arbitrary code execution vulnerabilities
