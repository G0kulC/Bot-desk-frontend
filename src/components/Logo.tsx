import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src="/favicon.svg" alt="" className="size-8" />
      <AnimatedGradientText
        className="font-display text-lg font-bold"
        colorFrom="hsl(var(--brand))"
        colorTo="hsl(var(--ok))"
      >
        Bot Desk
      </AnimatedGradientText>
    </div>
  );
}
