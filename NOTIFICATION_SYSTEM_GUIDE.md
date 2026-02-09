# Vayper Notification System - Complete Guide

## Overview
The Vayper application uses a **multi-layered notification system** that combines real-time toast notifications, persistent reminder storage, and smart data-driven alerts. Here's how notifications work across different user events.

---

## 1. Toast Notifications (Real-time Feedback)

### What They Are
Toast notifications are **temporary pop-up messages** that appear in the bottom-right corner when users perform actions (create, update, delete, etc.).

### Technical Implementation
- **Location:** [`src/hooks/use-toast.ts`](src/hooks/use-toast.ts)
- **Pattern:** React Context + Reducer pattern
- **Configuration:** Max 1 visible toast, auto-dismiss after 1 million milliseconds
- **Hook Export:** `useToast()` — used in all mutation operations

### Visual Example
```typescript
const { toast } = useToast();

// Success toast
toast({
  title: 'Invoice created',
  description: 'The invoice has been created successfully.',
});

// Error toast
toast({
  title: 'Error',
  description: error.response?.data?.message || 'Failed to create invoice.',
  variant: 'destructive',  // Red background for errors
});
```

---

## 2. Event-Triggered Notifications

### A. Invoice Operations

#### Event: Invoice Created
- **Trigger:** User clicks "Save Invoice" button
- **Hook:** `useCreateInvoice()` from [`src/hooks/api/useInvoices.ts`](src/hooks/api/useInvoices.ts)
- **Toast Message:**
  ```
  ✅ Invoice created
  The invoice has been created successfully.
  ```
- **Side Effect:** Page automatically refreshes invoice list via React Query

#### Event: Invoice Updated
- **Trigger:** User modifies invoice details and saves
- **Hook:** `useUpdateInvoice()`
- **Toast Message:**
  ```
  ✅ Invoice updated
  The invoice has been updated successfully.
  ```
- **Side Effect:** List queries invalidated, fresh data fetched

#### Event: Invoice Deleted
- **Trigger:** User clicks delete and confirms
- **Hook:** `useDeleteInvoice()`
- **Toast Message:**
  ```
  ✅ Invoice deleted
  The invoice has been removed successfully.
  ```

#### Event: Invoice Overdue
- **Trigger:** Automatic (no user action needed)
- **Location:** [`src/pages/Notifications.tsx`](src/pages/Notifications.tsx)
- **Detection Logic:** Invoice status = 'overdue' OR current date > due date
- **Notification Card:**
  ```
  🔴 HIGH SEVERITY
  Invoice #INV-001 is overdue
  Payment of KD 500.000 from Client Name is past due
  ```
- **Browser Display:** Shows in Notifications page with red badge
- **Dashboard Display:** Shows count in Dashboard stats card

---

### B. Client Operations

#### Event: Client Created
- **Trigger:** User adds new client
- **Hook:** `useCreateClient()` from [`src/hooks/api/useClients.ts`](src/hooks/api/useClients.ts)
- **Toast Message:**
  ```
  ✅ Client created
  The client has been added successfully.
  ```

#### Event: Client Updated
- **Trigger:** User edits client profile or details
- **Hook:** `useUpdateClient()`
- **Toast Message:**
  ```
  ✅ Client updated
  The client has been updated successfully.
  ```

#### Event: Client Deleted
- **Trigger:** User removes client from directory
- **Hook:** `useDeleteClient()`
- **Toast Message:**
  ```
  ✅ Client deleted
  The client has been removed successfully.
  ```

---

### C. Quote Operations

#### Event: Quote Created
- **Trigger:** User generates quote for client
- **Hook:** `useCreateQuote()` from [`src/hooks/api/useQuotes.ts`](src/hooks/api/useQuotes.ts)
- **Toast Message:**
  ```
  ✅ Quote created
  The quote has been created successfully.
  ```

#### Event: Quote Updated
- **Trigger:** User modifies quote before sending
- **Hook:** `useUpdateQuote()`
- **Toast Message:**
  ```
  ✅ Quote updated
  The quote has been updated successfully.
  ```

