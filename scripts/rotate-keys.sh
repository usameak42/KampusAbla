#!/bin/bash

# API Key Rotation Script
# Usage: ./scripts/rotate-keys.sh --service=<service> --env=<environment>
# Example: ./scripts/rotate-keys.sh --service=supabase --env=production

set -euo pipefail

# Default values
SERVICE=""
ENVIRONMENT=""
DRY_RUN=false
FORCE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --service=*)
      SERVICE="${arg#*=}"
      ;;
    --env=*)
      ENVIRONMENT="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --force)
      FORCE=true
      ;;
    --help)
      echo "Usage: $0 --service=<service> --env=<environment> [--dry-run] [--force]"
      echo ""
      echo "Services: supabase, iyizico, firebase, google-maps, jwt, all"
      echo "Environments: development, staging, production"
      echo ""
      echo "Options:"
      echo "  --dry-run    Show what would be done without making changes"
      echo "  --force       Force rotation even if keys aren't expired"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# Validate arguments
if [[ -z "$SERVICE" || -z "$ENVIRONMENT" ]]; then
  echo "Error: --service and --env are required"
  echo "Use --help for usage information"
  exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo "Error: Environment must be one of: development, staging, production"
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKUP_DIR="./backups/secrets/$(date +%Y%m%d_%H%M%S)"
ENV_FILE=".env.${ENVIRONMENT}"
KEY_LOG="./logs/key-rotations.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$KEY_LOG")"

# Function to backup current keys
backup_keys() {
  log_info "Creating backup of current keys..."
  
  if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "$BACKUP_DIR/env.backup"
    log_success "Keys backed up to $BACKUP_DIR/env.backup"
  else
    log_warning "Environment file $ENV_FILE not found"
  fi
}

# Function to rotate Supabase keys
rotate_supabase() {
  log_info "Rotating Supabase keys..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN: Would rotate Supabase keys"
    return
  fi
  
  # Note: This would typically be done via Supabase dashboard or API
  # For now, we'll generate new keys and update the environment file
  
  log_warning "Manual rotation required for Supabase keys"
  log_info "Please follow these steps:"
  echo "1. Go to Supabase Dashboard → Settings → API"
  echo "2. Regenerate the anon key and service role key"
  echo "3. Update your environment variables"
  echo "4. Run: $0 --service=update-secrets --env=$ENVIRONMENT"
}

# Function to rotate iyizico keys
rotate_iyizico() {
  log_info "Rotating iyizico keys..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN: Would rotate iyizico keys"
    return
  fi
  
  log_warning "Manual rotation required for iyizico keys"
  log_info "Please follow these steps:"
  echo "1. Go to iyizico Merchant Panel"
  echo "2. Navigate to Settings → API Keys"
  echo "3. Generate new API and Secret keys"
  echo "4. Update your environment variables"
  echo "5. Run: $0 --service=update-secrets --env=$ENVIRONMENT"
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "6. Run: vercel env add IYZICO_API_KEY production"
    echo "7. Run: vercel env add IYZICO_SECRET_KEY production"
  fi
}

# Function to rotate Firebase keys
rotate_firebase() {
  log_info "Rotating Firebase service account..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN: Would rotate Firebase service account"
    return
  fi
  
  log_warning "Manual rotation required for Firebase service account"
  log_info "Please follow these steps:"
  echo "1. Go to Firebase Console → Project Settings → Service Accounts"
  echo "2. Generate new private key"
  echo "3. Update your FIREBASE_SERVICE_ACCOUNT environment variable"
  echo "4. Run: $0 --service=update-secrets --env=$ENVIRONMENT"
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "5. Run: vercel env add FIREBASE_SERVICE_ACCOUNT production"
  fi
}

# Function to rotate Google Maps keys
rotate_google_maps() {
  log_info "Rotating Google Maps API key..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN: Would rotate Google Maps API key"
    return
  fi
  
  log_warning "Manual rotation required for Google Maps API key"
  log_info "Please follow these steps:"
  echo "1. Go to Google Cloud Console → Credentials"
  echo "2. Create new API key"
  echo "3. Restrict key to necessary APIs and domains"
  echo "4. Update your GOOGLE_MAPS_API_KEY environment variable"
  echo "5. Run: $0 --service=update-secrets --env=$ENVIRONMENT"
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "6. Run: vercel env add GOOGLE_MAPS_API_KEY production"
  fi
}

