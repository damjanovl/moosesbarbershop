import fs from "node:fs/promises";
import path from "node:path";

const EXCLUDED = new Set(["logo.jfif", "logo.jpg"]);
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)$/i;

function labelFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").trim() || "Photo";
}

export type GalleryImage = {
  filename: string;
  src: string;
  label: string;
};

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const dir = path.join(process.cwd(), "assets");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  return entries
    .filter((f) => IMAGE_EXT.test(f) && !EXCLUDED.has(f.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((f) => ({
      filename: f,
      src: `/api/gallery/${encodeURIComponent(f)}`,
      label: labelFromFilename(f),
    }));
}
