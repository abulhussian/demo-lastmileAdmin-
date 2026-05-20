import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const OrderStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currencyCode = 'SAR') {
  const code = (typeof currencyCode === 'string' && currencyCode.trim().length === 3) 
    ? currencyCode.trim().toUpperCase() 
    : 'SAR';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
