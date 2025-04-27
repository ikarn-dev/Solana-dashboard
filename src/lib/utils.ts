import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimeAgo = (timestamp: number | undefined | null) => {
  if (!timestamp) return 'N/A';
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function formatLargeNumber(value: number): string {
  if (!value || isNaN(value)) return '0';
  
  const trillion = 1e12;
  const billion = 1e9;
  const million = 1e6;
  const thousand = 1e3;

  if (value >= trillion) {
    return (value / trillion).toFixed(2) + 'T';
  } else if (value >= billion) {
    return (value / billion).toFixed(2) + 'B';
  } else if (value >= million) {
    return (value / million).toFixed(2) + 'M';
  } else if (value >= thousand) {
    return (value / thousand).toFixed(2) + 'K';
  }

  return value.toFixed(2);
}

// Format stake numbers to be more readable
export function formatStakeNumber(value: number): string {
  if (!value || isNaN(value)) return '0';
  return formatLargeNumber(value);
}

export function calculateEpochETA(currentSlot: number, slotsPerEpoch: number = 432000): string {
  const slotsRemaining = slotsPerEpoch - (currentSlot % slotsPerEpoch);
  const estimatedSecondsRemaining = slotsRemaining * 0.4; // Assuming 0.4 seconds per slot
  
  // Calculate days, hours, minutes, and seconds
  const days = Math.floor(estimatedSecondsRemaining / (24 * 60 * 60));
  const hours = Math.floor((estimatedSecondsRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((estimatedSecondsRemaining % (60 * 60)) / 60);
  const seconds = Math.floor(estimatedSecondsRemaining % 60);
  
  // Format the output based on the time remaining
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatSlotTime(slot: number): string {
  const date = new Date();
  const slotTime = new Date(date.getTime() - (slot % 432000) * 400); // 400ms per slot
  return slotTime.toLocaleTimeString();
}

export function formatNumber(value: number): string {
  if (!value || isNaN(value)) return '0';
  
  const trillion = 1e12;
  const billion = 1e9;
  const million = 1e6;
  const thousand = 1e3;

  if (value >= trillion) {
    return (value / trillion).toFixed(2) + 'T';
  } else if (value >= billion) {
    return (value / billion).toFixed(2) + 'B';
  } else if (value >= million) {
    return (value / million).toFixed(2) + 'M';
  } else if (value >= thousand) {
    return (value / thousand).toFixed(2) + 'K';
  }

  return value.toFixed(2);
} 