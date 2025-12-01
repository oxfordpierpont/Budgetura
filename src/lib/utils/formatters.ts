import { format, formatDistance, formatRelative } from 'date-fns';

/**
 * Format currency according to user preferences
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 */
export function formatCurrency(
    amount: number,
    currency: string = 'USD'
): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format percentage
 * @param value - Value to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercentage(
    value: number,
    decimals: number = 1
): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'MMM d, yyyy')
 */
export function formatDate(
    date: string | Date,
    formatStr: string = 'MMM d, yyyy'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
}

/**
 * Format date as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}