#### Event: Quote Sent to Client
- **Trigger:** User clicks "Send Quote" button
- **Callback:** `onSuccess` in mutation
- **Toast Message:**
  ```
  ✅ Quote sent
  The quote has been sent to your client.
  ```

#### Event: Quote Viewed by Client
- **Trigger:** Client opens quote link
- **Location:** [`src/pages/QuoteView.tsx`](src/pages/QuoteView.tsx)
- **Function:** `addViewNotification()`
- **Persistent Notification:**
  ```
  📋 Quote #QUOTE-002 Viewed
  Client Name has viewed your quote. Awaiting their response.
  ```
- **Storage:** Saved to localStorage as reminder
- **Display:** Shows in Notifications page when user logs back in

#### Event: Quote Accepted/Declined/Modified by Client
- **Trigger:** Client takes action on quote
- **Location:** [`src/pages/QuoteView.tsx`](src/pages/QuoteView.tsx)
- **Function:** `addResponseNotification()`
- **Persistent Notification Examples:**
  ```
  ✅ Quote #QUOTE-002 Accepted
  Client Name has accepted your quote.
  
  ❌ Quote #QUOTE-002 Declined
  Client Name has declined your quote.
  
  ⚙️  Quote #QUOTE-002 Requested Modifications
  Client Name requested modifications: "Please reduce pricing for bulk orders"
  ```
- **Storage:** Saved to localStorage under user-specific key
- **Display:** Appears in Notifications page and NotificationDropdown

#### Event: Quote Expiring Soon
- **Trigger:** Quote validity date approaching
- **Location:** [`src/pages/Notifications.tsx`](src/pages/Notifications.tsx)
- **Detection Logic:** `validUntil` date between today and 7 days from now
- **Notification Card:**
  ```
  ⏱️  MEDIUM SEVERITY
  Quote #QUOTE-001 expiring soon
  Quote for Client Name expires on Mar 15
  ```
- **Browser Display:** Shows in Notifications page with warning badge

---

### D. Receipt/Voucher Operations

#### Event: Receipt Created
- **Trigger:** User issues receipt voucher
- **Hook:** `useCreateReceipt()` from [`src/hooks/api/useReceipts.ts`](src/hooks/api/useReceipts.ts)
- **Toast Message:**
  ```
  ✅ Receipt created
  The receipt has been issued successfully.
  ```

#### Event: Receipt Updated
- **Trigger:** User modifies receipt details
- **Hook:** `useUpdateReceipt()`
- **Toast Message:**
  ```
  ✅ Receipt updated
  The receipt has been updated successfully.
  ```

#### Event: Receipt Deleted
- **Trigger:** User cancels/removes receipt
- **Hook:** `useDeleteReceipt()`
- **Toast Message:**
  ```
  ✅ Receipt deleted
  The receipt has been removed successfully.
  ```

---

### E. Expense Operations

#### Event: Expense Created
- **Trigger:** User records new business expense
- **Hook:** `useCreateExpense()` from [`src/hooks/api/useExpenses.ts`](src/hooks/api/useExpenses.ts)
- **Toast Message:**
  ```
  ✅ Expense created
  The expense has been recorded successfully.
  ```

#### Event: Expense Updated
- **Trigger:** User modifies expense category, amount, or date
- **Hook:** `useUpdateExpense()`
- **Toast Message:**
  ```
  ✅ Expense updated
  The expense has been updated successfully.
  ```

#### Event: Expense Deleted
- **Trigger:** User removes expense record
- **Hook:** `useDeleteExpense()`
- **Toast Message:**
  ```
  ✅ Expense deleted
  The expense has been removed successfully.
  ```

---

### F. Recurring/Subscription Operations

#### Event: Recurring Billing Setup Created
- **Trigger:** User configures recurring invoice
- **Hook:** `useCreateRecurring()` from [`src/hooks/api/useRecurring.ts`](src/hooks/api/useRecurring.ts)
- **Toast Message:**
  ```
  ✅ Recurring billing setup created
  Automatic invoices will be generated on schedule.
  ```

