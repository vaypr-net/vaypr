import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, HelpCircle, Edit3, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useFaqs } from '../../hooks/useFaqs';

export function FAQsEditor() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  
  const {
    faqs,
    categories: availableCategories,
    isLoading,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    togglePublished,
    isCreating,
  } = useFaqs();

  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaq, setNewFaq] = useState({ 
    question: '', 
    answer: '', 
    category: 'General' 
  });
  const [faqSearch, setFaqSearch] = useState('');
  const [editFormData, setEditFormData] = useState<{
    question: string;
    answer: string;
    category: string;
  }>({ question: '', answer: '', category: '' });

  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer) return;
    
    createFAQ(
      {
        question: newFaq.question,
        answer: newFaq.answer,
        category: newFaq.category,
        published: true,
      },
      {
        onSuccess: () => {
          setNewFaq({ question: '', answer: '', category: 'General' });
          setShowAddFaq(false);
        },
      }
    );
  };

  const handleEditFaq = (id: string) => {
    const faq = faqs.find(f => f._id === id);
    if (!faq) return;

    if (editingFaqId === id) {
      // Save changes
      updateFAQ(
        {
          id,
          dto: {
            question: editFormData.question,
            answer: editFormData.answer,
            category: editFormData.category,
          },
        },
        {
          onSuccess: () => {
            setEditingFaqId(null);
            setEditFormData({ question: '', answer: '', category: '' });
          },
        }
      );
    } else {
      // Start editing
      setEditingFaqId(id);
      setEditFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingFaqId(null);
    setEditFormData({ question: '', answer: '', category: '' });
  };

  const handleDeleteFaq = (id: string) => {
    setFaqToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFaq = () => {
    if (faqToDelete) {
      deleteFAQ(faqToDelete);
      setDeleteConfirmOpen(false);
      setFaqToDelete(null);
    }
  };

  const handleTogglePublished = (id: string) => {
    togglePublished(id);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Default categories if none are loaded from backend
  const categories = availableCategories.length > 0 
    ? availableCategories 
    : ['General', 'Getting Started', 'Billing', 'Features', 'Technical', 'Account'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FAQ Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search FAQs..."
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            className="pl-10"
          />
          <HelpCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button onClick={() => setShowAddFaq(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add FAQ
        </Button>
      </div>

      {/* Add FAQ Form */}
      <AnimatePresence>
        {showAddFaq && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border bg-card p-4 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Add New FAQ</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label className="text-xs">Question</Label>
                <Input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Answer</Label>
              <Textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Enter the answer..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddFaq(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddFaq} disabled={isCreating}>
                {isCreating ? 'Adding...' : 'Add FAQ'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No FAQs found</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div key={faq._id} className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{faq.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{faq.question}</h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {faq.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={faq.published}
                      onCheckedChange={() => handleTogglePublished(faq._id)}
                    />
                    <span className="text-xs text-muted-foreground w-16">
                      {faq.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditFaq(faq._id)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteFaq(faq._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {editingFaqId === faq._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t"
                  >
                    <div className="p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <Label className="text-xs">Question</Label>
                          <Input
                            value={editFormData.question}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, question: e.target.value })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <select
                            value={editFormData.category}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, category: e.target.value })
                            }
                            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Answer</Label>
                        <Textarea
                          value={editFormData.answer}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, answer: e.target.value })
                          }
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleEditFaq(faq._id)}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFaq} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
