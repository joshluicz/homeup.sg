export function getContactWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || "6580877015";
}

export function buildIntakeWhatsAppUrl(): string {
  const number = getContactWhatsAppNumber();
  const message = "Hi, I just submitted my rental listing on HomeUp. Happy to chat!";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