#### Event: Recurring Billing Updated
- **Trigger:** User changes frequency, amount, or client
- **Hook:** `useUpdateRecurring()`
- **Toast Message:**
  ```
  ✅ Recurring billing updated
  Schedule changes have been saved.
  ```

#### Event: Recurring Billing Deleted
- **Trigger:** User cancels subscription/recurring setup
- **Hook:** `useDeleteRecurring()`
- **Toast Message:**
  ```
  ✅ Recurring billing cancelled
  No further invoices will be generated.
  ```

#### Event: Upcoming Renewal
- **Trigger:** Profile Settings — User enables notification preference
- **Location:** [`src/pages/Profile.tsx`](src/pages/Profile.tsx) (lines 1011+)
- **User Setting:** "Upcoming renewal" toggle switch
- **Notification:** "Reminder before subscription renews"
- **When:** X days before next billing cycle (configurable)

#### Event: Renewal Successful
- **Trigger:** Profile Settings — User enables notification preference
- **User Setting:** "Renewal successful" toggle switch
- **Notification:** "Confirmation when payment goes through"
- **When:** Immediately after successful charge

#### Event: Renewal Payment Failed
- **Trigger:** Profile Settings — User enables notification preference
- **User Setting:** "Renewal payment failed" toggle switch
- **Notification:** "Alert when renewal payment fails"
- **When:** Payment attempt fails or card declines

---

### G. Authentication Events

#### Event: User Login
- **Trigger:** User enters credentials and clicks "Sign In"
- **Location:** [`src/login/login.controller.ts`](../backend/src/login/login.controller.ts)
- **Endpoints:** `POST /auth/login` or `GET /auth/google/callback`
- **Toast Message:**
  ```
  ✅ Welcome back!
  You have been logged in successfully.
  ```
- **Side Effect:** AuthContext updated, JWT token stored in localStorage

#### Event: Login Failed
- **Trigger:** Wrong password, unverified email, or network error
- **Toast Message:**
  ```
  ❌ Login failed
  Invalid email or password.
  ```
  OR
  ```
  ❌ Email not verified
  Please verify your email before logging in.
  ```

#### Event: Google OAuth
- **Trigger:** User clicks "Sign in with Google"
- **Flow:** Browser redirects to Google → Google redirects back to `/auth/google/callback`
- **Toast Message:**
  ```
  ✅ Google account linked
  You are now logged in.
  ```

---

## 3. Profile Notification Settings

### Location
[`src/pages/Profile.tsx`](src/pages/Profile.tsx) — **Notifications Tab**

### User-Configurable Preferences

#### Invoices Section
- **"Invoice due soon"** — Get notified when payment is approaching
- **"Invoice overdue"** — Alert when an invoice passes its due date

#### Quotes Section
- **"Quote sent"** — Confirmation when quote is sent to client
- **"Quote viewed"** — Alert when client opens quote
- **"Quote accepted"** — Notification when client accepts
- **"Quote expired"** — Reminder when quote validity expires

#### Receipts Section
- **"Receipt issued"** — Confirmation when receipt is generated
- **"Payment received"** — Alert when client acknowledges receipt

#### Recurring Subscriptions Section
- **"Upcoming renewal"** — Reminder before subscription renews
- **"Renewal successful"** — Confirmation when payment goes through
- **"Renewal payment failed"** — Alert when renewal payment fails
- **"Subscription upgraded/downgraded"** — Notification on plan changes

### Storage Pattern
```typescript
// Profile stores notification preferences in state
const [notifications, setNotifications] = useState({
  invoiceDueSoon: true,
  invoiceOverdue: true,
  quoteSent: true,
  quoteViewed: true,
  // ... etc
});

// When user toggles switch:
<Switch 
  checked={notifications['invoiceDueSoon']}
  onCheckedChange={(checked) => 
    setNotifications({ ...notifications, invoiceDueSoon: checked })
  }
/>
```

---

## 4. Persistent Notifications (Reminders)

### What They Are
Notifications that survive page refreshes because they're stored in browser localStorage, not just in-memory state.

