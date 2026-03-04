# API Key Management Strategy

## Overview

This document outlines the comprehensive strategy for managing API keys and secrets in the KampusAbla platform, including rotation procedures, monitoring, and security best practices.

## 1. API Key Inventory

### Supabase Keys
| Key Type | Location | Usage | Rotation Frequency |
|-----------|----------|--------|-------------------|
| `SUPABASE_URL` | Environment variable | Database connection | As needed |
| `SUPABASE_ANON_KEY` | Environment variable | Client-side access | Quarterly |
| `SUPABASE_SERVICE_ROLE_KEY` | Environment variable | Server-side admin access | Quarterly |

### Payment Gateway (iyzico)
| Key Type | Location | Usage | Rotation Frequency |
|-----------|----------|--------|-------------------|
| `IYZICO_API_KEY` | Environment variable | Payment processing | Annually |
| `IYZICO_SECRET_KEY` | Environment variable | Payment verification | Annually |
| `IYZICO_BASE_URL` | Environment variable | API endpoint | As needed |

### Firebase Cloud Messaging
| Key Type | Location | Usage | Rotation Frequency |
|-----------|----------|--------|-------------------|
| `FIREBASE_SERVICE_ACCOUNT` | Environment variable | Push notifications | Annually |
| `FCM_SERVER_KEY` | Environment variable | Legacy FCM | Annually |

### Google Maps API
| Key Type | Location | Usage | Rotation Frequency |
|-----------|----------|--------|-------------------|
| `GOOGLE_MAPS_API_KEY` | Environment variable | Location services | Annually |

### Other Services
| Key Type | Location | Usage | Rotation Frequency |
|-----------|----------|--------|-------------------|
| `JWT_SECRET` | Environment variable | Token signing | Annually |
| `JWT_REFRESH_SECRET` | Environment variable | Token refresh | Annually |
| `SENTRY_DSN` | Environment variable | Error tracking | As needed |

## 2. Key Storage Locations

### Development Environment
- `.env.local` (gitignored)
- Local development machine environment variables
- Supabase local project settings

### Staging Environment
- Staging CI/CD secrets (GitHub Actions)
- Staging Supabase project settings
- Staging environment variables

### Production Environment
- Production CI/CD secrets (GitHub Actions)
- Production Supabase project settings
- Production hosting provider secrets
- Password manager (1Password/Bitwarden team vault)

## 3. Rotation Procedure

### Automated Rotation (Quarterly/Annually)

1. **Preparation**
   ```bash
   # Create rotation branch
   git checkout -b security/rotate-keys-$(date +%Y%m%d)
   
   # Backup current keys
   cp .env.production .env.production.backup
   ```

2. **Generate New Keys**
   - Supabase: Dashboard → Settings → API → Regenerate keys
   - iyzico: Merchant panel → API Keys → Generate new
   - Firebase: Console → Project Settings → Service Accounts → Generate new
   - Google Maps: Cloud Console → Credentials → Create new key

3. **Update All Locations**
   ```bash
   # Update environment files
   # Update CI/CD secrets
   # Update Supabase project settings
   # Update hosting provider secrets
   ```

4. **Test in Staging**
   ```bash
   # Deploy to staging
   npm run deploy:staging
   
   # Run smoke tests
   npm run test:smoke
   ```

5. **Deploy to Production**
   ```bash
   # Schedule maintenance window
   # Deploy with zero downtime
   npm run deploy:production
   
   # Verify all services working
   npm run test:health-check
   ```

6. **Cleanup**
   ```bash
   # Deactivate old keys
   # Update documentation
   # Notify team of rotation
   ```

### Emergency Rotation (Compromise suspected)

1. **Immediate Actions**
   - Revoke all potentially compromised keys
   - Generate new keys immediately
   - Update all production services

2. **Communication**
   - Alert security team
   - Notify all developers
   - Document incident

3. **Post-Incident**
   - Review access logs
   - Update rotation procedures
   - Conduct security audit

## 4. Monitoring and Detection

