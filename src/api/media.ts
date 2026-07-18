import { httpClient } from "./httpClient";
import type { ImageUploadPurpose, UploadImageResult } from "./types";

export function uploadImage(file: File, purpose: ImageUploadPurpose) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  return httpClient<UploadImageResult>("/api/media/images", {
    method: "POST",
    body: formData,
  });
}