### Storage Mechanism
```typescript
// Location: src/hooks/useData.ts
export function useReminders() {
  const key = user ? `fintrack_reminders_${user.id}` : 'fintrack_reminders';
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(key, []);
  
  // Methods available:
  addReminder()      // Creates new reminder
  markAsRead()       // Marks as read without deletion
  markAllAsRead()    // Marks all as read
  deleteReminder()   // Removes reminder
}
```

### When Reminders Are Created
1. **Quote View Events** → When client views or responds to quote
2. **Manual Reminders** → User can add custom reminders (future feature)
3. **System Alerts** → Overdue invoices, expiring quotes

### Example Reminder Object
```typescript
{
  id: 'uuid-12345',
  title: 'Quote #QUOTE-002 Accepted',
  message: 'Client Name has accepted your quote.',
  dueDate: '2024-03-15T10:30:00Z',
  isRead: false,
  createdAt: '2024-03-13T14:22:00Z'
}
```

---

## 5. Smart Notifications Page

### Location
[`src/pages/Notifications.tsx`](src/pages/Notifications.tsx)

### Three Notification Types Combined

#### 1. Auto-Generated: Overdue Invoices
```
Generated from: invoices where status === 'overdue'
Icon: 🔴 AlertTriangle
Severity: HIGH
Example: "Invoice #INV-001 is overdue - Payment of KD 500 from Client is past due"
```

#### 2. Auto-Generated: Expiring Quotes
```
Generated from: quotes where validUntil is within 7 days
Icon: ⏱️  Clock
Severity: MEDIUM
Example: "Quote #QUOTE-001 expiring soon - Quote for Client expires on Mar 15"
```

#### 3. Persistent: User/Custom Reminders
```
Generated from: localStorage reminders array
Icon: 🔔 Bell
Severity: LOW
Example: "Quote #QUOTE-002 Accepted - Client Name has accepted your quote"
```

### Grouping by Date
Notifications are automatically grouped by:
- **Today** — Created within last 24 hours
- **Yesterday** — Created 24-48 hours ago
- **This Week** — Created within last 7 days
- **Earlier** — Created more than 7 days ago

### Filtering
Users can filter by:
- **All** — Show all notifications
- **Unread** — Only notifications marked as unread
- **Read** — Only marked as read

### Statistics Cards
```
🔴 Overdue: Count of overdue invoices (HIGH PRIORITY)
⏱️  Expiring: Count of quotes expiring within 7 days (MEDIUM)
📋 Pending: Count of quotes awaiting client response
✨ Total: Total smart notifications count
```

---

## 6. Admin/Super Admin Notifications

### Location
[`src/components/super-admin/AdminHeader.tsx`](src/components/super-admin/AdminHeader.tsx)

### Admin-Specific Notifications
These appear in a notification dropdown in the admin header:

```typescript
// Example admin notifications
{
  id: 1,
  type: 'subscriber',
  title: 'New Pro Subscriber',
  description: 'Fatima Hassan signed up for Pro plan',
  time: '3 hours ago',
  unread: true,
},
{
  id: 2,
  type: 'payment',
  title: 'Refund Processed',
  description: 'Refund of 49 KD issued to Omar Khalid',
  time: 'Yesterday',
  unread: false,
},
{
  id: 3,
  type: 'ticket',
  title: 'Ticket Resolved',
  description: 'Ticket #TKT-892 marked as resolved',
  time: 'Yesterday',
  unread: false,
}
```

### Admin Notification Types
- **subscriber** — New user sign-ups (Plan upgrades/downgrades)
- **payment** — Refunds, chargebacks, payment issues
- **ticket** — Support ticket updates
- **invoice** — High-value invoices or payment failures

---

## 7. Error Notifications

### Pattern
Whenever an API operation fails, users get an error toast:

```typescript
onError: (error: any) => {
  toast({
    title: 'Error',
    description: error.response?.data?.message || 'Operation failed.',
    variant: 'destructive',  // Red styling
  });
}
```

### Common Error Scenarios

