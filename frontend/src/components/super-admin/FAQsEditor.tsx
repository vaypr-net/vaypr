import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Edit3, Trash2, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFaqs,
  useFaqCategories,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useToggleFaqPublished,
} from "@/hooks/useFaqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function FAQsEditor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    published: true,
  });

  // React Query hooks
  const { data: faqs = [], isLoading } = useFaqs();
  const { data: categories = [] } = useFaqCategories();
  const createFaqMutation = useCreateFaq();
  const updateFaqMutation = useUpdateFaq();
  const deleteFaqMutation = useDeleteFaq();
  const togglePublishedMutation = useToggleFaqPublished();

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      return;
    }

    if (editingId) {
      await updateFaqMutation.mutateAsync({
        id: editingId,
        data: formData,
      });
      setEditingId(null);
    } else {
      await createFaqMutation.mutateAsync(formData);
    }

    setFormData({
      question: "",
      answer: "",
      category: "General",
      published: true,
    });
    setShowAddForm(false);
  };

  const handleEdit = (faq: any) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      published: faq.published,
    });
    setEditingId(faq._id);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      question: "",
      answer: "",
      category: "General",
      published: true,
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteFaqMutation.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleTogglePublished = async (id: string) => {
    await togglePublishedMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <HelpCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border bg-card overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">
                    {editingId ? "Edit FAQ" : "Add New FAQ"}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs">Question *</Label>
                  <Input
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder="Enter the question..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Getting Started">Getting Started</SelectItem>
                          <SelectItem value="Billing">Billing</SelectItem>
                          <SelectItem value="Features">Features</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Account">Account</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Answer *</Label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder="Enter the answer..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked })
                    }
                  />
                  <Label className="text-sm">
                    {formData.published ? "Published" : "Draft"}
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.question.trim() ||
                      !formData.answer.trim() ||
                      createFaqMutation.isPending ||
                      updateFaqMutation.isPending
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Update FAQ" : "Add FAQ"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No FAQs found</p>
            <p className="text-sm">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first FAQ"}
            </p>
          </div>
        ) : (
          filteredFaqs
            .sort((a, b) => a.order - b.order)
            .map((faq) => (
              <div
                key={faq._id}
                className="rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4 p-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">
                      {faq.order}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium">{faq.question}</h4>
                      <Badge variant="outline" className="text-xs">
                        {faq.category}
                      </Badge>
                      {!faq.published && (
                        <Badge variant="secondary" className="text-xs">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={faq.published}
                        onCheckedChange={() => handleTogglePublished(faq._id)}
                        disabled={togglePublishedMutation.isPending}
                      />
                      <span className="text-xs text-muted-foreground w-16">
                        {faq.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmId(faq._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
