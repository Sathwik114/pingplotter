import path from "path";

export function getUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
}

export function getUploadFilePath(imagePath) {
  if (!imagePath) return null;
  return path.join(getUploadsDir(), path.basename(imagePath));
}