| Scenario | Toast Message |
|----------|---------------|
| Invoice create fails | "Failed to create invoice." + backend message |
| Network timeout | "Network error. Please check your connection." |
| Validation error | Backend message (e.g., "Email is already in use") |
| Unauthorized | "Your session has expired. Please log in again." |
| Server error | "Server error. Please try again later." |

---

## 8. Notification Delivery Flow

### Real-time Toast (Synchronous)
```
User Action → Mutation Function → onSuccess/onError → toast() → UI Update
                      ↓
            Toast appears for ~1 second
            Auto-dismisses or user clicks X
```

### Persistent Reminder (Asynchronous)
```
User/System Event → addReminder() → localStorage → Page Refresh
                         ↓
        Data persists across sessions
        User sees reminder in Notifications page
        Can mark as read or delete
```

### Smart Alert (Computed)
```
Page Load → Read invoices/quotes → Filter for conditions → Display in Notifications
     ↓
Overdue? → Mark as 'overdue' severity
Expiring? → Mark as 'expiring' severity
     ↓
Combine with localStorage reminders → Show unified notification list
```

---

## 9. Implementation Checklist for New Features

If you want to add a notification for a new event:

### Step 1: Create Mutation Hook
```typescript
// src/hooks/api/useNewFeature.ts
export function useCreateNewThing() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data) => NewThingService.create(data),
    onSuccess: () => {
      toast({
        title: '✅ Success Title',
        description: 'Success description',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error',
        description: error.response?.data?.message || 'Failed to create',
        variant: 'destructive',
      });
    },
  });
}
```

### Step 2: Use in Component
```typescript
import { useCreateNewThing } from '@/hooks/api/useNewFeature';

export function MyComponent() {
  const { mutate: createThing } = useCreateNewThing();
  
  const handleSubmit = (data) => {
    createThing(data); // Toast auto-shows on success/error
  };
}
```

### Step 3: For Persistent Reminders
```typescript
const { addReminder } = useReminders();

addReminder({
  title: 'Event Title',
  message: 'Event description',
  dueDate: new Date().toISOString(),
});
```

### Step 4: For Smart Auto-Alerts
```typescript
// In src/pages/Notifications.tsx, add filter logic:
const myCustomAlerts = data.filter(item => /* condition */);
const smartNotifications = [
  ...myCustomAlerts.map(alert => ({
    id: `custom-${alert.id}`,
    type: 'custom',
    title: alert.title,
    severity: 'high' | 'medium' | 'low',
    // ...
  })),
];
```

---

## 10. Notification Summary Table

| Event | Origin | Type | Persist? | User Control | Status |
|-------|--------|------|----------|--------------|--------|
| Invoice Created | Form Submit | Toast | ❌ | N/A | ✅ Active |
| Invoice Updated | Form Submit | Toast | ❌ | N/A | ✅ Active |
| Invoice Overdue | Auto (Date-based) | Smart Alert | ✅ | ✅ Settings | ✅ Active |
| Quote Created | Form Submit | Toast | ❌ | N/A | ✅ Active |
| Quote Sent | Action Button | Toast | ❌ | N/A | ✅ Active |
| Quote Viewed | Client Action | Reminder | ✅ | N/A | ✅ Active |
| Quote Accepted | Client Action | Reminder | ✅ | ✅ Settings | ✅ Active |
| Quote Expiring | Auto (Date-based) | Smart Alert | ✅ | ✅ Settings | ✅ Active |
| Receipt Created | Form Submit | Toast | ❌ | N/A | ✅ Active |
| Expense Created | Form Submit | Toast | ❌ | N/A | ✅ Active |
| Renewal Upcoming | Auto (Date-based) | Smart Alert | ✅ | ✅ Settings | ✅ Active |
| Renewal Failed | Auto (API Response) | Smart Alert | ✅ | ✅ Settings | ✅ Active |
| Login Success | API Response | Toast | ❌ | N/A | ✅ Active |
| Google OAuth | API Response | Toast | ❌ | N/A | ✅ Active |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [`src/hooks/use-toast.ts`](src/hooks/use-toast.ts) | Toast system (React Context) |
| [`src/pages/Notifications.tsx`](src/pages/Notifications.tsx) | Notifications page with smart alerts |
| [`src/pages/Profile.tsx`](src/pages/Profile.tsx) | User notification settings |
| [`src/hooks/useData.ts`](src/hooks/useData.ts) | `useReminders()` hook |
| [`src/hooks/api/useInvoices.ts`](src/hooks/api/useInvoices.ts) | Mutation hooks with toast |
| [`src/hooks/api/useClients.ts`](src/hooks/api/useClients.ts) | Client mutations with toast |
| [`src/hooks/api/useQuotes.ts`](src/hooks/api/useQuotes.ts) | Quote mutations with toast |
| [`src/hooks/api/useReceipts.ts`](src/hooks/api/useReceipts.ts) | Receipt mutations with toast |
| [`src/hooks/api/useExpenses.ts`](src/hooks/api/useExpenses.ts) | Expense mutations with toast |
| [`src/hooks/api/useRecurring.ts`](src/hooks/api/useRecurring.ts) | Recurring mutations with toast |
| [`src/components/layout/DashboardLayout.tsx`](src/components/layout/DashboardLayout.tsx) | Header with NotificationDropdown |
| [`src/components/super-admin/AdminHeader.tsx`](src/components/super-admin/AdminHeader.tsx) | Admin-specific notifications |
| [`src/pages/QuoteView.tsx`](src/pages/QuoteView.tsx) | Quote view events (with reminders) |

