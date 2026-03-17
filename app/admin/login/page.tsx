import { Container, Card, Button } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen">
      <Container className="py-14">
        <Card className="mx-auto max-w-md">
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-widest text-white/60">
              ADMIN
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-white/70">
              Sign in with your barber account to view your calendar.
            </p>
          </div>

          <form method="post" action="/api/admin/login" className="mt-6 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-white/60">Email</div>
              <input
                name="email"
                type="email"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="moose@moosebarbershop.com"
                required
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-white/60">Password</div>
              <input
                name="password"
                type="password"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                required
              />
            </div>
            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </form>
        </Card>
      </Container>
    </div>
  );
}

