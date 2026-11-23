import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState, buttonClass } from "@/components/ui";

export default function RaceNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
      <EmptyState
        icon={SearchX}
        title="レースが見つかりません"
        description="指定されたレースは存在しないか、開催情報がまだ登録されていません。レース一覧から選び直してください。"
        action={
          <Link href="/races" className={buttonClass("primary")}>
            レース一覧へ
          </Link>
        }
      />
    </div>
  );
}
