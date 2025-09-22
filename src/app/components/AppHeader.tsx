'use client';
import Link from "next/link";

export default function AppHeader({ title }: { title: string }) {
  return (
    <header className="border-b bg-white/80 px-4 py-3 backdrop-blur dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
