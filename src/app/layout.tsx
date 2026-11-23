import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DemoNotice } from "@/components/ui";
import { IS_DEMO } from "@/lib/data";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto", display: "swap" });

export const metadata: Metadata = {
  title: { default: "UNICO — AI Horse Racing Analytics", template: "%s | UNICO" },
  description: "過去の着順だけでは見えない、今回走れる理由を探す。AIと独自UNICO指数で競馬データを多角的に分析し、予想判断を支援します。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${inter.variable} ${noto.variable}`}>
      <body className="min-h-dvh">
        <SiteHeader />
        {IS_DEMO && <DemoNotice />}
        <main className="pb-bottom-nav">{children}</main>
        <SiteFooter />
        <BottomNavigation />
      </body>
    </html>
  );
}
