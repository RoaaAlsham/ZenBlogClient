/** Mirrors server ImageUploadLimits (5 MB application validation). */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF images are allowed.";
  }
  if (file.size <= 0) {
    return "File is empty.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}
