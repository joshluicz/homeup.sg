import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { AgentProfile } from "@/components/sections/AgentProfile";
import { getAgentBySlug, getAllAgentSlugs } from "@/lib/data/agents";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  personSchema,
  realEstateAgentSchema,
} from "@/lib/seo/schema";
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

  return buildPageMetadata({
    title: `${agent.name} — Property Advisor`,
    description: agent.bio,
    path: `/agents/${agent.slug}`,
    ogImage: `https://lp.homeup.sg${agent.photo}`,
    ogImageAlt: `${agent.name} — CEA ${agent.cea}, HomeUP property advisor`,
    ogImageWidth: 400,
    ogImageHeight: 400,
  });
}

export default async function AgentPage({ params }: AgentPageProps) {
  const agent = getAgentBySlug(params.slug);
  if (!agent) notFound();

  const videos = await getAgentYoutubeVideos(agent);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our Agents", path: "/agents" },
            { name: agent.name, path: `/agents/${agent.slug}` },
          ]),
          personSchema(agent),
          realEstateAgentSchema(agent),
        ]}
      />
      <Navbar />
      <main>
        <AgentProfile agent={agent} videos={videos} />
      </main>
      <Footer />
    </>
  );
}
