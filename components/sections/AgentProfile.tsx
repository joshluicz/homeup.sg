import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Play } from "lucide-react";
import type { Agent, AgentAccoladeFootnote } from "@/lib/data/agents";
import type { AgentProfileVideo } from "@/lib/agents/profile-videos";
import { agentIntroWatchSlug } from "@/lib/agents/intro-videos";
import { AgentProfileVideos } from "@/components/agents/AgentProfileVideos";
import { AgentSocialLinks } from "@/components/ui/AgentSocialLinks";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { youtubeThumbnail } from "@/lib/youtube";

interface AgentProfileProps {
  agent: Agent;
  profileVideos: AgentProfileVideo[];
}

function AccoladeFootnote({ footnote }: { footnote: AgentAccoladeFootnote }) {
  return (
    <p className="text-xs font-normal leading-relaxed text-neutral-500">
      <span aria-hidden="true">{footnote.marker} </span>
      {footnote.text}
      {footnote.link && (
        <>
          {footnote.link.before}
          <Link
            href={footnote.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline decoration-primary-200 underline-offset-2 transition hover:text-primary-800 hover:decoration-primary-400"
          >
            {footnote.link.label}
          </Link>
          {footnote.link.after}
        </>
      )}
    </p>
  );
}

export function AgentProfile({ agent, profileVideos }: AgentProfileProps) {
  const hasProfileVideos = profileVideos.length > 0;
  const firstName = agent.name.split(" ")[0];
  const hasIntroVideo = Boolean(agent.introYoutubeVideoId);

  return (
    <>
      <section
        aria-label={`${agent.name} profile`}
        className={`bg-white section-padding${hasProfileVideos ? " max-lg:pb-0" : ""}`}
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
              <h1 className="mt-4 flex flex-wrap items-center gap-x-2 font-display font-extrabold tracking-tight text-neutral-900">
                <span className="text-3xl sm:text-4xl">{agent.name}</span>
                {agent.profileTitle && (
                  <>
                    <span
                      aria-hidden="true"
                      className="text-2xl font-bold leading-none text-neutral-500 sm:text-3xl"
                    >
                      ·
                    </span>
                    <span className="text-lg font-semibold text-primary-700 sm:text-xl">
                      {agent.profileTitle}
                    </span>
                  </>
                )}
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
                  {agent.accoladeFootnotes && agent.accoladeFootnotes.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4">
                      {agent.accoladeFootnotes.map((footnote) => (
                        <AccoladeFootnote key={footnote.marker} footnote={footnote} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {hasIntroVideo && (
              <div
                className={`w-full min-w-0 lg:sticky lg:top-24${hasProfileVideos ? " max-lg:mb-0.5" : ""}`}
              >
                <Link
                  href={`/playbook/watch/${agentIntroWatchSlug(agent.slug)}`}
                  className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-md transition hover:border-primary-200 hover:shadow-lg"
                >
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={youtubeThumbnail(agent.introYoutubeVideoId!)}
                      alt={`Introduction from ${agent.name}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-neutral-950/20 transition group-hover:bg-neutral-950/35" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg transition group-hover:scale-105 group-hover:bg-white">
                        <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
                <p className="mt-3 text-sm font-normal text-neutral-500">
                  Introduction from {firstName}.{" "}
                  <Link
                    href={`/playbook/watch/${agentIntroWatchSlug(agent.slug)}`}
                    className="font-medium text-primary-700 underline decoration-primary-200 underline-offset-2 transition hover:text-primary-800 hover:decoration-primary-400"
                  >
                    Watch introduction
                  </Link>
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

      {hasProfileVideos && (
        <AgentProfileVideos
          agentSlug={agent.slug}
          agentFirstName={firstName}
          initialVideos={profileVideos}
        />
      )}
    </>
  );
}
