# Deployment Guide - AI Workout Pro

## 🚀 Overview

This guide provides step-by-step instructions for deploying AI Workout Pro to production environments. The application is optimized for deployment on Vercel but can be deployed to any Node.js hosting platform.

## 📋 Prerequisites

### Development Environment
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git repository access
- [ ] Development environment working correctly

### Third-Party Services
- [ ] Supabase account and project
- [ ] OpenAI API account
- [ ] Google Cloud Console access (for Google OAuth)
- [ ] GitHub account (for GitHub OAuth)

### Domain & Hosting
- [ ] Production domain purchased
- [ ] DNS management access
- [ ] Hosting platform account (Vercel recommended)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes     │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API)  │◄──►│   (Supabase)    │
│                 │    │                  │    │                 │
│ - React Components   │ - Authentication  │    │ - PostgreSQL    │
│ - Client-side Logic  │ - Workout Gen.    │    │ - Row Level Sec │
│ - Authentication     │ - Rate Limiting   │    │ - Real-time     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │   AI Services   │
                       │   (OpenAI)      │
                       │                 │
                       │ - GPT-4 API     │
                       │ - Workout Gen   │
                       └─────────────────┘
```

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

**Advantages:**
- Optimized for Next.js
- Automatic deployments
- Built-in environment management
- Global CDN
- Serverless functions

#### Vercel Deployment Steps

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from repository root
   vercel
   ```

2. **Configure Project Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**
   Go to Vercel Dashboard → Project → Settings → Environment Variables

   Copy all variables from `.env.production.template` with production values.

4. **Configure Custom Domain**
   - Add domain in Vercel dashboard
   - Update DNS records as instructed
   - Verify SSL certificate is active

### Option 2: Netlify

#### Netlify Deployment Steps

1. **Build Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all production variables

### Option 3: Self-Hosted (VPS/Cloud)

#### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env.production
       restart: unless-stopped
   ```

3. **Deployment Commands**
   ```bash
   # Build and run
   docker-compose up -d
   
   # With nginx reverse proxy
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🗄️ Database Setup (Supabase)

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Choose production-appropriate region
4. Set strong database password

### 2. Database Schema Migration

```sql
-- Connect to Supabase SQL Editor and run:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (copy from SUPABASE_SCHEMA.md)
-- Run all CREATE TABLE statements
-- Run all RLS policies
-- Create indexes
```

### 3. Authentication Setup

1. **Configure OAuth Providers**
   - Go to Authentication → Settings → Auth Providers
   - Enable Google OAuth
   - Enable GitHub OAuth
   - Configure redirect URLs

2. **Security Settings**
   - Set site URL to production domain
   - Configure JWT expiry
   - Enable email confirmations (if needed)

### 4. Environment Variables

```bash
# Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 🔐 OAuth Configuration

### Google OAuth Setup

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Google+ API

2. **OAuth 2.0 Client**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized JavaScript origins:
     ```
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     https://yourdomain.com/api/auth/callback/google
     ```

3. **Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
   ```

### GitHub OAuth Setup

