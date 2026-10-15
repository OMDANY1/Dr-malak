import siteConfig from "../../content/site-config.json";
import siteCopy from "../../content/site-copy.json";
import { Locale } from "./locales";

/**
 * Constructs a WhatsApp URL from the digits-only phone number and a localized
 * prefilled message encoded with encodeURIComponent.
 * Clicking opens WhatsApp; never sends a message automatically.
 */
export function getWhatsAppUrl(locale: Locale, customMessage?: string): string {
  const digits = siteConfig.contact.whatsappDigits.replace(/\D/g, "");
  const defaultMessage = siteCopy[locale].whatsappMessage;
  const message = customMessage ?? defaultMessage;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the standard tel: URI for calling the coordination phone.
 */
export function getTelUrl(): string {
  return `tel:${siteConfig.contact.phone}`;
}

/**
 * Returns the raw E.164 phone number (+966580376463) and a human-readable LTR display format.
 */
export function getPhoneDisplay(): { raw: string; formatted: string } {
  return {
    raw: siteConfig.contact.phone,
    formatted: "+966 58 037 6463",
  };
}

/**
 * Returns the verified Instagram profile URL.
 */
export function getInstagramUrl(): string {
  return siteConfig.contact.instagram;
}
