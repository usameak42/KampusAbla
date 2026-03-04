# Disaster Recovery Plan

## Overview

This document outlines the backup and disaster recovery procedures for the KampusAbla platform, ensuring business continuity and data integrity in case of system failures.

## Backup Strategy

### Database Backups (Supabase)

Supabase provides automated database backups with the following configuration:

1. **Point-in-Time Recovery (PITR)**
   - Enabled by default on Pro plans
   - Allows restoration to any point within the retention period
   - Recommended retention: 30 days

2. **Daily Backups**
   - Automatic daily snapshots at 00:00 UTC
   - Retention period: 30 days (configurable)
   - Includes all tables, indexes, and constraints

3. **Physical Backups**
   - Weekly full physical backups
   - Stored in multiple geographic regions
   - Encrypted at rest

### File Storage Backups (Supabase Storage)

1. **Automatic Replication**
   - Files stored in Supabase Storage are automatically replicated
   - 3 copies across different availability zones
   - 99.99% durability guarantee

2. **Cross-Region Backup**
   - Additional backup to separate geographic region
   - Daily sync for critical files
   - 90-day retention

## Recovery Procedures

### Database Restoration

#### Scenario 1: Partial Data Loss (Last 24 hours)

1. **Using Point-in-Time Recovery**
   ```sql
   -- Connect to Supabase SQL Editor
   -- Select restore point
   SELECT * FROM pg_backup_history 
   ORDER BY backup_start_time DESC 
   LIMIT 10;
   
   -- Initiate restoration through Supabase Dashboard
   -- Project Settings → Database → Backups → Restore
   ```

2. **Verification Steps**
   - Verify data integrity with checksum queries
   - Run critical table counts
   - Test application connectivity

#### Scenario 2: Major Database Corruption

1. **Full Database Restore**
   ```bash
   # Contact Supabase support for emergency restore
   # Provide: timestamp, affected tables, business impact
   ```

2. **Post-Restore Validation**
   - Run data consistency checks
   - Verify foreign key constraints
   - Test all critical application flows

### File Storage Recovery

#### Scenario 1: Individual File Recovery

1. **From Supabase Dashboard**
   - Storage → Files → Select file → Download
   - Re-upload to original location if needed

2. **Programmatic Recovery**
   ```javascript
   import { StorageError } from '@supabase/storage-js';
   
   const { data, error } = await supabase.storage
     .from('backups')
     .download('file-backup-2024-02-20.tar.gz');
   ```

#### Scenario 2: Bulk File Recovery

1. **From Cross-Region Backup**
   - Access backup region storage
   - Download compressed archive
   - Extract and restore to primary region

## Recovery Objectives

### Recovery Time Objective (RTO): 4 hours

- **Critical Systems**: 2 hours
  - User authentication
  - Booking system
  - Payment processing
  
- **Non-Critical Systems**: 4 hours
  - Analytics dashboard
  - Historical reports
  - User preferences

### Recovery Point Objective (RPO): 24 hours

- **Transaction Data**: 1 hour (using PITR)
- **User Files**: 24 hours
- **Configuration Data**: 1 hour

## Disaster Recovery Runbook

### Level 1: Minor Incident (Single Component Failure)

**Trigger**: Single service unavailable, partial functionality affected

**Response Time**: 30 minutes

1. **Identify Component**
   - Check monitoring dashboard
   - Review error logs
   - Verify service health endpoints

2. **Isolate and Fix**
   - Restart affected service
   - Apply hotfix if needed
   - Monitor for 15 minutes

3. **Communicate**
   - Update status page if >5 minutes
   - Notify stakeholders if >15 minutes

### Level 2: Major Incident (Multiple Components)

**Trigger**: Multiple services down, significant impact

**Response Time**: 2 hours

1. **Incident Response**
   - Activate incident response team
   - Establish communication channel
   - Assign incident commander

2. **Assessment**
   - Determine root cause
   - Estimate recovery time
   - Decide on restoration strategy

3. **Recovery Execution**
   - Implement recovery plan
   - Validate system integrity
   - Gradual service restoration

4. **Post-Incident**
   - Document root cause
   - Update prevention measures
   - Schedule follow-up review

### Level 3: Disaster (Complete System Outage)

**Trigger**: Data center failure, major data corruption

**Response Time**: 4 hours

1. **Emergency Response**
   - Activate disaster recovery team
   - Declare disaster status
   - Initiate communication protocol

2. **Site Recovery**
   - Activate backup environment
   - Restore from latest backup
   - Verify data integrity

3. **Service Restoration**
   - Update DNS if needed
   - Gradually restore services
   - Monitor system performance

4. **Business Continuity**
   - Notify all users
   - Provide status updates
   - Document all actions

## Monitoring and Alerting

### Backup Status Monitoring

1. **Daily Checks**
   - Verify backup completion
   - Check backup file integrity
   - Monitor storage capacity

2. **Alerts Configuration**
   - Backup failure: Immediate alert
   - Storage capacity >80%: Warning
   - Restore test failure: Critical

### Recovery Drills

1. **Monthly Table Restore**
   - Select random non-critical table
   - Restore to staging environment
   - Verify data integrity

2. **Quarterly Full Drill**
   - Simulate disaster scenario
   - Execute full recovery procedure
   - Document lessons learned

## Contact Information

### Internal Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [Name] | [Phone] | [Email] |
| Technical Lead | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| DevOps Engineer | [Name] | [Phone] | [Email] |

### External Contacts

| Service | Contact | Method |
|---------|----------|--------|
| Supabase Support | support@supabase.com | Email/Ticket |
| Vercel Support | support@vercel.com | Email/Ticket |
| Payment Provider | [Contact] | [Method] |

## Documentation Maintenance

1. **Quarterly Review**
   - Update contact information
   - Verify recovery procedures
   - Test backup integrity

2. **Annual Update**
   - Review RTO/RPO targets
   - Update disaster scenarios
   - Revalidate recovery plans

## Compliance and Legal

### KVKK Compliance

- All backups encrypted at rest
- Access logs maintained for 1 year
- Data retention policy enforced
- Right to deletion supported

### Data Privacy

- Personal data anonymized in non-prod backups
- Access restricted to authorized personnel
- Cross-border data transfer compliance
- Regular security audits

## Appendix

### Backup Verification Script

```sql
-- Verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  last_backup timestamp,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_stat_get_last_vacuum_time(c.oid) as last_backup,
    CASE 
      WHEN n_tup_ins - n_tup_del > 0 THEN 'OK'
      ELSE 'EMPTY'
    END as status
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('information_schema', 'pg_catalog');
END;
$$ LANGUAGE plpgsql;
```

### Emergency Communication Template

```
Subject: [SEVERITY] KampusAbla Service Status Update

Dear Users,

We are currently experiencing [ISSUE DESCRIPTION]. 
Our team is actively working to resolve this issue.

Estimated Resolution: [TIME]
Current Status: [STATUS]

We apologize for any inconvenience and appreciate your patience.

Updates will be posted at: https://status.kampusabla.com

KampusAbla Team
```

---

**Last Updated**: 2024-02-20  
**Next Review Date**: 2024-05-20  
**Approved By**: [Name], [Title]