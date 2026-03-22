import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";

const ASSETS_DIR = path.join(process.cwd(), "assets");
const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;
const EXCLUDED = new Set(["logo.jfif", "logo.jpg"]);

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename: raw } = await context.params;
  let filename: string;
  try {
    filename = decodeURIComponent(raw);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return new Response("Not found", { status: 404 });
  }

  if (!IMAGE_RE.test(filename) || EXCLUDED.has(filename.toLowerCase())) {
    return new Response("Not found", { status: 404 });
  }

  const filepath = path.join(ASSETS_DIR, filename);
  const resolvedFile = path.resolve(filepath);
  const resolvedDir = path.resolve(ASSETS_DIR);
  if (!resolvedFile.startsWith(resolvedDir + path.sep) && resolvedFile !== resolvedDir) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buf = await fs.readFile(resolvedFile);
    return new Response(buf, {
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
