export const B2B_WHATSAPP_DISPLAY = "+960 741 2060";
export const B2B_WHATSAPP_DIGITS = "9607412060";
export const B2B_EMAIL = "saltrepublic@donad.mv";
export const B2B_WEBSITE = "saltrepublicmv.com";

export function b2bWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${B2B_WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const B2B_WHATSAPP_MESSAGE =
  "Hi Salt Republic, I'm interested in becoming a B2B travel partner.";
