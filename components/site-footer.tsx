import { Container } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <Container className="grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-sm font-semibold tracking-tight">
            Moose Barbershop
          </div>
          <p className="text-sm text-white/70">
            Crafting confidence through exceptional style and service.
          </p>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <div className="font-semibold text-white">Quick Links</div>
          <a className="block hover:text-white" href="#home">
            Home
          </a>
          <a className="block hover:text-white" href="#about">
            About
          </a>
          <a className="block hover:text-white" href="#portfolio">
            Portfolio
          </a>
          <a className="block hover:text-white" href="#pricing">
            Pricing
          </a>
          <a className="block hover:text-white" href="#contact">
            Contact
          </a>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <div className="font-semibold text-white">Contact</div>
          <div>1001 Rymal Rd East, Hamilton, ON</div>
          <div>(289) 244-4562</div>
          <div>info@moosebarbershop.com</div>
        </div>

        <div className="text-xs text-white/50 md:col-span-3">
          © {new Date().getFullYear()} Moose Barbershop. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

