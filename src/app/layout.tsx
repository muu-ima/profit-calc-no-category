import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "業務アプリ",
  description: "社内向け業務アプリ群",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      {/* ← ここは min-h-screen に。h-screen 固定はやめる */}
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* 横2カラム（サイドバー + コンテンツ） */}
        <div className="mx-auto flex max-w-7xl">
          {/* サイドバーはページ全体のスクロールに追従（親に overflow を作らない） */}
          <Sidebar />

          <div className="flex min-h-dvh flex-1 flex-col">
            {/* ヘッダーは最上部に。sticky で常に見せたいなら sticky を付ける */}
            <div className="sticky top-0 z-20">
              <AppHeader title="Shopify-BreakEven" />
            </div>

            {/* ここは overflow-y-auto を外して、ドキュメントにスクロールを任せる */}
            <main className="flex-1 p-6">
              {children}
            </main>

            <AppFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