# Function to rotate JWT secrets
rotate_jwt() {
  log_info "Rotating JWT secrets..."
  
  if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN: Would rotate JWT secrets"
    return
  fi
  
  # Generate new JWT secrets
  NEW_JWT_SECRET=$(openssl rand -base64 32)
  NEW_JWT_REFRESH_SECRET=$(openssl rand -base64 32)
  
  log_info "Generated new JWT secrets"
  
  if [[ -f "$ENV_FILE" ]]; then
    # Update the environment file
    if [[ "$ENVIRONMENT" == "production" ]]; then
      log_warning "Cannot automatically update production environment file"
      log_info "Please manually update JWT_SECRET and JWT_REFRESH_SECRET in production"
    else
      sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=${NEW_JWT_SECRET}/" "$ENV_FILE"
      sed -i.bak "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${NEW_JWT_REFRESH_SECRET}/" "$ENV_FILE"
      log_success "JWT secrets updated in $ENV_FILE"
    fi
  fi
}

# Function to update secrets from user input
update_secrets() {
  log_info "Updating secrets from user input..."
  
  echo "Enter new values for secrets (press Enter to skip):"
  
  read -p "SUPABASE_URL: " supabase_url
  read -p "SUPABASE_ANON_KEY: " supabase_anon_key
  read -p "SUPABASE_SERVICE_ROLE_KEY: " supabase_service_key
  read -p "IYZICO_API_KEY: " iyizico_api_key
  read -p "IYZICO_SECRET_KEY: " iyizico_secret_key
  read -p "GOOGLE_MAPS_API_KEY: " google_maps_key
  read -p "FIREBASE_SERVICE_ACCOUNT (base64): " firebase_service_account
  
  # Create or update environment file
  touch "$ENV_FILE"
  
  # Update values if provided
  [[ -n "$supabase_url" ]] && echo "SUPABASE_URL=${supabase_url}" > "$ENV_FILE"
  [[ -n "$supabase_anon_key" ]] && echo "SUPABASE_ANON_KEY=${supabase_anon_key}" >> "$ENV_FILE"
  [[ -n "$supabase_service_key" ]] && echo "SUPABASE_SERVICE_ROLE_KEY=${supabase_service_key}" >> "$ENV_FILE"
  [[ -n "$iyizico_api_key" ]] && echo "IYZICO_API_KEY=${iyizico_api_key}" >> "$ENV_FILE"
  [[ -n "$iyizico_secret_key" ]] && echo "IYZICO_SECRET_KEY=${iyizico_secret_key}" >> "$ENV_FILE"
  [[ -n "$google_maps_key" ]] && echo "GOOGLE_MAPS_API_KEY=${google_maps_key}" >> "$ENV_FILE"
  [[ -n "$firebase_service_account" ]] && echo "FIREBASE_SERVICE_ACCOUNT=${firebase_service_account}" >> "$ENV_FILE"
  
  log_success "Environment file updated: $ENV_FILE"
}

# Function to log rotation
log_rotation() {
  local service=$1
  local status=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo "${timestamp} - ${service} - ${ENVIRONMENT} - ${status}" >> "$KEY_LOG"
  log_info "Rotation logged to $KEY_LOG"
}

# Main execution logic
main() {
  log_info "Starting key rotation for service: $SERVICE, environment: $ENVIRONMENT"
  
  # Backup current keys
  backup_keys
  
  # Route to appropriate rotation function
  case $SERVICE in
    supabase)
      rotate_supabase
      ;;
    iyizico)
      rotate_iyizico
      ;;
    firebase)
      rotate_firebase
      ;;
    google-maps)
      rotate_google_maps
      ;;
    jwt)
      rotate_jwt
      ;;
    update-secrets)
      update_secrets
      ;;
    all)
      rotate_supabase
      rotate_iyizico
      rotate_firebase
      rotate_google_maps
      rotate_jwt
      ;;
    *)
      log_error "Unknown service: $SERVICE"
      echo "Valid services: supabase, iyizico, firebase, google-maps, jwt, update-secrets, all"
      exit 1
      ;;
  esac
  
  # Log the rotation
  if [[ "$DRY_RUN" != "true" ]]; then
    log_rotation "$SERVICE" "completed"
    log_success "Key rotation completed successfully!"
  else
    log_info "DRY RUN completed. No changes made."
  fi
  
  # Show next steps
  echo ""
  log_info "Next steps:"
  echo "1. Test the application with new keys"
  echo "2. Deploy to $ENVIRONMENT environment"
  echo "3. Verify all services are working"
  echo "4. Monitor for any issues"
  echo ""
  log_info "For issues, contact: security@kampusabla.com"
}

# Execute main function
main "$@"