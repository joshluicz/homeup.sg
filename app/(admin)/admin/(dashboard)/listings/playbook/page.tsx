import { Suspense } from "react";
import { PlaybookIndexClient } from "@/components/admin/PlaybookIndexClient";
import { getPlaybookVideos } from "@/lib/playbook/queries";

export default async function PlaybookAdminPage() {
  const videos = await getPlaybookVideos().catch(() => []);
  return (
    <Suspense>
      <PlaybookIndexClient videos={videos} />
    </Suspense>
  );
}
