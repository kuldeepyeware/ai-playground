import { ClerkWebhookEvent } from "@/types/webhook";

function getPrimaryEmail(data: ClerkWebhookEvent["data"]): string {
  const primaryId = data.primary_email_address_id;
  const primary = data.email_addresses?.find((email) => email.id === primaryId);
  const fallback = data.email_addresses?.[0]?.email_address;
  return primary?.email_address || fallback || `${data.id}@example.invalid`;
}

export { getPrimaryEmail };
