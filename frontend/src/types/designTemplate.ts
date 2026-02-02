import { InvoiceData } from "./invoice";
import { ReceiptData } from "./receipt";
import { QuoteData } from "./quote";

export interface DesignTemplate {
  id: string;
  name: string;
  type: "invoice" | "receipt" | "quote";
  data: InvoiceData | ReceiptData | QuoteData;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  templates: DesignTemplate[];
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_COLORS = [
  { name: "Purple", value: "256 67% 59%" },
  { name: "Blue", value: "217 91% 60%" },
  { name: "Green", value: "142 71% 45%" },
  { name: "Orange", value: "25 95% 53%" },
  { name: "Pink", value: "330 81% 60%" },
  { name: "Teal", value: "173 80% 40%" },
] as const;
