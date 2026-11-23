import { UserRound } from "lucide-react";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "マイページ" };

export default function MyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <EmptyState
        icon={UserRound}
        title="会員機能は準備中です"
        description="会員登録・ログイン・購入履歴はPHASE 6で提供予定です。現在はログインせずに無料コンテンツをご利用いただけます。"
      />
    </div>
  );
}
