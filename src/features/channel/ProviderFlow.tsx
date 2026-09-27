import { Bot, MessageCircle, Server, Smartphone } from "lucide-react";
import { forwardRef, useRef, type ReactNode } from "react";

import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { usePrefersReducedMotion } from "@/lib/motion";

const Node = forwardRef<HTMLDivElement, { icon: ReactNode; label: string }>(({ icon, label }, ref) => (
  <div className="z-10 flex flex-col items-center gap-1.5">
    <div
      ref={ref}
      className="grid size-11 place-items-center rounded-full border border-line bg-surface shadow-sm [&_svg]:size-5"
    >
      {icon}
    </div>
    <span className="max-w-20 text-center text-[11px] leading-tight text-ink-2">{label}</span>
  </div>
));
Node.displayName = "Node";

/** Magic UI AnimatedBeam diagram: customer → provider → Bot Desk → AI. */
export function ProviderFlow({ provider }: { provider: "own" | "aisensy" }) {
  const container = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);
  const d = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const beam = {
    containerRef: container,
    gradientStartColor: "hsl(var(--brand))",
    gradientStopColor: "hsl(var(--ok))",
    pathColor: "hsl(var(--line))",
    duration: 4,
  };
  return (
    <div
      ref={container}
      className="relative flex items-center justify-between rounded-lg bg-surface-2/50 px-4 py-5 sm:px-8"
    >
      <Node ref={a} icon={<Smartphone className="text-ink-2" />} label="Customer on WhatsApp" />
      <Node
        ref={b}
        icon={<MessageCircle className="text-ok" />}
        label={provider === "own" ? "Meta Cloud API" : "AiSensy"}
      />
      <Node ref={c} icon={<Server className="text-brand" />} label="Bot Desk" />
      <Node ref={d} icon={<Bot className="text-brand" />} label="AI (OpenRouter)" />
      {!reduced && (
        <>
          <AnimatedBeam {...beam} fromRef={a} toRef={b} />
          <AnimatedBeam {...beam} fromRef={b} toRef={c} delay={0.6} />
          <AnimatedBeam {...beam} fromRef={c} toRef={d} delay={1.2} />
        </>
      )}
    </div>
  );
}
