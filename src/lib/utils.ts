import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return price.toLocaleString('fa-IR') + ' تومان';
}

export function formatNumber(num: number) {
  return num.toLocaleString('fa-IR');
}
