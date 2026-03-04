# Domain & SSL Setup Guide

## Overview

This document outlines the steps required to set up a custom domain and SSL certificate for the KampusAbla application, which is deployed on Vercel.

## Prerequisites

- Access to domain registrar (e.g., GoDaddy, Namecheap, etc.)
- Access to Vercel account with project deployed
- Administrative access to DNS settings

## Step-by-Step Guide

### 1. Purchase Domain (if not already done)

1. Choose a domain name (e.g., `kampusabla.com`)
2. Purchase from a domain registrar
3. Ensure domain registration is for at least 1 year (recommended 3+ years for SEO)
4. Enable domain privacy protection (optional but recommended)

### 2. Configure DNS Records for Vercel

Vercel provides two options for DNS configuration:

#### Option A: Using Vercel's DNS (Recommended)

1. In Vercel dashboard, go to Project Settings → Domains
2. Add your custom domain (e.g., `kampusabla.com`)
3. Vercel will display nameservers to use (typically `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
4. Update nameservers at your domain registrar to point to Vercel's nameservers
5. Wait for DNS propagation (typically 24-48 hours)

#### Option B: Using CNAME/A Records (If keeping existing DNS provider)

1. In Vercel dashboard, go to Project Settings → Domains
2. Add your custom domain
3. Vercel will provide DNS records to add:
   ```
   Type: CNAME
   Name: @ (or your domain name)
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Add these records in your domain's DNS settings

### 3. Set up SSL Certificate

Vercel automatically provides free SSL certificates for all custom domains through Let's Encrypt:

1. Once DNS is configured, Vercel will automatically provision SSL certificates
2. This process typically completes within a few minutes after DNS propagation
3. Verify SSL certificate is active by checking for the padlock icon in browser

### 4. Configure HTTPS Redirect

Vercel automatically redirects HTTP to HTTPS for all custom domains. No additional configuration is needed.

### 5. Add HSTS Header for Security

To add HSTS (HTTP Strict Transport Security) header:

1. Create a `vercel.json` configuration file in your project root (if not exists)
2. Add the following configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/health.json"
    },
    {
      "source": "/status",
      "destination": "/status.html"
    }
  ]
}
```

3. Deploy the updated configuration to Vercel

### 6. Configure Subdomain for Staging

To set up a staging subdomain (e.g., `staging.kampusabla.com`):

1. In Vercel, create a new project for staging or use a preview deployment
2. Add the staging subdomain in Vercel dashboard
3. Configure DNS records:
   ```
   Type: CNAME
   Name: staging
   Value: cname.vercel-dns.com
   ```
4. Ensure environment variables are properly configured for staging

## Verification Steps

After completing the setup, verify:

1. **Domain Resolution**: `nslookup kampusabla.com` should resolve to Vercel's IP
2. **SSL Certificate**: Check certificate details in browser (should show Let's Encrypt)
3. **HTTPS Redirect**: Visiting `http://kampusabla.com` should redirect to `https://kampusabla.com`
4. **HSTS Header**: Check response headers include `Strict-Transport-Security`
5. **Subdomain**: Verify `staging.kampusabla.com` resolves correctly

## Troubleshooting

### Common Issues

1. **DNS Propagation Delay**
   - DNS changes can take 24-48 hours to propagate globally
   - Use tools like `dnschecker.org` to check propagation status

2. **SSL Certificate Not Issuing**
   - Ensure DNS records are correctly configured
   - Check that domain status is "Verified" in Vercel dashboard
   - Wait for DNS propagation to complete

3. **HSTS Not Working**
   - Verify the `vercel.json` configuration is correctly formatted
   - Check that the deployment includes the updated configuration

### Useful Commands

```bash
# Check DNS resolution
nslookup kampusabla.com
dig kampusabla.com

# Check SSL certificate
openssl s_client -connect kampusabla.com:443

# Check HTTP headers
curl -I https://kampusabla.com
```

## Security Best Practices

1. **Domain Privacy**: Enable domain privacy protection to prevent personal information exposure
2. **DNSSEC**: Consider enabling DNSSEC for additional DNS security
3. **Certificate Monitoring**: Set up monitoring for certificate expiration
4. **Backup DNS**: Consider using a secondary DNS provider for redundancy

## Maintenance

1. **Domain Renewal**: Set reminders for domain renewal (recommended 3+ year registration)
2. **Certificate Renewal**: Vercel automatically handles Let's Encrypt certificate renewal
3. **Regular Checks**: Periodically verify SSL and security headers are properly configured

## Documentation Updates

After completing the domain setup:

1. Update any hardcoded URLs in the codebase to use the new domain
2. Update documentation with the new domain URLs
3. Update any third-party services (OAuth providers, payment gateways) with new domain
4. Update environment variables if needed

---

**Note**: This guide assumes deployment on Vercel. If using a different hosting provider, some steps may vary.