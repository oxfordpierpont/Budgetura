import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: LucideIcon;
    helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, icon: Icon, helperText, className, children, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {Icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Icon className="h-5 w-5" />
                        </div>
                    )}

                    <select
                        ref={ref}
                        className={cn(
                            'w-full px-3 py-2 border rounded-lg text-sm appearance-none bg-white',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300',
                            Icon && 'pl-10',
                            className
                        )}
                        {...props}
                    >
                        {children}
                    </select>

                    {/* Custom dropdown arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}

                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