1. **GitHub Developer Settings**
   - Go to [GitHub Settings](https://github.com/settings/applications/new)
   - Register new OAuth App

2. **Configuration**
   - Application name: AI Workout Pro (Production)
   - Homepage URL: `https://yourdomain.com`
   - Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`

3. **Environment Variables**
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

## 🤖 AI Services Setup

### OpenAI Configuration

1. **API Key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create new API key for production
   - Set usage limits and monitoring

2. **Production Settings**
   ```bash
   OPENAI_API_KEY=sk-proj-your_production_key
   AI_MODEL=gpt-4
   MAX_TOKENS=2000
   TEMPERATURE=0.7
   ```

3. **Rate Limiting**
   - Monitor API usage in OpenAI dashboard
   - Set up billing alerts
   - Configure rate limits based on expected traffic

### Alternative: Anthropic (Backup)

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your_production_key
```

## 🔧 Environment Configuration

### Production Environment Variables

Use the `.env.production.template` file as reference:

```bash
# Critical variables that MUST be set:
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)

# Database
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# AI
OPENAI_API_KEY=sk-proj-...
```

### Environment Variable Validation

Create validation script:

```bash
#!/bin/bash
# validate-production-env.sh

required_vars=(
  "NEXT_PUBLIC_BASE_URL"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
  "AUTH_SECRET"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GITHUB_CLIENT_ID"
  "GITHUB_CLIENT_SECRET"
  "OPENAI_API_KEY"
)

echo "🔍 Validating production environment variables..."

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    exit 1
  else
    echo "✅ Found: $var"
  fi
done

echo "🎉 All required environment variables are set!"
```

## 🚦 Pre-Deployment Testing

### Local Production Build

```bash
# Test production build locally
npm run build
npm run start

# Verify all features work:
# - User registration/login
# - OAuth authentication
# - Workout generation
# - Database connections
```

### Testing Checklist

- [ ] **Authentication Flow**
  - Email/password login
  - Google OAuth login
  - GitHub OAuth login
  - User registration

- [ ] **Core Features**
  - Workout generation
  - Favorites system
  - User profiles
  - History tracking

- [ ] **API Endpoints**
  - `/api/generate-workout`
  - `/api/auth/[...nextauth]`
  - All protected routes

- [ ] **Database Operations**
  - User creation
  - Profile updates
  - Session tracking
  - Data persistence

- [ ] **Performance**
  - Page load times
  - API response times
  - AI generation speed

## 🎯 Deployment Process

### Step-by-Step Deployment

1. **Pre-deployment Checks**
   ```bash
   # Run all tests
   npm test
   
   # Type checking
   npm run type-check
   
   # Linting
   npm run lint
   
   # Build verification
   npm run build
   ```

2. **Environment Setup**
   - Set all production environment variables
   - Verify secrets are properly generated
   - Test all external service connections

3. **Database Migration**
   - Create production Supabase project
   - Run schema migration
   - Verify RLS policies
   - Test database connections

4. **Deploy Application**
   ```bash
   # For Vercel
   vercel --prod
   
   # Or commit to main branch for auto-deployment
   git push origin main
   ```

5. **Post-deployment Verification**
   - Test all authentication flows
   - Verify API endpoints
   - Check error monitoring
   - Monitor performance metrics

### Rollback Plan

In case of deployment issues:

1. **Immediate Rollback**
   ```bash
   # Vercel rollback to previous deployment
   vercel rollback [deployment-url]
   ```

2. **Database Rollback**
   - Restore from backup if needed
   - Revert schema changes

3. **Environment Rollback**
   - Revert environment variables
   - Check configuration changes

## 📊 Monitoring & Maintenance

### Health Checks

Implement health check endpoint:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### Monitoring Setup

1. **Application Monitoring**
   - Set up Sentry for error tracking
   - Configure performance monitoring
   - Set up uptime monitoring

2. **Infrastructure Monitoring**
   - Monitor hosting platform metrics
   - Database performance monitoring
   - API usage tracking

### Maintenance Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor API usage
- [ ] Review security logs

**Monthly:**
- [ ] Update dependencies
- [ ] Review security configurations
- [ ] Performance optimization
- [ ] Backup verification

## 🚨 Troubleshooting

### Common Issues

1. **OAuth Redirect Errors**
   ```
   Error: redirect_uri_mismatch
   Solution: Verify callback URLs in OAuth provider settings
   ```

2. **Database Connection Issues**
   ```
   Error: Could not connect to database
   Solution: Check Supabase credentials and RLS policies
   ```

3. **AI API Errors**
   ```
   Error: Rate limit exceeded
   Solution: Verify API keys and rate limiting configuration
   ```

4. **Environment Variable Issues**
   ```
   Error: Missing required environment variable
   Solution: Use validation script to check all variables
   ```

### Debug Mode

Enable debug logging temporarily:

```bash
# Add to environment variables for debugging
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Support Contacts

- **Development Team**: [Add contact]
- **Infrastructure**: [Add contact]
- **Database Admin**: [Add contact]

## 📚 Additional Resources

### Documentation
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Monitoring Tools
- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Session replay
- [Pingdom](https://www.pingdom.com/) - Uptime monitoring

---

## ✅ Deployment Completion Checklist

Final verification before going live:

- [ ] All environment variables configured
- [ ] Database schema deployed and tested
- [ ] OAuth providers configured and tested
- [ ] AI services working correctly
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Error monitoring enabled
- [ ] Performance monitoring active
- [ ] Backup systems in place
- [ ] Team access configured
- [ ] Documentation updated
- [ ] Stakeholders notified

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Production URL**: ___________  
**Version**: ___________