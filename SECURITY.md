# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.2.x   | ✅ Current          |
| < 0.2   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: [Create a private security advisory](https://github.com/andrewhofmann/KrakenEgg/security/advisories/new)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 1 week
- **Fix**: Within 2 weeks for critical issues

## Security Measures

- **Dependency scanning**: Automated via GitHub Dependabot
- **Code scanning**: GitHub CodeQL analysis on every PR
- **Rust safety**: Memory-safe backend with no unsafe code
- **Tauri security**: Scoped file system access, no arbitrary shell execution
- **Input validation**: File name validation, path sanitization
