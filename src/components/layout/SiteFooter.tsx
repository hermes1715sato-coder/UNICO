import { UnicoLogo } from "@/components/brand/UnicoLogo";

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-line bg-surface lg:block">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-8 px-6 py-8">
        <div>
          <UnicoLogo compact />
          <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-ink-2">
            UNICOは競馬データを多角的に分析し、予想判断を支援するサービスです。的中や利益を保証するものではありません。
            馬券の購入は20歳になってから。ご自身の判断と責任でお楽しみください。
          </p>
        </div>
        <p className="num text-[12px] text-accent-silver">© 2026 UNICO</p>
      </div>
    </footer>
  );
}
