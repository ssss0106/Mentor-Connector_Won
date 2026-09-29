// 아바타 이미지를 서버에서 SVG로 만들어 준다. (브라우저 번들에 DiceBear가 포함되지 않도록)
// DiceBear "notionists" 스타일 (Zoish, CC0 1.0 — 상업적 이용·수정 가능, 출처 표기 불필요)

import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

export async function GET(_req: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  const svg = createAvatar(notionists, {
    seed: decodeURIComponent(seed),
    backgroundColor: ["eef0ff", "ffe6d5", "e3f6e8", "fff3d6", "fde2ec", "e0f2ff"],
    glassesProbability: 0,
  }).toString();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
