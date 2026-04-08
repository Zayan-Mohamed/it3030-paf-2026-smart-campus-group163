-- Fix incidents table schema to match the Incident.java entity
-- Removes orphaned columns and updates category check constraint

-- Drop orphaned title column (NOT NULL causing insert failures)
ALTER TABLE incidents DROP COLUMN IF EXISTS title;

-- Drop other orphaned columns that are not in the entity
ALTER TABLE incidents DROP COLUMN IF EXISTS location;
ALTER TABLE incidents DROP COLUMN IF EXISTS attachment_filename;
ALTER TABLE incidents DROP COLUMN IF EXISTS attachment_mime_type;
ALTER TABLE incidents DROP COLUMN IF EXISTS facility_id;

-- Update category check constraint to include missing categories: FURNITURE, AV_EQUIPMENT, NETWORK
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
