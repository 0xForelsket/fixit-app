import type { Attachment } from "@/db/schema";

export type AttachmentWithUrl = Attachment & {
  url: string;
  entityName?: string;
};
