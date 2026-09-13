import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground shadow-2xs hover:bg-muted/60 dark:hover:bg-muted",
        secondary:
          "border border-border bg-card text-foreground shadow-2xs hover:bg-secondary/70 dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        soft: "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:border-primary/30",
        ai: "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 font-medium shadow-2xs",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-lg px-5 text-sm font-semibold",
        xl: "h-11 rounded-lg px-6 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
