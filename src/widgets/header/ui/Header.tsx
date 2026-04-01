"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <Link href="/" className="flex items-center font-bold">
          Your App
        </Link>
        <nav className="ml-6 hidden items-center gap-6 text-sm md:flex">
          {/* Add navigation links here */}
        </nav>
      </div>
    </header>
  );
}
