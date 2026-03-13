import { Suspense } from "react";
import BookClient from "./book-client";

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 text-sm text-white/70">
            Loading booking…
          </div>
        </div>
      }
    >
      <BookClient />
    </Suspense>
  );
}

