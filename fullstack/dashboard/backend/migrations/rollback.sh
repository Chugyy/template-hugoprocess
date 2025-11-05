#!/bin/bash
set -e  # Stop on error

# ============================================================================
# PostgreSQL Database Rollback Script
# ============================================================================
# This script restores a previous database state from backup
# ============================================================================

# Configuration
NEW_DB="postgresql://postgres:Tv7Luxu6aS8S84@72.61.162.200:5434/dashboard-personnel-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/rollback_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Redirect output to log file and console
mkdir -p "$BACKUP_DIR"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# ============================================================================
# Main Rollback Process
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         POSTGRESQL DATABASE ROLLBACK                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log_info "Rollback started: $TIMESTAMP"
log_info "Log file: $LOG_FILE"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# List available backups
echo "──────────────────────────────────────────────────────────────"
log_info "Available backup files:"
echo "──────────────────────────────────────────────────────────────"
echo ""

BACKUP_FILES=($(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null || true))

if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
    log_error "No backup files found in $BACKUP_DIR"
    exit 1
fi

INDEX=1
for file in "${BACKUP_FILES[@]}"; do
    FILENAME=$(basename "$file")
    FILESIZE=$(du -h "$file" | cut -f1)
    FILEDATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null)

    echo "  [$INDEX] $FILENAME"
    echo "      Size: $FILESIZE | Created: $FILEDATE"
    echo ""

    INDEX=$((INDEX + 1))
done

echo "──────────────────────────────────────────────────────────────"

# Prompt user to select backup
read -p "Select backup to restore (1-${#BACKUP_FILES[@]}) or 0 to cancel: " SELECTION

if [ "$SELECTION" -eq 0 ] 2>/dev/null; then
    log_warning "Rollback cancelled by user"
    exit 0
fi

if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt ${#BACKUP_FILES[@]} ]; then
    log_error "Invalid selection: $SELECTION"
    exit 1
fi

SELECTED_BACKUP="${BACKUP_FILES[$((SELECTION - 1))]}"
BACKUP_NAME=$(basename "$SELECTED_BACKUP")

echo ""
log_warning "You are about to restore from: $BACKUP_NAME"
log_warning "This will DROP all existing data in the destination database!"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_warning "Rollback cancelled by user"
    exit 0
fi

echo ""

# Test connection
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 1/4: Testing database connection"
echo "──────────────────────────────────────────────────────────────"

if psql "$NEW_DB" -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "Connection successful"
else
    log_error "Cannot connect to database"
    exit 1
fi

echo ""

# Create safety backup before rollback
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 2/4: Creating safety backup (current state)"
echo "──────────────────────────────────────────────────────────────"

SAFETY_BACKUP="$BACKUP_DIR/before_rollback_${TIMESTAMP}.sql"
log_info "Creating backup: $SAFETY_BACKUP"

if pg_dump "$NEW_DB" > "$SAFETY_BACKUP" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$SAFETY_BACKUP" | cut -f1)
    log_success "Safety backup created successfully ($BACKUP_SIZE)"
else
    log_warning "Failed to create safety backup (continuing anyway)"
fi

echo ""

# Drop existing schema
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 3/4: Dropping existing schema"
echo "──────────────────────────────────────────────────────────────"

log_warning "Dropping schema..."

if psql "$NEW_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1; then
    log_success "Schema dropped and recreated"
else
    log_error "Failed to drop schema"
    exit 1
fi

echo ""

# Restore from backup
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 4/4: Restoring from backup"
echo "──────────────────────────────────────────────────────────────"

log_info "Restoring: $BACKUP_NAME"

if psql "$NEW_DB" < "$SELECTED_BACKUP" >/dev/null 2>&1; then
    log_success "Backup restored successfully"
else
    log_error "Failed to restore backup"
    log_error "Database may be in inconsistent state"
    exit 1
fi

echo ""

# Verification
echo "──────────────────────────────────────────────────────────────"
log_info "VERIFICATION: Checking restored database"
echo "──────────────────────────────────────────────────────────────"

TABLE_COUNT=$(psql "$NEW_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
log_success "Restored $TABLE_COUNT tables"

# Count rows per table
TABLES=$(psql "$NEW_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | xargs)

for table in $TABLES; do
    ROW_COUNT=$(psql "$NEW_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    log_success "$table: $ROW_COUNT rows"
done

echo ""

# Final summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ROLLBACK COMPLETED                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log_success "Database successfully restored from: $BACKUP_NAME"
log_info "Duration: $((SECONDS / 60))m $((SECONDS % 60))s"
echo ""
log_info "Files generated:"
echo "  - Rollback log:     $LOG_FILE"
echo "  - Safety backup:    $SAFETY_BACKUP"
echo ""
log_success "Rollback completed successfully!"
