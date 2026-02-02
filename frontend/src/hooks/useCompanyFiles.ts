import { useState, useEffect } from "react";
import { CompanyFile, GeneratedDocument } from "@/types/companyFile";
import { InvoiceData } from "@/types/invoice";
import { ReceiptData } from "@/types/receipt";
import { QuoteData } from "@/types/quote";

const STORAGE_KEY = "vaypr_company_files";

export function useCompanyFiles() {
  const [files, setFiles] = useState<CompanyFile[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_active`);
    return stored || null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem(`${STORAGE_KEY}_active`, activeFileId);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_active`);
    }
  }, [activeFileId]);

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const createFile = (name: string, color: string, description?: string) => {
    const newFile: CompanyFile = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    return newFile;
  };

  const updateFile = (id: string, updates: Partial<Omit<CompanyFile, "id" | "createdAt" | "documents">>) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
      )
    );
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(null);
    }
  };

  const saveDocument = (
    fileId: string,
    type: "invoice" | "receipt" | "quote",
    data: InvoiceData | ReceiptData | QuoteData,
    title: string
  ) => {
    const document: GeneratedDocument = {
      id: crypto.randomUUID(),
      type,
      data,
      title,
      createdAt: new Date().toISOString(),
    };

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              documents: [...f.documents, document],
              updatedAt: new Date().toISOString(),
            }
          : f
      )
    );

    return document;
  };

  const deleteDocument = (fileId: string, documentId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              documents: f.documents.filter((d) => d.id !== documentId),
              updatedAt: new Date().toISOString(),
            }
          : f
      )
    );
  };

  const getDocumentsByType = (fileId: string, type: "invoice" | "receipt" | "quote") => {
    const file = files.find((f) => f.id === fileId);
    return file?.documents.filter((d) => d.type === type) || [];
  };

  return {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    createFile,
    updateFile,
    deleteFile,
    saveDocument,
    deleteDocument,
    getDocumentsByType,
  };
}
