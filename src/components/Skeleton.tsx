import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-white/5 rounded ${className}`} />
  );
}

export function PackageSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0d0d0f] rounded-3xl p-6 border border-gray-100 dark:border-white/10">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex justify-between items-center mt-6">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full h-48 md:h-72 lg:h-96 rounded-[2.5rem] overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}
