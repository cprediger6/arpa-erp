// components/products/ProductListSkeleton.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse flex-1" />
                <div className="h-8 bg-gray-200 rounded animate-pulse flex-1" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}