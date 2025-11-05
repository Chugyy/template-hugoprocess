#!/bin/bash
set -e  # Stop on error

# ============================================================================
# PostgreSQL Database Migration Script
# ============================================================================
# Source:      personal_dashboard (local)
# Destination: dashboard-personnel-db (production)
# ============================================================================

# Configuration
OLD_DB="postgresql://hugohoarau@localhost:5432/personal_dashboard"
NEW_DB="postgresql://postgres:Tv7Luxu6aS8S84@72.61.162.200:5434/dashboard-personnel-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/migration_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Redirect output to log file and console
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

test_connection() {
    local db_url=$1
    local db_name=$2

    log_info "Testing connection to $db_name..."

    if psql "$db_url" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Connection to $db_name successful"
        return 0
    else
        log_error "Connection to $db_name failed"
        return 1
    fi
}

count_rows() {
    local db_url=$1
    local table=$2

    psql "$db_url" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs
}

# ============================================================================
# Main Migration Process
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         POSTGRESQL DATABASE MIGRATION                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log_info "Migration started: $TIMESTAMP"
log_info "Log file: $LOG_FILE"
echo ""

# Step 1: Test connections
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 1/5: Testing database connections"
echo "──────────────────────────────────────────────────────────────"

if ! test_connection "$OLD_DB" "source DB (local)"; then
    log_error "Cannot connect to source database. Aborting."
    exit 1
fi

if ! test_connection "$NEW_DB" "destination DB (production)"; then
    log_error "Cannot connect to destination database. Aborting."
    exit 1
fi

echo ""

# Step 2: Backup source database
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 2/5: Backing up source database"
echo "──────────────────────────────────────────────────────────────"

BACKUP_OLD_FILE="$BACKUP_DIR/backup_source_${TIMESTAMP}.sql"
log_info "Creating backup: $BACKUP_OLD_FILE"

if pg_dump "$OLD_DB" > "$BACKUP_OLD_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(du -h "$BACKUP_OLD_FILE" | cut -f1)
    log_success "Source DB backed up successfully ($BACKUP_SIZE)"
else
    log_error "Failed to backup source database. Aborting."
    exit 1
fi

echo ""

# Step 3: Backup destination database (if not empty)
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 3/5: Backing up destination database (if exists)"
echo "──────────────────────────────────────────────────────────────"

TABLE_COUNT=$(psql "$NEW_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
    log_warning "Destination database contains $TABLE_COUNT tables"
    BACKUP_NEW_FILE="$BACKUP_DIR/backup_destination_${TIMESTAMP}.sql"

    log_info "Creating backup: $BACKUP_NEW_FILE"

    if pg_dump "$NEW_DB" > "$BACKUP_NEW_FILE" 2>/dev/null; then
        BACKUP_SIZE=$(du -h "$BACKUP_NEW_FILE" | cut -f1)
        log_success "Destination DB backed up successfully ($BACKUP_SIZE)"
    else
        log_warning "Failed to backup destination database (continuing anyway)"
    fi

    log_warning "Dropping existing schema..."
    psql "$NEW_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1
    log_success "Schema dropped and recreated"
else
    log_info "Destination database is empty (no backup needed)"
fi

echo ""

# Step 4: Initialize schema on destination
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 4/5: Initializing schema on destination database"
echo "──────────────────────────────────────────────────────────────"

INIT_SQL="$SCRIPT_DIR/init.sql"

if [ ! -f "$INIT_SQL" ]; then
    log_error "Schema file not found: $INIT_SQL"
    exit 1
fi

log_info "Executing schema initialization..."

if psql "$NEW_DB" < "$INIT_SQL" >/dev/null 2>&1; then
    log_success "Schema created successfully"

    # Count created tables
    NEW_TABLE_COUNT=$(psql "$NEW_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    log_success "Created $NEW_TABLE_COUNT tables"
else
    log_error "Failed to create schema. Check $INIT_SQL for errors."
    exit 1
fi

echo ""

# Step 5: Copy data
echo "──────────────────────────────────────────────────────────────"
log_info "STEP 5/5: Copying data from source to destination"
echo "──────────────────────────────────────────────────────────────"

log_info "Extracting data from source database..."

DATA_FILE="$BACKUP_DIR/data_${TIMESTAMP}.sql"

if pg_dump "$OLD_DB" --data-only --no-owner --no-privileges > "$DATA_FILE" 2>/dev/null; then
    DATA_SIZE=$(du -h "$DATA_FILE" | cut -f1)
    log_success "Data extracted successfully ($DATA_SIZE)"
else
    log_error "Failed to extract data from source database."
    exit 1
fi

log_info "Inserting data into destination database..."

if psql "$NEW_DB" < "$DATA_FILE" >/dev/null 2>&1; then
    log_success "Data inserted successfully"
else
    log_error "Failed to insert data. Database may be in inconsistent state."
    log_error "Use rollback.sh to restore from backup."
    exit 1
fi

# Reset sequences
log_info "Resetting sequences..."

TABLES=$(psql "$NEW_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | xargs)

for table in $TABLES; do
    SEQUENCE="${table}_id_seq"

    # Check if sequence exists
    if psql "$NEW_DB" -t -c "SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '$SEQUENCE';" 2>/dev/null | grep -q 1; then
        MAX_ID=$(psql "$NEW_DB" -t -c "SELECT COALESCE(MAX(id), 0) FROM $table;" 2>/dev/null | xargs)

        if [ "$MAX_ID" -gt 0 ]; then
            psql "$NEW_DB" -c "SELECT setval('${SEQUENCE}', $MAX_ID);" >/dev/null 2>&1
            log_success "Sequence $SEQUENCE reset to $MAX_ID"
        fi
    fi
done

echo ""

# Verification
echo "──────────────────────────────────────────────────────────────"
log_info "VERIFICATION: Comparing row counts"
echo "──────────────────────────────────────────────────────────────"

VERIFICATION_OK=true

for table in $TABLES; do
    OLD_COUNT=$(count_rows "$OLD_DB" "$table")
    NEW_COUNT=$(count_rows "$NEW_DB" "$table")

    if [ "$OLD_COUNT" = "$NEW_COUNT" ]; then
        log_success "$table: $OLD_COUNT rows (✓ match)"
    else
        log_error "$table: source=$OLD_COUNT, destination=$NEW_COUNT (✗ mismatch)"
        VERIFICATION_OK=false
    fi
done

echo ""

# Final summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  MIGRATION COMPLETED                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$VERIFICATION_OK" = true ]; then
    log_success "All row counts match - migration successful!"
    log_info "Duration: $((SECONDS / 60))m $((SECONDS % 60))s"
    echo ""
    log_info "Files generated:"
    echo "  - Migration log:    $LOG_FILE"
    echo "  - Source backup:    $BACKUP_OLD_FILE"
    [ -f "$BACKUP_NEW_FILE" ] && echo "  - Destination backup: $BACKUP_NEW_FILE"
    echo "  - Data dump:        $DATA_FILE"
    echo ""
    log_success "Migration completed successfully!"
    log_info "You can now update your application configuration to use the new database."
    echo ""
    log_warning "IMPORTANT: Keep backups for at least 7 days before deletion"
    exit 0
else
    log_error "Row count verification FAILED!"
    log_error "Please review the migration log and consider rollback."
    exit 1
fi
