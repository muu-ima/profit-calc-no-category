'use client';

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t bg-white/80 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-900/80">
      <p>© {new Date().getFullYear()} muu Inc. All rights reserved.</p>
    </footer>
  );
}
