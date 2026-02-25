import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Currency } from "@/app/generated/prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyConfig: Record<Currency, { locale: string; currency: string; decimals: number }> = {
  USD: { locale: "en-US", currency: "USD", decimals: 2 },
  EUR: { locale: "fr-FR", currency: "EUR", decimals: 2 },
  XOF: { locale: "fr-FR", currency: "XOF", decimals: 0 },
}

export function formatCurrency(amountCents: number, currency: Currency = "USD"): string {
  const config = currencyConfig[currency]
  const amount = config.decimals > 0 ? amountCents / 100 : amountCents
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateFull(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
