type ClerkWebhookEvent = {
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
  type: "user.created" | "user.updated" | "user.deleted";
};

export type { ClerkWebhookEvent };
