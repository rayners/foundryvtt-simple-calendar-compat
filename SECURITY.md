# Security Policy

## Supported Versions

We provide security updates for the following versions of Simple Calendar Compatibility Bridge:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Current release |

## Reporting a Vulnerability

If you discover a security vulnerability in Simple Calendar Compatibility Bridge, please report it responsibly:

### Reporting Process

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. **Send a private email** to the maintainer with details
3. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fix (if available)

### Contact Information

- **Email**: Use GitHub's private vulnerability reporting feature
- **Response Time**: We aim to acknowledge reports within 48 hours
- **Resolution Time**: Critical vulnerabilities will be addressed within 7 days

### What to Expect

1. **Acknowledgment** - Confirmation that we received your report
2. **Assessment** - Evaluation of the vulnerability and impact
3. **Resolution** - Development and testing of a fix
4. **Disclosure** - Coordinated public disclosure after the fix is available
5. **Credit** - Public acknowledgment of your responsible disclosure (if desired)

## Security Best Practices

When using Simple Calendar Compatibility Bridge:

### For GMs and Users

- **Keep Updated**: Always use the latest version for security fixes
- **Foundry Security**: Follow Foundry VTT security best practices
- **Module Permissions**: Review permissions for all installed modules
- **Data Backup**: Regularly backup your calendar data and notes

### For Developers

- **Input Validation**: All user inputs are validated and sanitized
- **Permission Checks**: Calendar modifications require appropriate GM permissions
- **Data Integrity**: Calendar data is validated before processing
- **API Security**: Bridge operations use read-only calendar APIs where possible

## Known Security Considerations

### Bridge Architecture

- Bridge module operates with limited permissions
- Uses only public APIs from target calendar modules (Seasons & Stars)
- No direct modification of core Foundry data structures
- Compatibility layer does not store sensitive data

### Calendar Data

- Calendar notes may contain sensitive campaign information
- Consider world-level permissions when sharing calendar access
- Bridge creates notes using standard Foundry document system
- All note creation follows Foundry's permission model

### Module Integration

- Simple Calendar API emulation uses safe, documented methods
- Third-party module integrations (Simple Weather) use public APIs only
- No sensitive data is logged or transmitted externally
- Hook system uses standard Foundry event patterns

## Common Attack Vectors

### Data Injection

- **Mitigation**: All calendar data is validated before processing
- **Protection**: No dynamic code execution from calendar definitions
- **Validation**: User inputs are sanitized through Foundry's standard methods

### Permission Escalation

- **Mitigation**: Bridge respects Foundry's built-in permission system
- **Protection**: No bypass of GM/player restrictions
- **Verification**: All operations check user permissions before execution

### Cross-Module Interference

- **Mitigation**: Clean separation between compatibility layer and target modules
- **Protection**: No direct manipulation of other modules' internal state
- **Isolation**: Uses only documented public APIs for integration

## Disclosure Policy

- **Responsible Disclosure**: We follow coordinated vulnerability disclosure
- **Public Notice**: Security fixes are announced in release notes
- **CVE Assignment**: Critical vulnerabilities may receive CVE identifiers
- **Acknowledgments**: Security researchers are credited publicly (unless requested otherwise)

## Additional Resources

- [Foundry VTT Security Guidelines](https://foundryvtt.com/article/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security)
- [Node.js Security Guidelines](https://nodejs.org/en/security/)
- [Seasons & Stars Security Policy](https://github.com/rayners/fvtt-seasons-and-stars/blob/main/SECURITY.md)

---

_Last updated: September 2025_
