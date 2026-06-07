"use client";
import { Button } from "@/components/ui/Button";
import { FadeInUp } from "@/components/ui/motion-primitives";

const whatsappUrl = "https://wa.me/6580877015";

export function CtaBanner() {
  return (
    <section aria-label="Schedule a HOMEUP planning conversation" className="bg-neutral-900 py-12 sm:py-16 lg:py-20">
      <div className="container-page text-center">
        <FadeInUp>
          <div className="mx-auto max-w-3xl">
            <h2 className="m-0 font-display text-2xl font-bold leading-tight tracking-tight text-neutral-50 sm:text-display-sm">
              Start With a Planning Conversation
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-200 sm:text-lg">
              You don&#39;t need to make any decisions today. A planning call is
              simply a conversation to understand your situation, clarify your
              options, and see whether a coordinated sell-and-buy approach makes
              sense for you.
            </p>
            <Button className="mt-6 w-full sm:mt-8 sm:w-auto" size="lg" asChild>
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                Schedule a Consultation Today
              </a>
            </Button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
