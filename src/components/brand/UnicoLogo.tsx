import Image from "next/image";

/**
 * UNICO ロゴマーク (正式アイコン画像)
 * 画像: public/brand/unico-icon.png (支給画像から角丸で切り抜き、外側は透明)
 * サイトのファビコン/ホーム画面アイコンは src/app/icon.png / apple-icon.png。
 */
export function UnicoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/unico-icon.png"
      alt="UNICO"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}

export function UnicoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <UnicoMark size={compact ? 32 : 36} />
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-num)] text-[19px] font-semibold tracking-[0.22em] text-ink">
          UNICO
        </span>
        {!compact && (
          <span className="mt-1 text-[9.5px] font-medium tracking-[0.16em] text-accent-silver">
            AI HORSE RACING ANALYTICS
          </span>
        )}
      </span>
    </span>
  );
}
