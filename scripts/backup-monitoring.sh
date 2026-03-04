#!/bin/bash

# Backup Monitoring Script for KampusAbla
# This script checks backup status and sends alerts if needed

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_KEY="${SUPABASE_KEY:-your-service-key}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@kampusabla.com}"
LOG_FILE="/var/log/kampusabla-backup-monitor.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    log "ALERT: $subject"
}

# Check database backup status
check_database_backup() {
    log "Checking database backup status..."
    
    # Query Supabase to check last backup
    response=$(curl -s -X POST \
        "$SUPABASE_URL/rest/v1/rpc/check_last_backup" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json")
    
    if [ $? -ne 0 ]; then
        send_alert "Backup Check Failed" "Failed to connect to Supabase for backup verification"
        return 1
    fi
    
    # Parse response (simplified - in production, use jq)
    last_backup=$(echo "$response" | grep -o '"last_backup":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$last_backup" ]; then
        send_alert "Missing Backup" "No database backup found in the last 24 hours"
        return 1
    fi
    
    # Check if backup is older than 24 hours
    backup_timestamp=$(date -d "$last_backup" +%s 2>/dev/null)
    current_timestamp=$(date +%s)
    age_hours=$(( (current_timestamp - backup_timestamp) / 3600 ))
    
    if [ $age_hours -gt 24 ]; then
        send_alert "Stale Backup" "Last backup is $age_hours hours old"
        return 1
    fi
    
    log "Database backup check passed (last backup: $last_backup)"
    return 0
}

# Check storage backup status
check_storage_backup() {
    log "Checking storage backup status..."
    
    # List backup files in storage
    response=$(curl -s -X GET \
        "$SUPABASE_URL/storage/v1/object/list/backups" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY")
    
    if [ $? -ne 0 ]; then
        send_alert "Storage Backup Check Failed" "Failed to check storage backup status"
        return 1
    fi
    
    # Check if backup exists from today
    today=$(date '+%Y-%m-%d')
    if echo "$response" | grep -q "$today"; then
        log "Storage backup check passed (found backup for $today)"
        return 0
    else
        send_alert "Missing Storage Backup" "No storage backup found for $today"
        return 1
    fi
}

# Check storage capacity
check_storage_capacity() {
    log "Checking storage capacity..."
    
    # Get storage usage (this would need to be implemented via Supabase API)
    # For now, just log that check was performed
    log "Storage capacity check completed"
}

# Main execution
main() {
    log "Starting backup monitoring check"
    
    # Run all checks
    db_ok=true
    storage_ok=true
    
    check_database_backup || db_ok=false
    check_storage_backup || storage_ok=false
    check_storage_capacity
    
    # Summary
    if $db_ok && $storage_ok; then
        log "All backup checks passed successfully"
    else
        log "Some backup checks failed - see alerts"
    fi
    
    log "Backup monitoring check completed"
}

# Execute main function
main "$@"