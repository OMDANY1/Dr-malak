import siteConfig from "../../content/site-config.json";
import siteCopy from "../../content/site-copy.json";
import { Locale } from "./locales";

export function formatPhoneHumanReadable(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("966") && digits.length === 12) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(
      8
    )}`;
  }
  return trimmed;
}

/**
 * Constructs a WhatsApp URL from the digits-only phone number and a localized
 * prefilled message encoded with encodeURIComponent.
 * Clicking opens WhatsApp; never sends a message automatically.
 */
export function getWhatsAppUrl(
  locale: Locale,
  customMessage?: string,
  overrideWhatsappDigits?: string
): string {
  const digits = (
    overrideWhatsappDigits || siteConfig.contact.whatsappDigits
  ).replace(/\D/g, "");
  const defaultMessage = siteCopy[locale].whatsappMessage;
  const message = customMessage ?? defaultMessage;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the standard tel: URI for calling the coordination phone.
 */
export function getTelUrl(overridePhone?: string): string {
  return `tel:${(overridePhone || siteConfig.contact.phone).trim()}`;
}

/**
 * Returns the raw E.164 phone number (+966580376463) and a human-readable LTR display format.
 */
export function getPhoneDisplay(overridePhone?: string): {
  raw: string;
  formatted: string;
} {
  const raw = (overridePhone || siteConfig.contact.phone).trim();
  return {
    raw,
    formatted: formatPhoneHumanReadable(raw),
  };
}

/**
 * Returns the verified Instagram profile URL.
 */
export function getInstagramUrl(overrideUrl?: string): string {
  return (overrideUrl || siteConfig.contact.instagram).trim();
}
