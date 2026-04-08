-- Combined Database Migration Script
-- Apply these changes to prepare the database for the notification system
-- IMPORTANT: Run with database specified: psql -U postgres -d smartcampus -f apply_migrations.sql

\echo 'Starting database migrations...'
\echo 'Current database: '
SELECT current_database();
\echo ''

-- =============================================================================
-- Migration V1: Create notifications table
-- =============================================================================
\echo 'Running V1: Create notifications table...'

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_id BIGINT,
    reference_type VARCHAR(50),
    
    CONSTRAINT fk_recipient
        FOREIGN KEY (recipient_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for real-time notification system';
COMMENT ON COLUMN notifications.recipient_id IS 'Foreign key to users table - the user who receives this notification';
COMMENT ON COLUMN notifications.message IS 'Human-readable notification message';
COMMENT ON COLUMN notifications.type IS 'Notification type: BOOKING_UPDATE, TICKET_UPDATE, or NEW_COMMENT';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the recipient';
COMMENT ON COLUMN notifications.reference_id IS 'ID of the related entity (booking, incident, etc.)';
COMMENT ON COLUMN notifications.reference_type IS 'Type of the related entity (BOOKING, INCIDENT, etc.)';

\echo 'V1: Notifications table created successfully!'
\echo ''

-- =============================================================================
-- Migration V2: Fix incidents table schema
-- =============================================================================
\echo 'Running V2: Fix incidents table schema...'

-- Drop orphaned title column (NOT NULL causing insert failures)
ALTER TABLE incidents DROP COLUMN IF EXISTS title;

-- Drop orphaned columns that are not in the entity
ALTER TABLE incidents DROP COLUMN IF EXISTS location;
ALTER TABLE incidents DROP COLUMN IF EXISTS attachment_filename;
ALTER TABLE incidents DROP COLUMN IF EXISTS attachment_mime_type;
ALTER TABLE incidents DROP COLUMN IF EXISTS facility_id;

-- Update category check constraint to include missing categories
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_category_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_category_check 
    CHECK (category::text = ANY (ARRAY[
        'ELECTRICAL'::character varying,
        'PLUMBING'::character varying,
        'HVAC'::character varying,
        'EQUIPMENT'::character varying,
        'CLEANLINESS'::character varying,
        'SECURITY'::character varying,
        'FURNITURE'::character varying,
        'AV_EQUIPMENT'::character varying,
        'NETWORK'::character varying,
        'OTHER'::character varying
    ]::text[]));

\echo 'V2: Incidents table fixed successfully!'
\echo ''

\echo 'All migrations completed successfully!'
\echo ''
