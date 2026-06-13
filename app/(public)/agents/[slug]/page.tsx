import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AgentProfile } from "@/components/sections/AgentProfile";
import { getAgentBySlug, getAllAgentSlugs } from "@/lib/data/agents";
import { getAgentYoutubeVideos } from "@/lib/youtube";

interface AgentPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllAgentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const agent = getAgentBySlug(params.slug);
  if (!agent) return { title: "Agent Not Found" };

  return {
    title: `${agent.name} — Property Advisor`,
    description: agent.bio,
    alternates: { canonical: `https://lp.homeup.sg/agents/${agent.slug}` },
    openGraph: {
      url: `https://lp.homeup.sg/agents/${agent.slug}`,
      title: `${agent.name} | HomeUP`,
      description: agent.bio,
      images: [{ url: `https://lp.homeup.sg${agent.photo}`, alt: agent.name }],
    },
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const agent = getAgentBySlug(params.slug);
  if (!agent) notFound();

  const videos = await getAgentYoutubeVideos(agent);

  return (
    <>
      <Navbar />
      <main>
        <AgentProfile agent={agent} videos={videos} />
      </main>
      <Footer />
    </>
  );
}
