# CORS Configuration for Production

## Overview

This document explains the CORS (Cross-Origin Resource Sharing) configuration implemented for the KampusAbla platform's Supabase Edge Functions.

## Security Implementation

The platform now uses a centralized CORS configuration module (`supabase/functions/_shared/cors.ts`) that provides environment-aware CORS headers.

### Key Features

1. **Environment-Specific Origins**: Different allowed origins for development and production
2. **Origin Validation**: Only whitelisted domains can access the API
3. **Proper Headers**: Includes necessary headers for authentication and API access
4. **Credentials Support**: Enables cookies and authentication headers

## Environment Variables

### Development

In development mode, the following origins are automatically allowed:
- `http://localhost:3000`
- `http://localhost:5173` (Vite default)
- `http://localhost:8080`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:8080`

### Production

For production deployment, set these environment variables in your Supabase project:

```bash
# Set the environment to production
ENVIRONMENT=production

# Comma-separated list of allowed origins
CORS_ALLOWED_ORIGINS=https://kampusabla.com,https://www.kampusabla.com,https://app.kampusabla.com
```

### Staging

For staging environment:

```bash
# Set the environment to staging (treated as production for security)
ENVIRONMENT=production

# Staging domain(s)
CORS_ALLOWED_ORIGINS=https://staging.kampusabla.com
```

## Configuration Steps

### 1. Supabase Dashboard Configuration

1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Add the environment variables listed above

### 2. Deployment

When deploying to production:

1. Ensure `ENVIRONMENT=production` is set
2. Set `CORS_ALLOWED_ORIGINS` to your production domains
3. Remove any wildcard origins from production

### 3. Testing

To test CORS configuration:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://kampusabla.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, content-type" \
  https://your-project.supabase.co/functions/v1/process-payment

# Test actual request
curl -X POST \
  -H "Origin: https://kampusabla.com" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  https://your-project.supabase.co/functions/v1/process-payment
```

## Security Considerations

1. **Never use wildcard (`*`) in production**
2. **Always specify exact domains** in `CORS_ALLOWED_ORIGINS`
3. **Include both HTTP and HTTPS** if both are supported
4. **Don't forget subdomains** if they're used
5. **Update origins** when adding new domains

## Migration Notes

The following Edge Functions have been updated to use the shared CORS configuration:

- ✅ `process-payment`
- ✅ `send-notification`
- ✅ `iyzico-webhook`
- ✅ `delete-account`

### Remaining Functions

These functions still need to be updated:
- `cancel-subscription`
- `create-sub-merchant`
- `create-subscription-checkout`
- `export-user-data`
- `process-refund`
- `process-subscription-webhook`
- `send-push-notification`

To update a function:

1. Add import: `import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';`
2. Replace OPTIONS handler with: `const preflightResponse = handleCorsPreflight(req); if (preflightResponse) return preflightResponse;`
3. Replace `new Response()` calls with `createCorsResponse()`
4. Remove local `corsHeaders` constant

## Troubleshooting

### CORS Errors in Browser

If you see CORS errors:

1. Check if your domain is in `CORS_ALLOWED_ORIGINS`
2. Verify `ENVIRONMENT` is set correctly
3. Ensure the Edge Function has been redeployed after changes
4. Check browser console for specific error details

### Common Issues

1. **"No 'Access-Control-Allow-Origin' header"**
   - Origin not in allowed list
   - Environment variables not set

2. **"Credentials flag is true"**
   - Add `Access-Control-Allow-Credentials: true` (handled by shared module)

3. **"Method not allowed"**
   - Add method to `Access-Control-Allow-Methods` (handled by shared module)

## Monitoring

Monitor CORS issues by:

1. Checking Supabase Edge Function logs
2. Using browser developer tools
3. Testing with tools like Postman or curl

## Related Documentation

- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Security Best Practices](./SECURITY.md)