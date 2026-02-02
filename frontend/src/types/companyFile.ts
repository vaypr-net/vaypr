import { InvoiceData } from "./invoice";
import { ReceiptData } from "./receipt";
import { QuoteData } from "./quote";

export interface GeneratedDocument {
  id: string;
  type: "invoice" | "receipt" | "quote";
  data: InvoiceData | ReceiptData | QuoteData;
  createdAt: string;
  title: string;
}

export interface CompanyFile {
  id: string;
  name: string;
  description?: string;
  logo?: string | null;
  color: string;
  documents: GeneratedDocument[];
  createdAt: string;
  updatedAt: string;
}

export const FILE_COLORS = [
  { name: "Purple", value: "256 67% 59%" },
  { name: "Blue", value: "217 91% 60%" },
  { name: "Green", value: "142 71% 45%" },
  { name: "Orange", value: "25 95% 53%" },
  { name: "Pink", value: "330 81% 60%" },
  { name: "Teal", value: "173 80% 40%" },
] as const;
