import { redirect } from "next/navigation";

/** Legacy URL — single guide lives at /admin/sync-kit-handoff */
export default function ListingsSyncKitPage() {
  redirect("/admin/sync-kit-handoff");
}
