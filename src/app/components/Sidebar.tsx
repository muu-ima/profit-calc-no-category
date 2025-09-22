'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Calculator,
  Package,
  Calendar,
  Truck,
  ChevronDown,
} from "lucide-react";

type MenuItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
};

const menus: MenuItem[] = [
  {
    label: "利益計算US",
    icon: <Calculator className="w-4 h-4" />,
    children: [
      { label: "US / Shopify", href: "https://enyukari.capoo.jp/profit-calc/shopify-be/" },
      { label: "US / BE", href: "https://enyukari.capoo.jp/profit-calc/be-us/" },
      { label: "US / Basic", href: "https://enyukari.capoo.jp/profit-calc/us-calc/" },
      { label: "US / Reverse", href: "https://enyukari.capoo.jp/profit-calc/reverse/" },
    ],
  },
  {
      label: "利益計算UK",
    icon: <Calculator className="w-4 h-4" />,
    children: [
      { label: "UK", href: "/profit-us/be" },
    ],
  },
  {
    label: "発送管理",
    href: "/shipping",
    icon: <Truck className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <aside className="sticky top-0 h-screen w-56 border-r bg-white/80 p-4 backdrop-blur dark:bg-zinc-900/80 dark:border-zinc-800">
      <div className="mb-6 text-lg font-semibold">業務ツール</div>
      <nav className="space-y-2 text-sm">
        {menus.map((menu) =>
          menu.children ? (
            <div key={menu.label}>
              <button
                onClick={() => setOpen(open === menu.label ? null : menu.label)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  {menu.icon}
                  {menu.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    open === menu.label ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === menu.label && (
                <div className="ml-6 mt-1 space-y-1">
                  {menu.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded px-2 py-1 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={menu.href}
              href={menu.href!}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {menu.icon}
              {menu.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}
