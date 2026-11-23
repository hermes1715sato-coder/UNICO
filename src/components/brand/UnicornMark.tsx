import clsx from "clsx";
import type { CSSProperties } from "react";

/**
 * UNICO ユニコーンマーク (シルエット)
 * 正式アイコンからユニコーン部分を切り出したマスク (public/brand/unicorn-mask.png) を
 * CSS mask で塗るため、色はデザイントークンで自由に指定でき、配色テーマにも追従する。
 *  - tone="silver": 通常の装飾 (マットシルバー)
 *  - tone="gold":   PRO 専用 (金)
 *  - tone="ink":    本文色
 */
export function UnicornMark({
  size = 24,
  tone = "silver",
  className,
  style,
  title,
}: {
  size?: number | string;
  tone?: "silver" | "gold" | "ink" | "current";
  className?: string;
  style?: CSSProperties;
  /** 指定すると img として読み上げ。未指定は装飾扱い */
  title?: string;
}) {
  const color =
    tone === "gold"
      ? "linear-gradient(150deg, var(--color-gold) 0%, var(--color-gold-ink) 100%)"
      : tone === "ink"
        ? "var(--color-ink)"
        : tone === "current"
          ? "currentColor"
          : "linear-gradient(150deg, var(--color-silver) 0%, var(--color-accent-silver) 100%)";
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // 呼び出し側が表示指定 (hidden / lg:block など) を渡した場合は既定の inline-block を付けない
      className={clsx(!/(^|\s)(hidden|block|inline-block|flex|inline-flex)(\s|$)/.test(className ?? "") && "inline-block", "shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: color,
        WebkitMaskImage: "url(/brand/unicorn-mask.png)",
        maskImage: "url(/brand/unicorn-mask.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}

/**
 * lucide のアイコン表 (icon: LucideIcon) にそのまま入れられる金色ユニコーン。
 * 線アイコンより塗りのシルエットは小さく見えるため 1.2 倍で描画する。
 */
function GoldUnicornIconImpl({ size = 16, className }: { size?: number | string; className?: string }) {
  const s = typeof size === "number" ? Math.round(size * 1.2) : size;
  return <UnicornMark size={s} tone="gold" className={className?.replace(/\btext-\S+/g, "").trim() || undefined} />;
}
export const GoldUnicornIcon = GoldUnicornIconImpl as unknown as import("lucide-react").LucideIcon;
