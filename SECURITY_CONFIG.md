# Security Configuration Guide - AI Workout Pro

## 🔒 Overview

This guide outlines the security configurations required for production deployment of AI Workout Pro. Follow these guidelines to ensure your application is properly secured.

## 🚨 Critical Security Requirements

### 1. Authentication & Authorization

#### NextAuth.js Security
```bash
# Generate secure secrets (required)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)
```

**Security Checklist:**
- [ ] Use strong, unique secrets (minimum 32 characters)
- [ ] Enable HTTPS in production (`NEXTAUTH_URL=https://...`)
- [ ] Configure secure session strategy (JWT is configured)
- [ ] Set up proper callback URLs for OAuth providers

#### OAuth Provider Security

**Google OAuth Configuration:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create production OAuth 2.0 client ID
3. Configure authorized origins:
   ```
   https://yourdomain.com
   ```
4. Configure authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

**GitHub OAuth Configuration:**
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create new OAuth App for production
3. Set authorization callback URL:
   ```
   https://yourdomain.com/api/auth/callback/github
   ```

### 2. Database Security (Supabase)

#### Row Level Security (RLS)
All tables must have RLS enabled with proper policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_workouts ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

#### Database Access Control
- [ ] Use service role key only for admin operations
- [ ] Use anon key for client-side operations
- [ ] Implement proper RLS policies for all tables
- [ ] Regularly audit database access logs

### 3. API Security

#### Rate Limiting Configuration
The application implements multiple layers of rate limiting:

```typescript
// Production rate limits
const RATE_LIMITS = {
  workoutGeneration: 10, // per hour per user
  apiGeneral: 100,       // per hour per user
  authAttempts: 5,       // per 15 minutes per IP
};
```

#### Input Validation
All API endpoints include input validation:
- [ ] Request body validation
- [ ] Parameter sanitization
- [ ] Type checking
- [ ] Length limits

### 4. Environment Security

#### Environment Variables
**Never commit these to version control:**
```bash
# Secrets (generate new for production)
NEXTAUTH_SECRET=
AUTH_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OAuth credentials
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_SECRET=
```

#### Secret Generation
```bash
# Generate secure random strings
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For AUTH_SECRET
openssl rand -hex 32     # Alternative format
```

## 🛡️ Security Headers

### Next.js Security Headers
Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.openai.com;"
          }
        ]
      }
    ];
  }
};
```

### Content Security Policy (CSP)
Configure appropriate CSP headers:

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-eval' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://*.supabase.co https://api.openai.com https://*.anthropic.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

## 🚫 CORS Configuration

### Middleware Configuration
The `middleware.ts` includes authentication checks. For production, ensure:

```typescript
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
```

### API CORS
If needed, configure CORS for API routes:

```typescript
// In API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## 🔐 SSL/TLS Configuration

### HTTPS Requirements
- [ ] Force HTTPS redirects
- [ ] Use TLS 1.2 or higher
- [ ] Configure HSTS headers
- [ ] Use strong cipher suites

### Certificate Management
- [ ] Use valid SSL certificates (Let's Encrypt, commercial CA)
- [ ] Set up automatic certificate renewal
- [ ] Monitor certificate expiration

## 🔍 Security Monitoring

### Error Handling
Ensure no sensitive information is exposed:

```typescript
// Good: Generic error messages
return NextResponse.json(
  { error: 'Authentication failed' },
  { status: 401 }
);

// Bad: Exposing internal details
return NextResponse.json(
  { error: `Database connection failed: ${internalError}` },
  { status: 500 }
);
```

### Logging & Monitoring
- [ ] Log authentication events
- [ ] Monitor failed login attempts
- [ ] Track API usage patterns
- [ ] Set up security alerts

## 🛠️ Security Testing

### Pre-Deployment Tests
- [ ] Authentication flow testing
- [ ] Authorization boundary testing
- [ ] Input validation testing
- [ ] Rate limiting verification
- [ ] SQL injection prevention
- [ ] XSS prevention

### Security Scanning
Recommended tools:
- [ ] **npm audit**: Check for vulnerable dependencies
- [ ] **Snyk**: Automated vulnerability scanning
- [ ] **OWASP ZAP**: Web application security scanner
- [ ] **Lighthouse**: Security best practices audit

```bash
# Run security checks
npm audit
npm audit fix
```

## 🚨 Incident Response

### Security Incident Checklist
1. **Immediate Response:**
   - [ ] Identify affected systems
   - [ ] Contain the incident
   - [ ] Preserve evidence

2. **Investigation:**
   - [ ] Analyze logs
   - [ ] Determine root cause
   - [ ] Assess impact

3. **Recovery:**
   - [ ] Apply security patches
   - [ ] Reset compromised credentials
   - [ ] Update security configurations

4. **Post-Incident:**
   - [ ] Document lessons learned
   - [ ] Update security procedures
   - [ ] Implement additional controls

### Emergency Contacts
- **Security Team**: [Add contact]
- **Infrastructure Team**: [Add contact]
- **Legal/Compliance**: [Add contact]

## 📋 Security Audit Checklist

### Regular Security Audits
Perform monthly:
- [ ] Review user access permissions
- [ ] Audit database access logs
- [ ] Check for unauthorized API usage
- [ ] Review error logs for security events
- [ ] Verify SSL certificate status
- [ ] Update dependency vulnerabilities

### Quarterly Reviews
- [ ] Penetration testing
- [ ] Security configuration review
- [ ] Business continuity planning
- [ ] Incident response plan review

## 🔧 Security Tools & Scripts

### Dependency Security Check
```bash
#!/bin/bash
# security-check.sh
echo "Running security audit..."
npm audit --audit-level=moderate
echo "Checking for known vulnerabilities..."
npx snyk test
```

### Environment Security Validation
```bash
#!/bin/bash
# validate-env.sh
required_vars=(
  "NEXTAUTH_SECRET"
  "AUTH_SECRET"
  "OPENAI_API_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done
echo "✅ All required environment variables are set"
```

## 📚 Security Resources

### Documentation
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Training Resources
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

---

## ⚠️ Important Reminders

1. **Never commit secrets** to version control
2. **Use environment variables** for all configuration
3. **Implement defense in depth** - multiple security layers
4. **Regular security updates** - keep dependencies current
5. **Monitor and log** all security-relevant events
6. **Test security configurations** before deployment
7. **Have an incident response plan** ready

---

**Last Updated**: 2025-05-29  
**Review Schedule**: Monthly  
**Next Review**: 2025-06-29