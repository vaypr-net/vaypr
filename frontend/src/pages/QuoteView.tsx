import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Quote, QuoteTimelineEvent } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuoteService } from '@/api/services/quote.service';

export default function QuoteView() {
  const { token } = useParams();
  const { toast } = useToast();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modificationMessage, setModificationMessage] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (token) {
      loadQuote(token);
    }
  }, [token]);

  const loadQuote = async (shareToken: string) => {
    try {
      // First, try to fetch from API
      const fetchedQuote = await QuoteService.getByShareToken(shareToken);
      setQuote(fetchedQuote);
      if (fetchedQuote.clientResponse) {
        setHasResponded(true);
      }
      
      // Track view after successful fetch
      if (!fetchedQuote.viewedAt && !hasTrackedView.current) {
        hasTrackedView.current = true;
        // You might want to call an API to update the viewedAt status
      }
    } catch (apiError) {
      // If API fails, fall back to localStorage
      try {
        const allKeys = Object.keys(localStorage);
        let foundQuote: Quote | null = null;
        let storageKey: string | null = null;

        for (const key of allKeys) {
          if (key.startsWith('fintrack_quotes')) {
            const quotes: Quote[] = JSON.parse(localStorage.getItem(key) || '[]');
            const matched = quotes.find(q => q.shareToken === shareToken);
            if (matched) {
              foundQuote = matched;
              storageKey = key;
              break;
            }
          }
        }

        if (foundQuote && storageKey) {
          setQuote(foundQuote);
          if (foundQuote.clientResponse) {
            setHasResponded(true);
          }
          
          // Track view and update status to "viewed" if not already viewed/responded
          if (!foundQuote.viewedAt && !hasTrackedView.current) {
            hasTrackedView.current = true;
            trackQuoteView(storageKey, shareToken, foundQuote);
          }
        } else {
          setError('Quote not found or link has expired');
        }
      } catch (localStorageError) {
        setError('Quote not found or link has expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const trackQuoteView = (storageKey: string, shareToken: string, currentQuote: Quote) => {
    try {
      const quotes: Quote[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const quoteIndex = quotes.findIndex(q => q.shareToken === shareToken);
      
      if (quoteIndex !== -1) {
        const viewEvent: QuoteTimelineEvent = {
          id: crypto.randomUUID(),
          type: 'viewed',
          timestamp: new Date().toISOString(),
        };
        
        quotes[quoteIndex] = {
          ...quotes[quoteIndex],
          status: 'viewed', // Update status to viewed
          viewedAt: new Date().toISOString(),
          timeline: [...(quotes[quoteIndex].timeline || []), viewEvent],
        };
        
        localStorage.setItem(storageKey, JSON.stringify(quotes));
        setQuote(quotes[quoteIndex]);
        
        addViewNotification(storageKey, currentQuote);
      }
    } catch (err) {
      console.error('Failed to track quote view:', err);
    }
  };

  const addViewNotification = (quotesKey: string, currentQuote: Quote) => {
    try {
      const userId = quotesKey.replace('fintrack_quotes_', '');
      const notificationsKey = userId !== 'fintrack_quotes' 
        ? `fintrack_reminders_${userId}` 
        : 'fintrack_reminders';
      
      const existingReminders = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
      
      const clientName = currentQuote.billTo?.name || currentQuote.clientName;
      const newNotification = {
        id: crypto.randomUUID(),
        type: 'custom',
        title: `Quote ${currentQuote.quoteNumber} Viewed`,
        message: `${clientName} has viewed your quote. Awaiting their response.`,
        relatedId: currentQuote.id,
        dueDate: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem(notificationsKey, JSON.stringify([newNotification, ...existingReminders]));
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const updateQuoteResponse = (action: 'accepted' | 'rejected' | 'modification_requested', message?: string) => {
    if (!quote || !token) return;

    try {
      const allKeys = Object.keys(localStorage);
      
      for (const key of allKeys) {
        if (key.startsWith('fintrack_quotes')) {
          const quotes: Quote[] = JSON.parse(localStorage.getItem(key) || '[]');
          const quoteIndex = quotes.findIndex(q => q.shareToken === token);
          
          if (quoteIndex !== -1) {
            const responseEvent: QuoteTimelineEvent = {
              id: crypto.randomUUID(),
              type: action,
              timestamp: new Date().toISOString(),
              message,
            };
            
            quotes[quoteIndex] = {
              ...quotes[quoteIndex],
              status: action,
              timeline: [...(quotes[quoteIndex].timeline || []), responseEvent],
              clientResponse: {
                respondedAt: new Date().toISOString(),
                action,
                message,
              },
            };
            localStorage.setItem(key, JSON.stringify(quotes));
            setQuote(quotes[quoteIndex]);
            setHasResponded(true);
            
            addResponseNotification(key, quotes[quoteIndex], action, message);
            break;
          }
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to submit response', variant: 'destructive' });
    }
  };

  const addResponseNotification = (quotesKey: string, currentQuote: Quote, action: string, message?: string) => {
    try {
      const userId = quotesKey.replace('fintrack_quotes_', '');
      const notificationsKey = userId !== 'fintrack_quotes' 
        ? `fintrack_reminders_${userId}` 
        : 'fintrack_reminders';
      
      const existingReminders = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
      
      const actionLabels: Record<string, string> = {
        accepted: 'Accepted',
        rejected: 'Declined',
        modification_requested: 'Requested Modifications',
      };
      
      const clientName = currentQuote.billTo?.name || currentQuote.clientName;
      const newNotification = {
        id: crypto.randomUUID(),
        type: 'custom',
        title: `Quote ${currentQuote.quoteNumber} ${actionLabels[action]}`,
        message: action === 'modification_requested' 
          ? `${clientName} requested modifications: "${message}"` 
          : `${clientName} has ${actionLabels[action].toLowerCase()} your quote.`,
        relatedId: currentQuote.id,
        dueDate: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem(notificationsKey, JSON.stringify([newNotification, ...existingReminders]));
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const handleAccept = () => {
    updateQuoteResponse('accepted');
    toast({ 
      title: 'Quote Accepted', 
      description: 'Thank you! Your acceptance has been recorded.',
    });
  };

  const handleReject = () => {
    updateQuoteResponse('rejected');
    toast({ 
      title: 'Quote Declined', 
      description: 'Your response has been recorded.',
    });
  };

  const handleModificationRequest = () => {
    if (!modificationMessage.trim()) {
      toast({ title: 'Error', description: 'Please provide details for the modification', variant: 'destructive' });
      return;
    }
    updateQuoteResponse('modification_requested', modificationMessage);
    setIsModifyDialogOpen(false);
    toast({ 
      title: 'Modification Requested', 
      description: 'Your modification request has been sent.',
    });
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: Quote['status']) => {
    const styles: Record<string, string> = {
      draft: 'bg-secondary text-secondary-foreground',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      viewed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      modification_requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      sent: 'Pending Review',
      viewed: 'Viewed',
      accepted: 'Accepted',
      rejected: 'Declined',
      expired: 'Expired',
      converted: 'Converted',
      modification_requested: 'Modification Requested',
    };
    return <Badge className={styles[status] || styles.draft}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'This quote link may have expired or is invalid.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quote.validUntil) < new Date();
  const canRespond = !hasResponded && !isExpired && (quote.status === 'sent' || quote.status === 'viewed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Bar */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{quote.quoteNumber}</p>
              <p className="text-xs text-muted-foreground">Quote Document</p>
            </div>
          </div>
          {getStatusBadge(quote.status)}
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-40">
        {/* Quote Document */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 p-8 border-b">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3">
                {quote.logo ? (
                  <img 
                    src={quote.logo} 
                    alt="Company Logo" 
                    className="h-24 w-auto object-contain"
                    style={{ 
                      maxHeight: `${6 * (quote.logoScale || 1)}rem`,
                      transform: `scale(${quote.logoScale || 1})` 
                    }}
                  />
                ) : quote.companyName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">{quote.companyName}</h1>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {quote.companyAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{quote.companyAddress}</span>
                    </div>
                  )}
                  {quote.companyPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{quote.companyPhone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="inline-block bg-white dark:bg-slate-700 rounded-xl px-6 py-3 shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Quote Total</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(quote.total, quote.currencySymbol)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details Grid */}
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quote For */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Quote For
                </p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-1">
                  <p className="font-semibold text-lg">{quote.billTo?.name || quote.clientName}</p>
                  {(quote.billTo?.phone || quote.clientPhone) && <p className="text-muted-foreground text-sm">{quote.billTo?.phone || quote.clientPhone}</p>}
                  {quote.clientEmail && <p className="text-muted-foreground text-sm">{quote.clientEmail}</p>}
                  {(quote.billTo?.area || quote.billTo?.block || quote.billTo?.street || quote.clientArea || quote.clientBlock || quote.clientStreet) && (
                    <p className="text-muted-foreground text-sm">
                      {[quote.billTo?.area || quote.clientArea, quote.billTo?.block || quote.clientBlock, quote.billTo?.street || quote.clientStreet, quote.billTo?.house || quote.clientHouse]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Quote Info */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Quote Details
                </p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Quote Date
                    </span>
                    <span className="font-medium">{format(new Date(quote.quoteDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Valid Until
                    </span>
                    <span className={`font-medium ${isExpired ? 'text-destructive' : 'text-green-600'}`}>
                      {format(new Date(quote.validUntil), 'MMM d, yyyy')}
                      {isExpired && ' (Expired)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Items & Services
              </p>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit Price</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr key={item.id || index} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="py-4 px-4 font-medium">{item.description}</td>
                        <td className="py-4 px-4 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-muted-foreground">
                          {formatCurrency(item.unitPrice, quote.currencySymbol)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold">
                          {formatCurrency(item.quantity * item.unitPrice, quote.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(quote.subtotal, quote.currencySymbol)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({quote.discount}%)</span>
                    <span>-{formatCurrency(quote.subtotal * quote.discount / 100, quote.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-slate-200 dark:border-slate-600">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatCurrency(quote.total, quote.currencySymbol)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-100 dark:border-amber-800/30">
                <p className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-200">Terms & Notes</p>
                <p className="text-amber-700 dark:text-amber-300 text-sm whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            {/* Response Status Card */}
            {hasResponded && quote.clientResponse && (
              <div className={`rounded-xl p-5 border-2 ${
                quote.clientResponse.action === 'accepted' 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : quote.clientResponse.action === 'rejected'
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {quote.clientResponse.action === 'accepted' && <CheckCircle className="h-6 w-6 text-green-600" />}
                  {quote.clientResponse.action === 'rejected' && <XCircle className="h-6 w-6 text-red-600" />}
                  {quote.clientResponse.action === 'modification_requested' && <MessageSquare className="h-6 w-6 text-yellow-600" />}
                  <span className="font-semibold text-lg">
                    {quote.clientResponse.action === 'accepted' && 'You accepted this quote'}
                    {quote.clientResponse.action === 'rejected' && 'You declined this quote'}
                    {quote.clientResponse.action === 'modification_requested' && 'You requested modifications'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Responded on {format(new Date(quote.clientResponse.respondedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
                {quote.clientResponse.message && (
                  <p className="mt-3 text-sm italic bg-white/50 dark:bg-black/20 rounded-lg p-3">"{quote.clientResponse.message}"</p>
                )}
              </div>
            )}

            {/* Expired Notice */}
            {isExpired && !hasResponded && (
              <div className="bg-destructive/5 rounded-xl p-5 border-2 border-destructive/20 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <p className="font-semibold text-destructive text-lg">This quote has expired</p>
                <p className="text-muted-foreground mt-1">Please contact us for a new quote.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Fixed Footer with Action Buttons */}
      {canRespond && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t shadow-2xl z-50">
          <div className="max-w-4xl mx-auto px-4 py-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Ready to proceed?</p>
                <p className="font-semibold">Choose your response below</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  size="lg" 
                  className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25 px-6"
                  onClick={handleAccept}
                >
                  <CheckCircle className="h-5 w-5" />
                  Accept Quote
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 border-2 px-6"
                  onClick={() => setIsModifyDialogOpen(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                  Request Edit
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 px-6"
                  onClick={handleReject}
                >
                  <XCircle className="h-5 w-5" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modification Dialog */}
      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Request Modification
            </DialogTitle>
            <DialogDescription>
              Please describe what changes you would like. We'll review and get back to you promptly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Message</Label>
              <Textarea
                value={modificationMessage}
                onChange={(e) => setModificationMessage(e.target.value)}
                placeholder="E.g., Please adjust the quantity for item X, or I need additional services..."
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleModificationRequest} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
