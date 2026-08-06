// components/ui/ResponsiveGrid.tsx
"use client";

import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 }
}: ResponsiveGridProps) {
  const gridCols = {
    'grid-cols-1': true,
    [`sm:grid-cols-${cols.sm || 1}`]: cols.sm && cols.sm > 0,
    [`md:grid-cols-${cols.md || 2}`]: cols.md && cols.md > 0,
    [`lg:grid-cols-${cols.lg || 3}`]: cols.lg && cols.lg > 0,
    [`xl:grid-cols-${cols.xl || 4}`]: cols.xl && cols.xl > 0,
  };

  return (
    <div className={cn("grid gap-4", gridCols, className)}>
      {children}
    </div>
  );
}