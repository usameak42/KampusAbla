# Database Connection Pooling Configuration

## Overview

This document outlines the database connection pooling strategy for KampusAbla. Since we're using Supabase (which uses PostgreSQL), connection pooling is handled by Supabase's infrastructure.

## Current Configuration

### Supabase Connection Pooling

Supabase automatically manages connection pooling using:

1. **PgBouncer** - Transaction-level connection pooling
2. **Connection limits** - Based on your Supabase plan
3. **Automatic scaling** - Connections scale based on demand

### Expected Load Analysis

Based on the pilot phase requirements:
- **Target users**: 100 users (pilot phase)
- **Expected concurrent users**: 10% = 10 concurrent users
- **Required connections**: 
  - Frontend client connections: ~10
  - Edge Functions: ~5-10
  - Admin tools: ~2
  - **Total**: ~22 connections max

## Monitoring Setup

### 1. Supabase Dashboard Metrics

Monitor these metrics in your Supabase dashboard:

1. **Connection Count**
   - Path: Project → Database → Metrics
   - Key metric: Active connections
   - Alert threshold: 80% of plan limit

2. **Database Performance**
   - Query execution time
   - Memory usage
   - CPU usage

### 2. Connection Pool Health Check

Create a health check endpoint to monitor database connectivity:

```typescript
// supabase/functions/health-check/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const startTime = Date.now()
    
    // Test database connection
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Simple health check query
    const { error } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 503 
      }
    )
  }
})
```

### 3. Alert Configuration

Set up alerts for:

1. **Connection Pool Exhaustion**
   - Trigger: Connections > 80% of plan limit
   - Action: Notify via email/Slack
   - Escalation: Page on-call engineer

2. **High Response Times**
   - Trigger: Database queries > 500ms average
   - Action: Investigate slow queries
   - Escalation: Review query optimization

3. **Connection Failures**
   - Trigger: Health check failures > 3 consecutive
   - Action: Restart connection pool
   - Escalation: Contact Supabase support

## Connection Pool Best Practices

### 1. Client-Side Configuration

Our React app uses the Supabase JavaScript client with these optimizations:

```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  // Connection pooling options
  db: {
    schema: 'public',
  },
  // Enable real-time subscriptions efficiently
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
```

### 2. Edge Functions Optimization

Edge Functions create new connections per invocation. To optimize:

1. **Use service role key for admin operations**
2. **Minimize connection lifetime**
3. **Close connections explicitly when done**

```typescript
// Pattern for Edge Functions
const serviceRoleClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    // Connection options for Edge Functions
    db: {
      // Use connection pooling
      poolSize: 1, // Edge Functions are stateless
    }
  }
)

// Use connection and let it go out of scope
const { data, error } = await serviceRoleClient
  .from('table_name')
  .select('*')
```

### 3. Query Optimization

To minimize connection usage:

1. **Batch queries** when possible
2. **Use database functions** for complex operations
3. **Implement pagination** for large datasets
4. **Cache frequently accessed data**

## Scaling Strategy

### Phase 1: Pilot (Current)
- 100 users, 10 concurrent
- Supabase Free/Pro tier sufficient
- Monitor connection patterns

### Phase 2: Growth (1000 users)
- 100 concurrent users
- Consider Supabase Pro tier
- Implement connection monitoring dashboard

### Phase 3: Scale (10,000+ users)
- 1000+ concurrent users
- Consider Supabase Enterprise or dedicated PostgreSQL
- Implement read replicas for reporting queries

## Emergency Procedures

### Connection Pool Exhaustion

1. **Immediate Actions**
   - Check for connection leaks in Edge Functions
   - Restart long-running queries
   - Temporarily disable non-critical features

2. **Long-term Solutions**
   - Optimize queries
   - Implement caching
   - Upgrade Supabase plan

### Database Connection Issues

1. **Diagnosis**
   - Check Supabase status page
   - Review recent deployments
   - Check error logs

2. **Recovery**
   - Restart application if needed
   - Contact Supabase support
   - Failover to backup if configured

## Monitoring Dashboard

Create a simple dashboard to track:

1. Current active connections
2. Connection pool utilization
3. Database response times
4. Error rates

This can be built using:
- Supabase metrics API
- Grafana with Supabase plugin
- Custom dashboard using Supabase data

## Conclusion

Supabase handles connection pooling automatically, but proper monitoring and optimization are crucial for scaling. The key is to:

1. Monitor connection usage regularly
2. Optimize queries to minimize connection time
3. Set up alerts for early detection of issues
4. Plan for scaling before hitting limits

For the pilot phase, the current configuration is sufficient. As we grow, we'll need to monitor closely and adjust our strategy based on actual usage patterns.