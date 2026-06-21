import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  const safePrice = Number.isFinite(price) ? price : 0;
  return `${safePrice.toLocaleString("fa-IR")} تومان`;
}

export function formatNumber(num: number) {
  const safeNumber = Number.isFinite(num) ? num : 0;
  return safeNumber.toLocaleString("fa-IR");
}
