import { useState, useEffect } from "react";
import { DesignTemplate, TemplateCategory } from "@/types/designTemplate";
import { InvoiceData } from "@/types/invoice";
import { ReceiptData } from "@/types/receipt";
import { QuoteData } from "@/types/quote";

const STORAGE_KEY = "vaypr_design_templates";

export function useDesignTemplates() {
  const [categories, setCategories] = useState<TemplateCategory[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_active`);
    return stored || null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (activeCategoryId) {
      localStorage.setItem(`${STORAGE_KEY}_active`, activeCategoryId);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_active`);
    }
  }, [activeCategoryId]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || null;

  const createCategory = (name: string, color: string, description?: string) => {
    const newCategory: TemplateCategory = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      templates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCategory]);
    setActiveCategoryId(newCategory.id);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Omit<TemplateCategory, "id" | "createdAt" | "templates">>) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (activeCategoryId === id) {
      setActiveCategoryId(null);
    }
  };

  const saveTemplate = (
    categoryId: string,
    type: "invoice" | "receipt" | "quote",
    data: InvoiceData | ReceiptData | QuoteData,
    name: string
  ) => {
    const template: DesignTemplate = {
      id: crypto.randomUUID(),
      name,
      type,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              templates: [...c.templates, template],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    return template;
  };

  const updateTemplate = (
    categoryId: string,
    templateId: string,
    data: InvoiceData | ReceiptData | QuoteData
  ) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              templates: c.templates.map((t) =>
                t.id === templateId
                  ? { ...t, data, updatedAt: new Date().toISOString() }
                  : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const deleteTemplate = (categoryId: string, templateId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              templates: c.templates.filter((t) => t.id !== templateId),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const getTemplatesByType = (type: "invoice" | "receipt" | "quote") => {
    return categories.flatMap((c) =>
      c.templates
        .filter((t) => t.type === type)
        .map((t) => ({ ...t, categoryName: c.name, categoryColor: c.color }))
    );
  };

  const getAllTemplates = () => {
    return categories.flatMap((c) =>
      c.templates.map((t) => ({ ...t, categoryName: c.name, categoryColor: c.color }))
    );
  };

  return {
    categories,
    activeCategory,
    activeCategoryId,
    setActiveCategoryId,
    createCategory,
    updateCategory,
    deleteCategory,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByType,
    getAllTemplates,
  };
}
