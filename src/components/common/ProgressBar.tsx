import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
    value: number;
    max?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showLabel = false,
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
        default: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600',
        info: 'bg-blue-500',
    };

    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className={cn('w-full', className)}>
            <div className={cn('bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
                <div
                    className={cn('h-full transition-all duration-300 ease-in-out', variants[variant])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-gray-600 mt-1">{percentage.toFixed(0)}%</p>
            )}
        </div>
    );
}
