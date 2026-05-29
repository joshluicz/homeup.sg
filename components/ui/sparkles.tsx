"use client";

import { useId } from "react";
import Particles, {
  ParticlesProvider,
  useParticlesProvider,
} from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  direction?: string;
  options?: Record<string, unknown>;
}

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

function SparklesParticles({
  id,
  options,
  className,
}: {
  id: string;
  options: Record<string, unknown>;
  className?: string;
}) {
  const { loaded } = useParticlesProvider();
  if (!loaded) return null;
  return (
    <Particles
      id={id}
      options={options as never}
      className={className}
    />
  );
}

export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  direction = "none",
  options = {},
}: SparklesProps) {
  const id = useId();

  const defaultOptions: Record<string, unknown> = {
    background: { color: { value: background } },
    fullScreen: { enable: false, zIndex: 1 },
    fpsLimit: 120,
    particles: {
      color: { value: color },
      move: {
        enable: true,
        direction,
        speed: { min: minSpeed ?? speed / 10, max: speed },
        straight: false,
      },
      number: { value: density },
      opacity: {
        value: { min: minOpacity ?? opacity / 10, max: opacity },
        animation: { enable: true, sync: false, speed: opacitySpeed },
      },
      size: {
        value: { min: minSize ?? size / 2.5, max: size },
      },
    },
    detectRetina: true,
  };

  const merged = { ...defaultOptions, ...options };

  return (
    <ParticlesProvider init={initEngine}>
      <SparklesParticles id={id} options={merged} className={className} />
    </ParticlesProvider>
  );
}
