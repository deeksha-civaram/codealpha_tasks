import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

export type Bucket = "avatars" | "post-images";

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Only JPEG, PNG, WebP, or GIF images are allowed.";
  if (file.size > MAX_BYTES) return "Image must be 5 MB or smaller.";
  return null;
}

/**
 * Upload an image to a private bucket under `<userId>/<random>.<ext>` and
 * return a long-lived signed URL the caller can persist on the row.
 */
export async function uploadImage(bucket: Bucket, file: File, userId: string): Promise<string> {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}