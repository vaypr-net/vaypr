import { useEffect, useState } from "react";
import { Subscriber } from "@/api/services/subscriber.service";
import {
  useDeleteSubscriber,
  useSubscriberDeletionPreview,
} from "@/hooks/api/useSubscribers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function RecordCounts({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0);
  return entries.length ? (
    <ul className="space-y-1">
      {entries.map(([label, count]) => (
        <li key={label} className="flex justify-between gap-4">
          <span>{label}</span>
          <strong>{count}</strong>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-muted-foreground">No records found.</p>
  );
}

export function DeleteSubscriberDialog({
  subscriber,
  onClose,
}: {
  subscriber: Subscriber;
  onClose: () => void;
}) {
  const {
    data: preview,
    isFetching,
    isError,
  } = useSubscriberDeletionPreview(subscriber._id);
  const mutation = useDeleteSubscriber();
  const [confirming, setConfirming] = useState(false);
  const [reviewedToken, setReviewedToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phrase, setPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [irreversible, setIrreversible] = useState(false);
  const [retention, setRetention] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!preview) return;
    const remaining = new Date(preview.expiresAt).getTime() - Date.now();
    setExpired(remaining <= 0);
    const timer = setTimeout(() => setExpired(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [preview?.expiresAt]);
  const ready =
    preview?.subscriberId === subscriber._id &&
    preview.canDelete &&
    !!preview.previewToken &&
    !isFetching &&
    !isError &&
    !expired;
  const disabled =
    !ready ||
    reviewedToken !== preview?.previewToken ||
    mutation.isPending ||
    email.trim().toLowerCase() !== preview?.email.toLowerCase() ||
    phrase !== "DELETE" ||
    reason.trim().length < 3 ||
    !irreversible ||
    !retention;
  const submit = async () => {
    if (disabled || !preview?.previewToken) return;
    try {
      await mutation.mutateAsync({
        id: subscriber._id,
        data: {
          previewToken: preview.previewToken,
          confirmEmail: email.trim(),
          confirmation: phrase,
          reason: reason.trim(),
          acknowledgeIrreversible: irreversible,
          acknowledgeRetention: retention,
        },
      });
      onClose();
    } catch {
      /* Keep the reviewed account and confirmations visible after failure. */
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete Subscriber Permanently</DialogTitle>
          <DialogDescription>
            {preview?.name || subscriber.name} ·{" "}
            {preview?.email || subscriber.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive font-medium">
            This permanently removes the account and its workspace data. It
            cannot be restored.
          </p>
          {isFetching && (
            <p role="status">Checking account and record counts…</p>
          )}
          {isError && (
            <p role="alert" className="text-destructive">
              Unable to load the deletion preview. Close this dialog and try
              again.
            </p>
          )}
          {expired && (
            <p role="alert" className="text-destructive">
              This preview expired. Close this dialog and review deletion again.
            </p>
          )}
          {confirming && reviewedToken !== preview?.previewToken && (
            <p role="alert" className="text-destructive">
              The preview changed. Go back to review the current record counts.
            </p>
          )}
          {!!preview?.blockers.length && (
            <div role="alert" className="rounded-lg border p-3">
              <strong>Deletion is blocked</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {preview.blockers.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          {!confirming && preview && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3 space-y-2">
                  <h3 className="font-semibold">Permanently removed</h3>
                  <RecordCounts counts={preview.deletedCounts} />
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <h3 className="font-semibold">Retained for reconciliation</h3>
                  <RecordCounts counts={preview.retainedCounts} />
                  <p>Deletion audit: 1</p>
                </div>
              </div>
              <p>
                Removed data includes login credentials, saved login sessions,
                profile, clients, invoices, quotes, receipts, recurring
                invoices, expenses, local email settings, notifications and
                support tickets. Export anything you need first.
              </p>
              <p>
                VAYPR subscription payment records retain the original
                subscriber ID, name, email, amounts, currency, dates, statuses
                and provider references. Hesabe orders, referral/commission
                records and the administrative audit remain available in
                Deletion History.
              </p>
              <p>
                Deletion does not issue a refund or cancel anything at a payment
                provider.
              </p>
              <p className="text-muted-foreground">
                Previously exported or shared copies, backups and externally
                hosted uploads or provider data are not purged by this action.
              </p>
            </>
          )}
          {confirming && preview && (
            <>
              <p>
                Review complete. Confirm deletion of{" "}
                <strong>{preview.email}</strong>. Existing login tokens will
                stop working. Payment records and the deletion audit remain.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-email">Type the subscriber email</Label>
                <Input
                  id="delete-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="off"
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-phrase">Type DELETE</Label>
                <Input
                  id="delete-phrase"
                  value={phrase}
                  onChange={(event) => setPhrase(event.target.value)}
                  autoComplete="off"
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-reason">
                  Deletion reason (required)
                </Label>
                <Textarea
                  id="delete-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  disabled={mutation.isPending}
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="delete-irreversible"
                  checked={irreversible}
                  onCheckedChange={(value) => setIrreversible(value === true)}
                  disabled={mutation.isPending}
                />
                <Label htmlFor="delete-irreversible" className="leading-normal">
                  I understand the account and workspace data cannot be
                  restored.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="delete-retention"
                  checked={retention}
                  onCheckedChange={(value) => setRetention(value === true)}
                  disabled={mutation.isPending}
                />
                <Label htmlFor="delete-retention" className="leading-normal">
                  I understand payment records and audit identity are retained,
                  and no refund or provider cancellation will occur.
                </Label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Keep Subscriber
          </Button>
          {confirming ? (
            <>
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={mutation.isPending}
              >
                Back to Review
              </Button>
              <Button
                variant="destructive"
                onClick={submit}
                disabled={disabled}
              >
                {mutation.isPending ? "Deleting…" : "Delete Permanently"}
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                setReviewedToken(preview!.previewToken);
                setConfirming(true);
              }}
              disabled={!ready}
            >
              Continue to Confirmation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
