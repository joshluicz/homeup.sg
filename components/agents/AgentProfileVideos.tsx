"use client";

import { useEffect, useMemo, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlaybookAutoVideoRail } from "@/components/playbook/PlaybookAutoVideoRail";
import type { AgentProfileVideo } from "@/lib/agents/profile-videos";
import { rowToAgentProfileVideo, type AgentProfileVideoRow } from "@/lib/agents/profile-videos";
import { createClient } from "@/lib/supabase/client";

type AgentProfileVideosProps = {
  agentSlug: string;
  agentFirstName: string;
  initialVideos: AgentProfileVideo[];
};

function toRailItem(video: AgentProfileVideo) {
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    videoUrl: video.videoUrl,
    thumbnail: video.thumbnail,
  };
}

export function AgentProfileVideos({
  agentSlug,
  agentFirstName,
  initialVideos,
}: AgentProfileVideosProps) {
  const [videos, setVideos] = useState<AgentProfileVideo[]>(initialVideos);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("agent_profile_videos")
      .select("*")
      .eq("agent_slug", agentSlug)
      .eq("featured_in_display_b", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error || !data?.length) return;
        setVideos(data.map((row) => rowToAgentProfileVideo(row as AgentProfileVideoRow)));
      });
  }, [agentSlug]);

  const railItems = useMemo(() => videos.map(toRailItem), [videos]);

  if (videos.length === 0) return null;

  return (
    <section
      aria-label={`${agentFirstName} property videos`}
      className="relative overflow-hidden bg-neutral-950 py-10 sm:py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,154,68,0.25),transparent)]"
      />

      <div className="container-page relative">
        <PlaybookAutoVideoRail
          inverted
          videos={railItems}
          intro={
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <Eyebrow className="text-primary-300">Property insights</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Tips from {agentFirstName}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
                Short-form tips and real-world property advice. Each video opens on its own watch
                page for playback and sharing.
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
