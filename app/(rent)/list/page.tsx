import { Suspense } from "react";
import { LandlordIntakeForm } from "@/components/rent/LandlordIntakeForm";

export default function RentListPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">List your rental</h1>
        <p className="text-sm text-neutral-600">
          Fixed fee at $499 per room and $999 per whole unit. We market it, you host the viewing.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading form…</p>}>
        <LandlordIntakeForm />
      </Suspense>
    </div>
  );
}
