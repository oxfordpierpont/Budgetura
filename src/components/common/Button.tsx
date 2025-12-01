import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
        md: 'px-4 py-2 text-sm rounded-lg gap-2',
        lg: 'px-6 py-3 text-base rounded-lg gap-2',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            )}
            {!isLoading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
            {children}
            {!isLoading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
        </button>
    );
}
