# CI/CD Pipeline - Deployment Guide

## 🚀 Quick Start

This guide explains how to use the CI/CD pipeline that was just set up.

---

## 📋 Workflow Overview

### CI Workflow (`.github/workflows/ci.yml`)
**Triggers:** Pull requests and pushes to `main` or `develop`

**Jobs:**
1. **Quality Checks** - Type check, lint, build
2. **Security Scan** - npm audit for vulnerabilities
3. **E2E Tests** - Playwright tests for critical flows

**Duration:** ~5-8 minutes (with caching)

### Deploy Workflow (`.github/workflows/deploy.yml`)
**Triggers:** Pushes to `main` (production) or `develop` (staging)

**Jobs:**
1. **Deploy to Staging** - Auto-deploy from `develop` branch
2. **Deploy to Production** - Deploy from `main` (requires approval)

**Duration:** ~3-5 minutes

---

## 🔄 Development Workflow

### 1. Working on a Feature

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/my-feature
```

### 2. Create Pull Request

- CI workflow runs automatically
- All checks must pass (type-check, lint, build, tests)
- Request code review

### 3. Merge to Develop

```bash
# Once approved, merge to develop
git checkout develop
git merge feature/my-feature
git push origin develop
```

- Deploy workflow triggers automatically
- App deploys to **staging** environment
- Sentry release created with commit SHA

### 4. Deploy to Production

```bash
# When ready for production
git checkout main
git merge develop
git push origin main
```

- Deploy workflow triggers
- **Requires manual approval** (GitHub environment protection)
- App deploys to **production**
- Sentry release finalized

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All E2E tests passing
- [ ] No security vulnerabilities (npm audit)
- [ ] Staging tested by QA team
- [ ] Database migrations applied to production
- [ ] Environment variables updated (if needed)
- [ ] Sentry alerts configured
- [ ] Rollback plan ready

---

## 🛡️ GitHub Environment Protection

### Staging Environment
- No required reviewers
- Auto-deploys from `develop` branch
- Use for testing and QA

### Production Environment
- **Requires 1+ approvals** before deployment
- Only deploys from `main` branch
- 5-minute wait timer (optional)
- Deploy protection rules enforced

**How to Approve:**
1. Go to repository → Actions
2. Find the deployment workflow run
3. Click "Review deployments"
4. Approve and deploy

---

## 📊 Monitoring Deployments

### Vercel Dashboard
- View deployment logs
- Check build status
- Monitor performance metrics

### Sentry Dashboard
- Track release health
- Monitor error rates
- View session replays

### GitHub Actions
- View workflow runs
- Download artifacts (test reports, security scans)
- Check deployment status

---

## 🔧 Troubleshooting

### CI Pipeline Fails

**Type Check Error:**
```bash
# Run locally to debug
npm run type-check
```

**Lint Error:**
```bash
# Run locally and auto-fix
npm run lint -- --fix
```

**E2E Test Failure:**
```bash
# Run tests locally
npm run test:e2e

# Run in headed mode for debugging
npm run test:e2e -- --headed
```

**Security Vulnerability:**
```bash
# Check vulnerabilities
npm audit

# Auto-fix (if possible)
npm audit fix

# View audit report
npm audit --json > audit.json
```

### Deployment Fails

**Build Error:**
- Check environment variables are set
- Verify `.env.production` has all required vars
- Check build logs in GitHub Actions

**Vercel Deployment Error:**
- Verify Vercel token is valid
- Check org ID and project ID
- Ensure Vercel project is linked

**Sentry Release Error:**
- Verify Sentry auth token is valid
- Check org slug and project slug
- Ensure Sentry project exists

---

## 🔄 Rollback Procedure

### Option 1: Revert Commit (Recommended)

```bash
# Find the last good commit
git log

# Revert to previous commit
git revert <commit-sha>
git push origin main
```

This triggers a new deployment with the reverted code.

### Option 2: Vercel Instant Rollback

1. Go to Vercel dashboard
2. Find the previous successful deployment
3. Click "Promote to Production"

**Note:** This is instant but doesn't update Git history.

### Option 3: Manual Rollback

1. Go to GitHub Actions
2. Find the last successful deployment
3. Re-run the workflow

---

## 📈 Performance Optimization

### Caching Strategy

**NPM Dependencies:**
- Cached via `actions/setup-node@v4`
- Cache key: `package-lock.json` hash
- Saves ~1-2 minutes per run

**Playwright Browsers:**
- Cached automatically by Playwright
- Only downloads on version changes

### Parallel Jobs

CI workflow runs jobs in parallel:
- Quality checks
- Security scan
- E2E tests

**Total time:** ~5 minutes (vs ~12 minutes sequential)

---

## 🔐 Security Considerations

### Secrets Management
- Never commit secrets to Git
- Use GitHub Secrets for sensitive data
- Rotate secrets every 6-12 months

### Branch Protection
- Require CI to pass before merge
- Require code review for `main` and `develop`
- Prevent force pushes to protected branches

### Deployment Protection
- Production requires manual approval
- Staging auto-deploys for fast iteration
- Environment-specific secrets

---

## 📝 Best Practices

1. **Always run CI locally before pushing:**
   ```bash
   npm run type-check && npm run lint && npm run build
   ```

2. **Test on staging before production:**
   - Merge to `develop` first
   - Test thoroughly on staging
   - Then merge to `main`

3. **Write meaningful commit messages:**
   - Use conventional commits: `feat:`, `fix:`, `chore:`
   - Include ticket/issue number if applicable

4. **Monitor Sentry after deployment:**
   - Check error rates
   - Review new issues
   - Validate release health

5. **Keep dependencies updated:**
   - Review Dependabot PRs weekly
   - Update major versions cautiously
   - Test thoroughly after updates

---

## 🆘 Getting Help

**CI/CD Issues:**
- Check GitHub Actions logs
- Review workflow YAML files
- Ask in team Slack/Discord

**Deployment Issues:**
- Check Vercel deployment logs
- Review environment variables
- Verify secrets are set correctly

**Error Monitoring:**
- Check Sentry dashboard
- Review error context and breadcrumbs
- Use session replay for debugging