---

## How Users Experience Notifications

### Normal User Flow
1. **Creates Invoice** → Toast appears: "Invoice created ✅"
2. **Navigates to Notifications** → Sees all alerts and reminders
3. **Invoice Becomes Overdue** → Smart alert shows: "Invoice overdue 🔴"
4. **Receives Email Setting** → Can toggle preferences in Profile → Notifications tab

### Admin Flow
1. **Admin Dashboard loads** → Admin header shows notification bell with count
2. **New subscriber signs up** → Admin notification appears: "New Pro Subscriber"
3. **Payment fails** → Red notification: "Refund Processed"
4. **Admin clicks bell** → Dropdown shows last 5 notifications
5. **Admin clicks "View all"** → Goes to detailed Notifications page

### Quote Client Flow
1. **Receives Quote Email** → Opens quote link
2. **Vendor sees notification** → "Quote #QUOTE-002 Viewed ✅"
3. **Client accepts quote** → Vendor gets persistent reminder: "Quote Accepted ✅"
4. **Quote reminder persists** → Even after page reload/logout

---

## Testing the Notification System

### Test Toast Notifications
```
1. Create new invoice → Check for green toast
2. Try creating with invalid data → Check for red error toast
3. Delete anything → Verify toast appears
```

### Test Smart Alerts
```
1. Set invoice due date to today → Should appear as overdue in Notifications
2. Create quote with valid date 5 days away → Should appear as expiring
3. Mark as read → Should disappear from unread filter
```

### Test Reminders
```
1. Open DEVTOOLS > Application > localStorage
2. Look for 'fintrack_reminders_[user_id]' → Check JSON format
3. Add reminder via code → Refresh page → Should still appear
4. Delete reminder → Refresh → Should be gone
```

### Test Settings
```
1. Go to Profile → Notifications tab
2. Toggle "Invoice overdue" off
3. Create overdue invoice → Notification still shows (settings not yet synced to backend)
```

---

## Future Enhancement Opportunities

1. **Backend Persistence** — Move notification settings from localStorage to database
2. **Email Notifications** — Send actual emails for critical alerts (overdue, payment failed)
3. **Push Notifications** — Browser push notifications + mobile app push
4. **SMS Alerts** — Text message for urgent reminders (overdue by X days)
5. **Webhook Integration** — Allow clients to receive notifications via webhooks
6. **In-App Chat** — Real-time chat within notification context
7. **Notification Analytics** — Track which notifications users engage with
8. **Scheduled Reminders** — Set custom reminder times (e.g., "remind me at 9 AM daily")

