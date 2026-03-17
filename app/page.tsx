import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button, Card, Container } from "@/components/ui";
import { InstagramLatestSection } from "@/components/instagram-latest";
import { SERVICES } from "@/lib/services";
import { Check } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div id="home" className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[color:var(--color-accent)]/30 blur-[120px]" />
            <div className="absolute -bottom-48 left-10 h-[520px] w-[520px] rounded-full bg-white/10 blur-[120px]" />
          </div>

          <Container className="relative">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                  Premium Barbershop Experience • Hamilton, Ontario
                </div>
                <div className="flex">
                  <Image
                    src="/assets/logo.jpg"
                    alt="Moose Barbershop logo"
                    width={360}
                    height={216}
                    className="rounded-2xl object-contain"
                    priority
                  />
                </div>
                <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                  Where style meets craftsmanship.
                </h1>
                <p className="max-w-xl text-pretty text-base leading-7 text-white/75 md:text-lg">
                  Expert barbers delivering exceptional cuts and grooming
                  services. Book <span className="font-semibold text-white">online</span> in minutes and secure your slot.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button href="/book">Book Your Appointment</Button>
                  <Button href="#portfolio" variant="secondary">
                    View Our Work
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-6">
                  <Card className="p-4">
                    <div className="text-2xl font-semibold">500+</div>
                    <div className="text-xs text-white/70">Happy Clients</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-semibold">15+</div>
                    <div className="text-xs text-white/70">Years Experience</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-semibold">4.9★</div>
                    <div className="text-xs text-white/70">Average Rating</div>
                  </Card>
                </div>
              </div>

              <Card className="relative overflow-hidden p-0">
                <div className="relative aspect-[3/4] w-full">
                  <video
                    src="/assets/promo-video.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-black/10" />
                </div>
                <div className="absolute inset-0 p-8">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white/80">
                      Moose Barbershop
                    </div>
                    <div className="text-2xl font-semibold tracking-tight">
                      Premium cuts. Clean fades. Sharp lines.
                    </div>
                    <p className="text-sm text-white/70">
                      Precision work, premium service, and an experience built
                      around confidence.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </section>

        <section id="about" className="py-20">
          <Container>
            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <div className="text-xs font-semibold tracking-widest text-white/60">
                  ABOUT US
                </div>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Crafting confidence through style.
                </h2>
                <p className="text-white/75 leading-7">
                  At Moose Barbershop, we believe that a great haircut is more
                  than just a service—it&apos;s an experience that builds
                  confidence and reflects your unique personality.
                  <br />
                  <br />
                  Our master barbers combine traditional techniques with modern
                  trends to deliver exceptional results every time. With years
                  of expertise and a passion for perfection, we&apos;re
                  dedicated to making you look and feel your absolute best.
                </p>
              </div>
              <div className="grid gap-4">
                <Card>
                  <div className="font-semibold">Expert Barbers</div>
                  <div className="text-sm text-white/70">
                    Certified professionals with years of experience.
                  </div>
                </Card>
                <Card>
                  <div className="font-semibold">Premium Service</div>
                  <div className="text-sm text-white/70">
                    High-quality cuts and grooming, every time.
                  </div>
                </Card>
                <Card>
                  <div className="font-semibold">Client Focused</div>
                  <div className="text-sm text-white/70">
                    Your satisfaction is our top priority.
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        <InstagramLatestSection />

        <section id="pricing" className="py-20">
          <Container>
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-widest text-white/60">
                PRICING
              </div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Transparent. Fair. Premium.
              </h2>
              <p className="text-sm text-white/70">
                All prices include taxes. Quality services at honest prices.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {SERVICES.map((s) => (
                <Card
                  key={s.key}
                  className={
                    s.badge === "Most Popular"
                      ? "relative border-[color:var(--color-accent)]/40"
                      : "relative"
                  }
                >
                  {s.badge ? (
                    <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                      {s.badge}
                    </div>
                  ) : null}
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold">{s.name}</div>
                      <div className="text-sm text-white/70">{s.tagline}</div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-semibold">${s.priceCAD}</div>
                      <div className="text-xs text-white/60">
                        {s.durationMinutes} min
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-white/75">
                      {s.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-[color:var(--color-accent)]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      href={`/book?service=${s.key}`}
                      variant={s.badge === "Most Popular" ? "primary" : "secondary"}
                      className="w-full"
                    >
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="portfolio" className="py-20">
          <Container>
            <div className="flex items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold tracking-widest text-white/60">
                  OUR WORK
                </div>
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Masterpieces we've created.
                </h2>
                <p className="max-w-2xl text-sm text-white/70">
                  Every client is a canvas. Here's a preview of the vibe—drop in
                  real photos anytime.
                </p>
              </div>
              <Button href="/book" variant="secondary" className="hidden md:inline-flex">
                Book Now
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {[
                { src: "/portfolio/1.jpeg", label: "Premium Haircut" },
                { src: "/portfolio/2.jpeg", label: "Stylish Cut" },
                { src: "/portfolio/3.jpeg", label: "Beard Trim" },
                { src: "/portfolio/4.jpeg", label: "Complete Package" },
              ].map((p) => (
                <Card key={p.src} className="p-0 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={p.src}
                      alt={p.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-sm font-semibold">
                      {p.label}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="contact" className="py-20">
          <Container>
            <div className="mb-10 space-y-2">
              <div className="text-xs font-semibold tracking-widest text-white/60">
                CONTACT US
              </div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Visit us today.
              </h2>
              <p className="text-sm text-white/70">
                Walk-ins welcome when available—booking ahead is recommended.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <div className="text-sm font-semibold">Location</div>
                  <div className="mt-1 text-sm text-white/70">
                    1001 Rymal Rd East
                    <br />
                    Hamilton, Ontario
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=1001+Rymal+Rd+East+Hamilton+Ontario"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-white/90 underline-offset-4 hover:underline"
                  >
                    View on Google Maps
                  </a>
                </div>

                <div>
                  <div className="text-sm font-semibold">Hours</div>
                  <div className="mt-2 space-y-1 text-sm text-white/70">
                    <div className="flex justify-between gap-4">
                      <span>Monday</span>
                      <span>12:00 PM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Tuesday</span>
                      <span>12:00 PM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Wednesday</span>
                      <span>12:00 PM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Thursday</span>
                      <span>11:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Friday</span>
                      <span>11:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Saturday</span>
                      <span>10:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">Phone</div>
                  <a
                    href="tel:+12892444562"
                    className="mt-1 block text-sm text-white/70 hover:text-white"
                  >
                    (289) 244-4562
                  </a>
                </div>

                <div>
                  <div className="text-sm font-semibold">Email</div>
                  <a
                    href="mailto:info@moosebarbershop.com"
                    className="mt-1 block text-sm text-white/70 hover:text-white"
                  >
                    info@moosebarbershop.com
                  </a>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 lg:col-span-3">
                <iframe
                  src="https://maps.google.com/maps?q=1001+Rymal+Rd+East+Hamilton+Ontario&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ minHeight: "320px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Moose Barbershop location"
                  className="block w-full"
                />
              </div>
            </div>
          </Container>
        </section>

        <section className="py-14">
          <Container>
            <Card className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-2">
                <div className="text-lg font-semibold tracking-tight">
                  Ready for a fresh cut?
                </div>
                <div className="text-sm text-white/70">
                  Pick a time slot, put down a 50% deposit, and you’re booked.
                </div>
              </div>
              <Button href="/book">Book Appointment</Button>
            </Card>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
