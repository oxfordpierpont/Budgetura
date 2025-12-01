import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
    const variants = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'animate-pulse bg-gray-200',
                variants[variant],
                className
            )}
        />
    );
}
