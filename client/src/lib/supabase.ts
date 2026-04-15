import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || "avatars";

// Create a dummy client if keys are missing to prevent crash during build/dev
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const uploadAvatar = async (file: File, userId: string) => {
  if (!supabase) {
    console.error("Supabase client is null:", supabase);
    throw new Error(
      "Supabase client not configured. Check environment variables.",
    );
  }
  console.log("Uploading avatar for user:", userId);
  console.log("Supabase client initialized:", !!supabase);

  // Add upload limits: max 5MB, image only
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const fileExt = file.name.split(".").pop();
  // Store at the root of the avatars bucket
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  // Force using the 'avatars' bucket specifically
  const { error: uploadError } = await supabase.storage
    .from(supabaseBucket)
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(fileName);

  return data.publicUrl;
};

export const deleteAvatar = async (url: string) => {
  if (!supabase || !url) return;

  try {
    // Only attempt to delete if it's a Supabase storage URL
    if (
      url.includes(`supabase.co/storage/v1/object/public/${supabaseBucket}/`)
    ) {
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      if (fileName) {
        const { error } = await supabase.storage
          .from(supabaseBucket)
          .remove([fileName]);

        if (error) {
          console.error("Failed to delete avatar from storage:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error parsing avatar URL for deletion:", error);
  }
};
