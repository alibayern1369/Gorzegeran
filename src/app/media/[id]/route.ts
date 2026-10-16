import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mediaAssets } from "@/lib/db/schema";
import sharp from "sharp";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const [asset] = await getDb()
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id));
  if (!asset) return new Response(null, { status: 404 });
  let content = Buffer.from(asset.content, "base64");
  const size = Number(new URL(request.url).searchParams.get("size"));
  if ([64, 180, 192, 512].includes(size))
    content = await sharp(content).resize(size, size).png().toBuffer();
  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
