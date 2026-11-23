import Link from "next/link";
import { Crown } from "lucide-react";
import { EmptyState, buttonClass } from "@/components/ui";
import { ProIntroCard } from "@/components/pro/ProIntroCard";

export const metadata = { title: "UNICO PRO" };

export default function ProPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-6">
      <ProIntroCard variant="home" />
      <EmptyState
        icon={Crown}
        title="購入済みのPROレースはありません"
        description="PRO予想の購入・閲覧機能はPHASE 5〜6で提供予定です。現在はレース詳細ページで内容をご確認いただけます。"
        action={
          <Link href="/races" className={buttonClass("secondary")}>
            レース一覧へ
          </Link>
        }
      />
    </div>
  );
}
