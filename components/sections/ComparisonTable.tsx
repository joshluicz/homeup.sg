"use client";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeIn, FadeInUp } from "@/components/ui/motion-primitives";

const rows = [
  {
    label: "Fee Structure",
    homeup: "Fixed fee structure",
    typical: "% commission",
  },
  {
    label: "Market Exposure",
    homeup: "Broad, multi-platform",
    typical: "Depends on agent",
  },
  {
    label: "Follow-up",
    homeup: "Structured & tracked",
    typical: "Depends on agent",
  },
  {
    label: "Commitment",
    homeup: "Clear 3-month focus",
    typical: "Depends on Agent",
  },
  {
    label: "Viewing Frequency",
    homeup: "Flexible viewing arrangements enable multiple viewings across the week",
    typical: "Viewings are commonly grouped into limited weekly time windows",
  },
];

const whatsappUrl = "https://wa.me/6580877015";

export function ComparisonTable() {
  return (
    <section
      aria-label="HOMEUP versus typical property agents"
      className="section-padding"
      id="comparison"
    >
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>HOMEUP vs Typical Property Agents</Eyebrow>
          <h2 className="section-title">HOMEUP vs Typical Property Agents</h2>
          <p className="section-lead">
            Selling a home isn&#39;t just about listing it. It&#39;s about
            visibility, follow-through, clear planning, and working with
            fixed-fee property agents in Singapore who stay committed from start
            to finish. HOMEUP is built to deliver strong outcomes and real
            value. Without inflated commissions, pressure tactics, or guesswork.
          </p>
        </FadeInUp>

        <FadeIn delay={0.15}>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm [-webkit-overflow-scrolling:touch]">
            <table className="comparison-table min-w-[720px]">
              <thead>
                <tr>
                  <th scope="col"> </th>
                  <th className="highlight" scope="col">
                    HOMEUP Agents
                  </th>
                  <th scope="col">Typical Agents</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="highlight">{row.homeup}</td>
                    <td>{row.typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <FadeInUp delay={0.25}>
          <div className="mt-8 rounded-xl bg-primary-600 p-8 text-center text-neutral-0 shadow-brand-md">
            <p className="mx-auto max-w-3xl font-display text-2xl font-bold leading-tight tracking-tight">
              Keep More Value. Make Better Decisions with Less Risk.
            </p>
            <Button
              className="mt-6 border-neutral-0 bg-neutral-0 text-primary-700 hover:border-primary-50 hover:bg-primary-50 hover:text-primary-800"
              asChild
            >
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                Schedule a Consultation
              </a>
            </Button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
