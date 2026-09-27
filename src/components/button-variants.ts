import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-ink shadow-sm hover:bg-brand/90",
        secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
        ghost: "text-ink hover:bg-surface-2",
        soft: "bg-brand-soft text-brand hover:bg-brand-soft/70",
        danger: "bg-bad text-white hover:bg-bad/90 dark:text-bg",
        "danger-ghost": "text-bad hover:bg-bad/10",
        link: "h-auto px-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-[15px]",
        lg: "h-12 px-5 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
