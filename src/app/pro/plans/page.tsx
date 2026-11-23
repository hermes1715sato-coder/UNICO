import { getNow, getViewer } from "@/lib/access/session";
import { isProActive } from "@/lib/access/policy";
import { PricingPlans, type CurrentPlan } from "@/components/pro/PricingPlans";

export const metadata = {
  title: "料金プラン",
  description: "UNICO FREE・UNICO 事前買い目（1レース300円）・UNICO PRO（月額1,280円）の内容と料金。",
};

export default async function ProPlansPage() {
  const viewer = await getViewer();
  const now = getNow();
  const pro = isProActive(viewer, now);
  const current: CurrentPlan = {
    plan: pro ? "PRO" : "FREE",
    loggedIn: !!viewer.userId,
    purchasedCount: viewer.purchases.length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <PricingPlans current={current} />
    </div>
  );
}
