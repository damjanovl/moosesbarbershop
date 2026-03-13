import { Container, Button } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <a href="#home" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            M
          </span>
          <span className="tracking-tight">Moose Barbershop</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a className="hover:text-white" href="#about">
            About
          </a>
          <a className="hover:text-white" href="#portfolio">
            Portfolio
          </a>
          <a className="hover:text-white" href="#pricing">
            Pricing
          </a>
          <a className="hover:text-white" href="#contact">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/book" variant="secondary" className="hidden sm:inline-flex">
            Book Appointment
          </Button>
          <Button href="/book">Book</Button>
        </div>
      </Container>
    </header>
  );
}

