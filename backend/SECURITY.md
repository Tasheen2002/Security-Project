# SECURITY.md

## Security Measures Implemented

- Input validation and sanitization for all user inputs
- CSRF protection using double submit cookie pattern
- Rate limiting to prevent brute force and DoS attacks
- Centralized error handling to avoid information leakage
- HTTPS support (SSL certificate required)
- Security event logging
- Access control for user-specific resources
- OWASP Top 10 vulnerabilities mitigated

## How to Test

- Try submitting invalid purchase data (date, time, location, etc.)
- Attempt XSS or injection in message fields
- Exceed rate limits to trigger 429 errors
- Test CSRF protection by omitting or mismatching CSRF tokens
- Review logs for security events

## Next Steps

- Integrate Auth0/OIDC for authentication and access control
- Further enhance logging and monitoring
