# SQL Injection Prevention Guide

## Overview

This document outlines the SQL injection prevention measures implemented in the KampusAbla platform and provides guidelines for maintaining secure database interactions.

## Current Security Measures

### 1. Database-Level Protections

#### Parameterized Queries
All RPC functions use parameterized queries with proper variable binding:

```sql
-- ✅ SECURE: Using parameterized queries
CREATE OR REPLACE FUNCTION public.search_sitters_by_location(
    p_lat NUMERIC,
    p_lng NUMERIC,
    -- ... other parameters
) RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.full_name,
        -- ... other fields
    FROM 
        public.sitters s
    WHERE 
        s.is_available = true
        AND s.hourly_rate BETWEEN p_min_price AND p_max_price
        AND COALESCE(s.average_rating, 0) >= p_min_rating
        -- Parameters are safely bound
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
            v_search_point::geography,
            p_radius_km * 1000
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Security Definer
All RPC functions are created with `SECURITY DEFINER` to ensure they execute with the permissions of the function owner, not the caller.

#### Input Validation
Functions include type checking and validation:

```sql
-- ✅ SECURE: Type constraints prevent injection
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_window_start TIMESTAMPTZ,
    p_max_requests INTEGER
) RETURNS TABLE(request_count INTEGER) AS $$
BEGIN
    -- Input validation through type system
    -- TEXT, TEXT, TIMESTAMPTZ, INTEGER ensure proper types
    
    -- Atomic operation prevents race conditions
    INSERT INTO public.rate_limit_tracking (identifier, action, window_start, request_count)
    VALUES (p_identifier, p_action, p_window_start, 1)
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET 
        request_count = rate_limit_tracking.request_count + 1,
        updated_at = NOW()
    RETURNING rate_limit_tracking.request_count INTO v_count;
    
    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Application-Level Protections

#### ORM Protection
Using Supabase client which provides built-in SQL injection protection:

```typescript
// ✅ SECURE: Supabase client handles parameterization
const { data, error } = await supabase
  .from('sitters')
  .select('*')
  .eq('id', userId) // Safely parameterized
  .limit(10);
```

#### Input Sanitization
User inputs are validated before database operations:

```typescript
// ✅ SECURE: Input validation
import { z } from 'zod';

const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(0).max(100),
  languages: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100),
});

// Validate before using in queries
const validatedInput = searchSchema.parse(userInput);
```

### 3. Row Level Security (RLS)

RLS policies ensure users can only access their own data:

```sql
-- ✅ SECURE: RLS policies prevent unauthorized access
CREATE POLICY "Users can view their own data" ON sensitive_table
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role only" ON rate_limit_tracking
    FOR ALL
    USING (auth.role() = 'service_role');
```

## Audited Functions

### 1. search_sitters_by_location
- **Status**: ✅ SECURE
- **Protection**: Parameterized queries, type constraints
- **Test Coverage**: Comprehensive test suite in `src/test/security/sql-injection.test.ts`

### 2. increment_rate_limit
- **Status**: ✅ SECURE
- **Protection**: Parameterized queries, atomic operations
- **Test Coverage**: Included in test suite

### 3. is_review_eligible
- **Status**: ✅ SECURE
- **Protection**: Parameterized queries, existence checks
- **Test Coverage**: Included in test suite

### 4. update_sitter_rating
- **Status**: ✅ SECURE
- **Protection**: Parameterized queries, aggregation functions
- **Test Coverage**: Included in test suite

## Testing Strategy

### Automated Tests
- **Location**: `src/test/security/sql-injection.test.ts`
- **Coverage**: All RPC functions, direct queries, auth flows
- **Attack Vectors Tested**:
  - Classic SQL injection (`' OR '1'='1`)
  - Union-based attacks (`UNION SELECT`)
  - Time-based attacks (`WAITFOR DELAY`)
  - Error-based attacks (subquery attacks)
  - Blind SQL injection
  - NoSQL injection (JSON fields)
  - Large object injection
  - Second-order injection

### Manual Testing
1. **SQLMap Integration**: Periodic automated scanning
2. **Penetration Testing**: Quarterly security assessments
3. **Code Review**: All database changes require security review

## Monitoring and Detection

### 1. Query Logging
All database queries are logged via Supabase's built-in logging:

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
```

### 2. Anomaly Detection
Monitor for:
- Unusual query patterns
- High error rates
- Queries with suspicious parameters
- Off-hours database access

### 3. Rate Limiting
Implemented rate limiting on sensitive operations:
- Authentication attempts
- Search queries
- Booking creations
- Message sending

## Best Practices for Development

### 1. Code Review Checklist
- [ ] All user inputs validated
- [ ] Parameterized queries used
- [ ] No dynamic SQL construction
- [ ] Proper error handling
- [ ] Principle of least privilege

### 2. Database Design Principles
- [ ] Use parameterized queries
- [ ] Implement proper indexes
- [ ] Validate constraints at DB level
- [ ] Use stored procedures for complex logic

### 3. API Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting on public APIs
- [ ] Authentication for sensitive operations
- [ ] HTTPS enforcement

## Response Plan for SQL Injection

### 1. Immediate Actions
1. **Isolate**: Block affected IP addresses
2. **Assess**: Determine scope of breach
3. **Rotate**: Change all database credentials
4. **Audit**: Review all recent database activity
5. **Patch**: Update any vulnerable functions

### 2. Communication
- **Internal**: Alert security team immediately
- **External**: Notify affected users if data was exposed
- **Legal**: Follow breach notification requirements (KVKK)

### 3. Post-Incident
- **Forensics**: Analyze attack vectors
- **Improvement**: Update prevention measures
- **Testing**: Enhanced test coverage
- **Training**: Team security awareness

## Tools and Resources

### Security Testing Tools
- **SQLMap**: Automated SQL injection testing
- **Burp Suite**: Web application security testing
- **OWASP ZAP**: Free security scanner
- **Supabase Logs**: Built-in query logging

### Monitoring Services
- **Sentry**: Error tracking and security alerts
- **Datadog**: Performance and security monitoring
- **Custom Alerts**: Rate limiting and anomaly detection

## Compliance Requirements

### KVKK (Turkish Data Protection)
- **Data Minimization**: Only collect necessary data
- **Access Control**: Strict user access controls
- **Audit Trails**: Complete logging of data access
- **Breach Notification**: 72-hour notification requirement

### Security Standards
- **OWASP Top 10**: Address all relevant vulnerabilities
- **ISO 27001**: Information security management
- **SOC 2**: Security controls for service organizations

## Regular Maintenance

### Monthly
- [ ] Review security test results
- [ ] Update vulnerability scanner
- [ ] Check query performance for anomalies
- [ ] Review rate limit effectiveness

### Quarterly
- [ ] Full penetration test
- [ ] Security training for team
- [ ] Update security documentation
- [ ] Review and rotate secrets

### Annually
- [ ] Complete security audit
- [ ] Update security architecture
- [ ] Review compliance requirements
- [ ] Threat modeling exercise

## Contact Information

### Security Team
- **Email**: security@kampusabla.com
- **Emergency**: +90-555-XXX-XXXX
- **Documentation**: This guide + test suite

### Reporting Security Issues
- **Internal**: Create ticket in security project
- **External**: security@kampusabla.com
- **Bug Bounty**: security@kampusabla.com (with PGP key available)

---

**Last Updated**: 2026-02-19  
**Next Review**: 2026-05-19  
**Security Team Lead**: CISO/CTO  

**Remember**: Security is an ongoing process, not a one-time fix. Stay vigilant!