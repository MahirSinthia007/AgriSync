// ============================================================================
// config/storage.js — Supabase Storage Upload Service
// ============================================================================
// WHY THIS FILE EXISTS:
//   Your app needs to store images somewhere that survives server restarts.
//   Local disk (backend/uploads/) gets wiped when your hosting platform
//   redeploys. Supabase Storage is a cloud folder tied to your existing
//   Supabase database account — free tier gives 1 GB storage + CDN.
// HOW IT WORKS:
//   1. sharp compresses the image in memory (already happening)
//   2. This file uploads the compressed bytes to Supabase via HTTP (fetch)
//   3. Supabase returns a public URL like:
//      https://xxxx.supabase.co/storage/v1/object/public/agrisync/filename.jpg
//   4. That URL is saved in Prisma (Model) and sent to React (View)
// NO NEW NPM PACKAGE needed — Node 18+ has native fetch().
// ============================================================================

// Build the Supabase Storage upload URL from env vars
const storageUrl = () => {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const bucket = process.env.SUPABASE_BUCKET_NAME || 'agrisync';
  return `https://${ref}.supabase.co/storage/v1/object/${bucket}`;
};

// Build the public CDN URL that browsers use to display images
const publicUrl = (filename) => {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const bucket = process.env.SUPABASE_BUCKET_NAME || 'agrisync';
  return `https://${ref}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;
};

/**
 * Upload a buffer (compressed image bytes) to Supabase Storage.
 * @param {Buffer} buffer — the image bytes from sharp
 * @param {string} filename — unique filename like 'userId-timestamp.jpg'
 * @returns {Promise<string>} — public CDN URL of the uploaded image
 */
const uploadBuffer = async (buffer, filename) => {
  const url = `${storageUrl()}/${filename}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true', // overwrite if filename already exists
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${res.status} ${err}`);
  }

  return publicUrl(filename);
};

/**
 * Delete an image from Supabase Storage by its public URL.
 * @param {string} imageUrl — the full public URL
 */
const deleteFile = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('supabase.co')) return;

  const filename = imageUrl.split('/').pop();
  const bucket = process.env.SUPABASE_BUCKET_NAME || 'agrisync';
  const ref = process.env.SUPABASE_PROJECT_REF;

  const url = `https://${ref}.supabase.co/storage/v1/object/${bucket}/${filename}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    console.error('Failed to delete image from Supabase:', await res.text());
  }
};

module.exports = { uploadBuffer, deleteFile, publicUrl };