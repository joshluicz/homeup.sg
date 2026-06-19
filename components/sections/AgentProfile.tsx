import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { Agent } from "@/lib/data/agents";
import type { AgentVideo } from "@/lib/data/agents";
import { AgentSocialLinks } from "@/components/ui/AgentSocialLinks";
import { YoutubeEmbed } from "@/components/ui/YoutubeEmbed";
import { youtubeWatchUrl, youtubeThumbnail } from "@/lib/youtube";

interface AgentProfileProps {
  agent: Agent;
  videos: AgentVideo[];
}

export function AgentProfile({ agent, videos }: AgentProfileProps) {
  const featured = videos[0];
  const moreVideos = videos.slice(1);

  return (
    <>
      <section aria-label={`${agent.name} profile`} className="bg-white section-padding">
        <div className="container-page">
          <Link
            href="/agents"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All agents
          </Link>

          <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            <div className="mx-auto w-full max-w-xs lg:mx-0">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
                <Image
                  src={agent.photo}
                  alt={agent.name}
                  fill
                  priority
                  className="object-cover object-[center_5px]"
                  sizes="320px"
                />
              </div>
              <p className="mt-4 text-center text-sm font-normal text-neutral-400 lg:text-left">
                {agent.cea}
              </p>
              {agent.social && (
                <AgentSocialLinks
                  links={agent.social}
                  agentName={agent.name}
                  className="mt-4"
                />
              )}
            </div>

            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                {agent.name}
              </h1>

              {agent.quote && (
                <blockquote className="mt-5 border-l-4 border-primary-500 pl-4 text-sm font-normal italic leading-relaxed text-neutral-600">
                  &ldquo;{agent.quote}&rdquo;
                </blockquote>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {agent.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`About ${agent.name}`} className="bg-neutral-50 py-12 sm:section-padding">
        <div className="container-page">
          <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            About {agent.name.split(" ")[0]}
          </h2>
          <ul className="mt-6 max-w-3xl space-y-3">
            {agent.about.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-normal text-neutral-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured && (
        <section aria-label={`${agent.name} videos`} className="section-padding bg-white">
          <div className="container-page">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              Latest from {agent.name.split(" ")[0]}
            </h2>
            <p className="mt-2 text-sm font-normal text-neutral-600">
              Property insights and updates from {agent.name.split(" ")[0]}&apos;s channel.
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm">
                <div className="relative aspect-video">
                  <YoutubeEmbed
                    videoId={featured.id}
                    title={featured.title}
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="bg-white px-5 py-4">
                  <p className="text-sm font-bold text-neutral-900">{featured.title}</p>
                  <a
                    href={youtubeWatchUrl(featured.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Watch on YouTube →
                  </a>
                </div>
              </div>

              {moreVideos.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-neutral-500">More videos</p>
                  {moreVideos.map((video) => (
                    <a
                      key={video.id}
                      href={youtubeWatchUrl(video.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition hover:border-primary-600/40 hover:bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={youtubeThumbnail(video.id)}
                        alt=""
                        className="h-16 w-28 shrink-0 rounded-lg object-cover"
                      />
                      <span className="text-sm font-medium leading-snug text-neutral-800 group-hover:text-primary-700">
                        {video.title}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
