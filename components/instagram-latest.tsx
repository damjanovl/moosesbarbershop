import "server-only";

import { Card, Container } from "@/components/ui";

type InstagramMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp?: string;
};

async function fetchLatestInstagramMedia(): Promise<InstagramMedia[] | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return null;

  const url =
    `https://graph.facebook.com/v19.0/${encodeURIComponent(userId)}/media` +
    `?fields=id,media_type,media_url,permalink,thumbnail_url,caption,timestamp` +
    `&limit=8&access_token=${encodeURIComponent(token)}`;

  const resp = await fetch(url, { next: { revalidate: 600 } });
  if (!resp.ok) return null;
  const json = (await resp.json().catch(() => null)) as
    | { data?: InstagramMedia[] }
    | null;
  const data = Array.isArray(json?.data) ? json!.data! : null;
  if (!data) return null;

  const cleaned = data
    .map((m) => ({
      ...m,
      media_url: m.media_url ?? undefined,
      thumbnail_url: m.thumbnail_url ?? undefined,
    }))
    .filter((m) => !!m.permalink)
    .map((m) => ({
      ...m,
      // For VIDEO, prefer thumbnail_url
      media_url:
        m.media_type === "VIDEO"
          ? m.thumbnail_url ?? m.media_url
          : m.media_url,
    }))
    .filter((m) => !!m.media_url);

  return cleaned.slice(0, 6);
}

export async function InstagramLatestSection() {
  const handle = "moose_barbershop.536";
  const profileUrl = `https://www.instagram.com/${handle}/`;

  const media = await fetchLatestInstagramMedia();
  const fallback = [
    { src: "/portfolio/1.jpeg", alt: "Moose Barbershop haircut" },
    { src: "/portfolio/2.jpeg", alt: "Moose Barbershop haircut" },
    { src: "/portfolio/3.jpeg", alt: "Moose Barbershop haircut" },
    { src: "/portfolio/4.jpeg", alt: "Moose Barbershop haircut" },
  ];

  return (
    <section id="instagram" className="py-20">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-widest text-white/60">
              INSTAGRAM
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Latest from @{handle}
            </h2>
            <p className="max-w-2xl text-sm text-white/70">
              Fresh cuts, clean fades, and recent work.{" "}
              <a
                className="font-semibold text-white hover:opacity-90"
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Follow on Instagram
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {media
            ? media.map((m) => (
                <a
                  key={m.id}
                  href={m.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <Card className="p-0 overflow-hidden">
                    {/* Use <img> to avoid remote image domain config headaches */}
                    <img
                      src={m.media_url!}
                      alt={m.caption?.slice(0, 120) || "Instagram post"}
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </Card>
                </a>
              ))
            : fallback.map((f) => (
                <a
                  key={f.src}
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <Card className="p-0 overflow-hidden">
                    <img
                      src={f.src}
                      alt={f.alt}
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </Card>
                </a>
              ))}
        </div>

        {media && media.length === 0 ? (
          <div className="mt-4 text-xs text-white/50">
            To show the actual latest posts here, set `INSTAGRAM_USER_ID` and
            `INSTAGRAM_ACCESS_TOKEN`.
          </div>
        ) : null}
      </Container>
    </section>
  );
}

