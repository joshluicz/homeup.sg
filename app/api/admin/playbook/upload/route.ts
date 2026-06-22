import { requireAuth } from "@/lib/supabase/auth";
import {
  uploadPlaybookMediaServer,
  type PlaybookMediaFolder,
} from "@/lib/playbook/storage-server";
import { NextResponse } from "next/server";

const FOLDERS = new Set<PlaybookMediaFolder>(["articles", "videos", "thumbnails"]);

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = String(formData.get("folder") ?? "articles");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!FOLDERS.has(folderRaw as PlaybookMediaFolder)) {
      return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
    }

    const url = await uploadPlaybookMediaServer(file, folderRaw as PlaybookMediaFolder);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = /not configured/i.test(message) ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
