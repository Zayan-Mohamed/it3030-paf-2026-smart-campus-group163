# Database Migration Instructions

## Overview
This document contains instructions for applying database migrations needed for Module D - Real-Time Notifications system.

## Prerequisites
- PostgreSQL client installed (`psql` command)
- Access to the `smartcampus` database
- Database credentials from your `.env` file

## Migrations to Apply

### V1: Create Notifications Table
Creates the `notifications` table with indexes and foreign key constraints.

### V2: Drop Title Column from Incidents
Removes the orphaned `title` column from the `incidents` table that was causing insert failures.

## How to Apply Migrations

### Option 1: Using the Combined Script (Recommended)

```bash
# From the api directory
cd api

# Apply all migrations at once
psql -U your_db_username -d smartcampus -f apply_migrations.sql

# Or if you need to specify host and port
psql -h localhost -p 5432 -U your_db_username -d smartcampus -f apply_migrations.sql
```

### Option 2: Using Individual Migration Files

```bash
# From the api/src/main/resources/db/migration directory
cd api/src/main/resources/db/migration

# Apply V1: Create notifications table
psql -U your_db_username -d smartcampus -f V1__Create_notifications_table.sql

# Apply V2: Drop title column
psql -U your_db_username -d smartcampus -f V2__Drop_title_column_from_incidents.sql
```

### Option 3: Copy-Paste SQL Statements

If you prefer to run SQL directly in a PostgreSQL client:

1. Connect to your database:
   ```bash
   psql -U your_db_username -d smartcampus
   ```

2. Copy and paste the contents of `apply_migrations.sql` into the psql prompt

## Verification

After applying migrations, verify the changes:

```sql
-- Check if notifications table exists
\d notifications

-- Verify incidents table no longer has title column
\d incidents

-- Check for any remaining NOT NULL constraint issues
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidents' 
ORDER BY ordinal_position;
```

## Troubleshooting

### "relation 'notifications' already exists"
This is harmless - the migration uses `CREATE TABLE IF NOT EXISTS`.

### "column 'title' does not exist"
This is also harmless - the migration uses `DROP COLUMN IF EXISTS`.

### "FATAL: Peer authentication failed"
Update your PostgreSQL authentication method in `pg_hba.conf`:
```
# Change from:
local   all   all   peer

# To:
local   all   all   md5
```
Then restart PostgreSQL: `sudo systemctl restart postgresql`

### Permission denied
Make sure your database user has CREATE and ALTER privileges:
```sql
GRANT CREATE, ALTER ON DATABASE smartcampus TO your_db_username;
```

## Next Steps

After successfully applying migrations:

1. Start the backend: `./mvnw spring-boot:run`
2. Start the frontend: `npm run dev` (from client directory)
3. Test incident creation - should no longer get the "title" constraint violation
4. Verify WebSocket connection in browser console
5. Test real-time notifications by triggering incident status changes

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Rollback V2: Restore title column (if needed)
-- ALTER TABLE incidents ADD COLUMN title VARCHAR(255);

-- Rollback V1: Drop notifications table
DROP TABLE IF EXISTS notifications CASCADE;
```

**Note:** Only rollback if absolutely necessary, as you'll lose any notification data.
