"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/Button";

const WA = "https://wa.me/6580877015";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["smarter", "faster", "simpler", "fairer", "better"],
    [],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((n) => (n === titles.length - 1 ? 0 : n + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-8 py-20 lg:py-40">
          {/* Announcement pill */}
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              1,000+ transactions completed{" "}
              <MoveRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="max-w-2xl text-center text-5xl font-regular tracking-tighter md:text-7xl">
              <span className="text-neutral-900">Selling your home,</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-primary-600"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="max-w-2xl text-center text-lg leading-relaxed tracking-tight text-neutral-500 md:text-xl">
              HOMEUP charges a fixed fee for the same full-service experience.
              Most Singapore homeowners save $10,000–$70,000 by switching from
              a 2% commission agent.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" asChild>
              <a href={WA} target="_blank" rel="noopener noreferrer">
                Jump on a call <PhoneCall className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" className="gap-4" asChild>
              <a href="#pricing">
                See pricing <MoveRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
