# Supabase Storage Setup for Incident Images

This project currently returns image links using the Supabase public object URL pattern:

- https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>

For this to work, the bucket must be public.

## 1. Set backend runtime values (api/.env)

Use these keys in [api/.env](../api/.env):

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=incident-images
```

Notes:

- `SUPABASE_BUCKET` is optional in code and defaults to `incident-images`.
- Keep `SUPABASE_SERVICE_KEY` secret. Never commit it.

## 2. Create and configure bucket

In Supabase Dashboard:

1. Open Storage.
2. Create bucket named `incident-images` (or your custom bucket).
3. Set bucket visibility to Public.

## 3. Folder/object pattern used by backend

The backend stores files like:

- incidents/<reporterId>/<uuid>-<safe-filename>.jpg

So public URLs become:

- /storage/v1/object/public/incident-images/incidents/<reporterId>/<uuid>-<safe-filename>.jpg

## 4. Quick verification

1. Start API from [api](../api).
2. Create an incident with image attachment from frontend.
3. Confirm response contains `imageUrls`.
4. Open one URL in browser. It should load without auth if bucket is public.

## 5. If you want private bucket instead

Current implementation uses public URLs. If you need private storage, switch backend to generating signed URLs (short-lived) instead of returning public paths.
