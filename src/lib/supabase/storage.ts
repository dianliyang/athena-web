// Known logo files in the Supabase storage bucket (slug -> extension)
// This avoids extension probing (and 400 errors) for known universities
const KNOWN_LOGOS: Record<string, string> = {
  'cmu': '.webp',
  'mit': '.webp',
  'stanford': '.webp',
  'uc-berkeley': '.webp',
  'cau-kiel': '.webp',
  'ncu': '.webp',
  'nju': '.webp',
  'cau': '.webp',
  'ucb': '.webp',
  'carnegie-mellon': '.webp',
};

/**
 * Returns the base URL for public assets in the storage bucket.
 */
export function getStorageBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // User uploaded to "public" bucket, folder "/logos"
  return baseUrl ? `${baseUrl}/storage/v1/object/public/public/logos` : '';
}

/**
 * Returns a URL for a public asset by its filename.
 */
export function getPublicAssetUrl(filename: string): string {
  const base = getStorageBaseUrl();
  if (!base) return `/${filename}`;
  // Ensure no leading slash in filename if base is present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${base}/${cleanFilename}`;
}

function toSlug(universityName: string): string {
  return universityName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns the full logo URL if the university has a known logo file,
 * or null if the university is unknown (caller should show fallback).
 */
export function getUniversityLogoUrl(universityName: string): string | null {
  const slug = toSlug(universityName);
  const ext = KNOWN_LOGOS[slug];
  if (!ext) return null;
  return `${getStorageBaseUrl()}/${slug}${ext}`;
}

/**
 * Returns the base URL without extension for extension probing fallback.
 */
export function getUniversityLogoBase(universityName: string): string {
  const baseUrl = getStorageBaseUrl();
  const slug = toSlug(universityName);
  return `${baseUrl}/${slug}`;
}