### Key Expiration Monitoring
```typescript
// services/keyMonitor.ts
export class KeyMonitor {
  async checkKeyExpirations() {
    const keys = await this.getAllKeys();
    const expiringSoon = keys.filter(key => 
      key.expiresAt && 
      new Date(key.expiresAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    );
    
    if (expiringSoon.length > 0) {
      await this.sendExpirationAlert(expiringSoon);
    }
  }
}
```

### Key Leak Detection
```yaml
# .github/workflows/leak-detection.yml
name: Key Leak Detection
on: [push, pull_request]
jobs:
  detect-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### Access Logging
```typescript
// services/keyAuditLogger.ts
export class KeyAuditLogger {
  async logKeyUsage(keyId: string, service: string, userId?: string) {
    await supabase.from('api_key_usage_logs').insert({
      key_id: keyId,
      service,
      user_id: userId,
      ip_address: this.getClientIP(),
      user_agent: this.getUserAgent(),
      timestamp: new Date(),
    });
  }
}
```

## 5. Secrets Management Implementation

### Environment Variable Validation
```typescript
// lib/envValidation.ts
export function validateRequiredEnvVars() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'IYZICO_API_KEY',
    'IYZICO_SECRET_KEY',
    // ... other required vars
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### Runtime Secret Loading
```typescript
// lib/secretManager.ts
export class SecretManager {
  private static secrets = new Map<string, string>();
  
  static async getSecret(key: string): Promise<string> {
    if (this.secrets.has(key)) {
      return this.secrets.get(key)!;
    }
    
    // Load from environment or secret store
    const value = process.env[key] || await this.loadFromVault(key);
    this.secrets.set(key, value);
    return value;
  }
  
  private static async loadFromVault(key: string): Promise<string> {
    // Integration with AWS Secrets Manager, HashiCorp Vault, etc.
    // For now, return environment variable
    return process.env[key] || '';
  }
}
```

## 6. Security Best Practices

### Development
- Never commit `.env` files to version control
- Use `.env.example` as template
- Rotate development keys monthly
- Limit development key permissions

### Production
- Use read-only keys where possible
- Implement IP restrictions on API keys
- Use separate keys for different environments
- Regular security audits

### Access Control
- Implement principle of least privilege
- Use service accounts for automated processes
- Regular access reviews
- MFA for all key management interfaces

## 7. Incident Response Plan

### Key Compromise
1. **Detection**
   - Monitor for unusual API usage patterns
   - Set up alerts for failed authentication attempts
   - Regular security scans

2. **Response**
   - Immediate key revocation
   - Force rotation of all keys
   - Investigate breach scope

3. **Recovery**
   - Generate new keys with stronger security
   - Update all integrations
   - Monitor for continued unauthorized access

## 8. Compliance and Documentation

### KVKK Compliance
- Document all data processing activities
- Maintain audit logs for 5 years
- Implement data minimization principles
- Regular security assessments

### Documentation Requirements
- Maintain current key inventory
- Document all rotation procedures
- Keep incident response plans updated
- Regular security training

## 9. Implementation Checklist

### Initial Setup
- [ ] Create key inventory spreadsheet
- [ ] Set up secrets management system
- [ ] Configure monitoring alerts
- [ ] Implement leak detection
- [ ] Document all procedures

### Ongoing Maintenance
- [ ] Quarterly key rotation
- [ ] Monthly access reviews
- [ ] Weekly security scans
- [ ] Annual security audit
- [ ] Update documentation

## 10. Tools and Resources

### Recommended Tools
- **Secret Management**: AWS Secrets Manager, HashiCorp Vault
- **Leak Detection**: GitGuardian, TruffleHog
- **Monitoring**: Datadog, Sentry
- **Access Control**: Okta, Auth0

### Useful Scripts
```bash
#!/bin/bash
# scripts/rotate-keys.sh
# Automated key rotation script
# Usage: ./rotate-keys.sh --service=supabase --env=production
```

```typescript
// scripts/key-health-check.ts
// Runtime key validation
// Checks if all keys are valid and not expired
```

## Contact Information

For security issues or key-related emergencies:
- Security Team: security@kampusabla.com
- DevOps Team: devops@kampusabla.com
- Emergency: +90-555-XXX-XXXX

---

**Last Updated:** 2026-02-19  
**Review Date:** 2026-05-19  
**Next Review:** 2026-08-19