import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { Agent } from "@/lib/data/agents";
import type { AgentVideo } from "@/lib/data/agents";
import { AgentSocialLinks } from "@/components/ui/AgentSocialLinks";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TikTokEmbed } from "@/components/ui/TikTokEmbed";
import { YoutubeEmbed } from "@/components/ui/YoutubeEmbed";
import { youtubeWatchUrl, youtubeThumbnail } from "@/lib/youtube";

interface AgentProfileProps {
  agent: Agent;
  videos: AgentVideo[];
}

export function AgentProfile({ agent, videos }: AgentProfileProps) {
  const featured = videos[0];
  const moreVideos = videos.slice(1);
  const tikTokVideos = agent.featuredTikTokVideos ?? [];
  const showTikTok = tikTokVideos.length > 0;
  const showYoutube = !showTikTok && !agent.quoteThirdPerson && featured;
  const firstName = agent.name.split(" ")[0];
  const hasIntroVideo = Boolean(agent.introYoutubeVideoId);

  return (
    <>
      <section
        aria-label={`${agent.name} profile`}
        className={`bg-white section-padding${showTikTok ? " max-lg:pb-0" : ""}`}
      >
        <div className="container-page">
          <Link
            href="/agents"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All agents
          </Link>

          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-x-14">
            <div className="mx-auto w-full min-w-0 max-w-md lg:mx-0">
              <div className="relative mx-auto aspect-square max-w-xs overflow-hidden lg:mx-0">
                <Image
                  src={agent.photo}
                  alt={agent.name}
                  fill
                  priority
                  className="object-cover object-[center_5px]"
                  sizes="(max-width: 1024px) 320px, 360px"
                />
              </div>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                {agent.name}
              </h1>
              {agent.quote && (
                <div className="relative mt-5 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50/70 p-5 shadow-[0_4px_24px_rgba(0,154,68,0.08)] sm:p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-primary-600"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-400/20 blur-2xl"
                  />
                  <Eyebrow className="relative mb-3">Profile</Eyebrow>
                  <p className="relative font-display text-lg font-medium leading-relaxed tracking-tight text-neutral-800 sm:text-xl sm:leading-relaxed">
                    {agent.quoteThirdPerson ? agent.quote : `\u201C${agent.quote}\u201D`}
                  </p>
                </div>
              )}
              <p className="mt-4 inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
                CEA: {agent.cea}
              </p>
              {agent.social && !hasIntroVideo && (
                <AgentSocialLinks
                  links={agent.social}
                  agentName={agent.name}
                  className="mt-4"
                />
              )}
              {agent.accolades && agent.accolades.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-lg font-bold tracking-tight text-neutral-900">
                    Accolades
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {agent.accolades.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm font-normal text-neutral-700"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {hasIntroVideo && (
              <div className="w-full min-w-0 lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-md">
                  <div className="relative aspect-video">
                    <YoutubeEmbed
                      videoId={agent.introYoutubeVideoId!}
                      title={`Introduction from ${agent.name}`}
                      autoplay
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm font-normal text-neutral-500">
                  Introduction from {firstName}
                </p>
                {agent.social && (
                  <AgentSocialLinks
                    links={agent.social}
                    agentName={agent.name}
                    className="mt-4"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {agent.about.length > 0 && (
        <section aria-label={`About ${agent.name}`} className="bg-neutral-50 py-12 sm:section-padding">
          <div className="container-page">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              About {firstName}
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
      )}

      {showTikTok && (
        <section aria-label={`${agent.name} on TikTok`} className="section-padding bg-white max-lg:pt-0">
          <div className="container-page">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              Property insights on TikTok
            </h2>
            <p className="mt-2 text-sm font-normal text-neutral-600">
              Short-form tips and real-world property advice from {firstName}.
            </p>
            <TikTokEmbed videos={tikTokVideos} />
          </div>
        </section>
      )}

      {showYoutube && (
        <section aria-label={`${agent.name} videos`} className="section-padding bg-white">
          <div className="container-page">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              Latest from {firstName}
            </h2>
            <p className="mt-2 text-sm font-normal text-neutral-600">
              Property insights and updates from {firstName}&apos;s channel.
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
