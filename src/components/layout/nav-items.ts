import { Crown, Flag, Home, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: Home, match: (p) => p === "/" },
  { href: "/races", label: "レース", icon: Flag, match: (p) => p.startsWith("/races") || p.startsWith("/race/") },
  { href: "/pro", label: "PRO", icon: Crown, match: (p) => p.startsWith("/pro") },
  { href: "/mypage", label: "マイページ", icon: UserRound, match: (p) => p.startsWith("/mypage") || p.startsWith("/login") },
];
