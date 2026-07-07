"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef } from "react";

import { cn } from "./cn";

export const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden bg-line-strong">
      <SliderPrimitive.Range className="absolute h-full bg-amber" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-3 w-3 rounded-[2px] border border-amber bg-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
