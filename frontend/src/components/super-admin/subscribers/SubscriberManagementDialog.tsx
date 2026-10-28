import { useEffect, useState } from "react";
import {
  Subscriber,
  SubscriberAction,
} from "@/api/services/subscriber.service";
import {
  useGetSubscriberById,
  useManageSubscriber,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const accessDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kuwait",
      }).format(new Date(value)) + " (Kuwait)"
    : "No end date recorded";

export const hasPaidAccess = (subscriber: Subscriber) =>
  subscriber.plan !== "Free" &&
  subscriber.status === "active" &&
  (!subscriber.nextRenewalDate ||
    new Date(subscriber.nextRenewalDate) > new Date());

export function SubscriberManagementDialog({
  subscriber,
  action,
  onClose,
}: {
  subscriber: Subscriber | null;
  action: SubscriberAction | null;
  onClose: () => void;
}) {
  const {
    data: fresh,
    isFetching,
    isError,
  } = useGetSubscriberById(subscriber?._id || "");
  const current = fresh || subscriber;
  const mutation = useManageSubscriber();
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"immediately" | "period_end">("period_end");
  const canSchedule =
    !!current?.nextRenewalDate &&
    new Date(current.nextRenewalDate) > new Date();
  useEffect(() => {
    setReason("");
    setEmail("");
    setMode(
      subscriber?.nextRenewalDate &&
        new Date(subscriber.nextRenewalDate) > new Date()
        ? "period_end"
        : "immediately",
    );
  }, [subscriber?._id, action]);
  if (!current || !action) return null;
  const title = {
    archive: "Archive Subscriber",
    restore: "Restore Subscriber",
    end_paid_access: "End Paid Access",
    undo_scheduled_end: "Undo Scheduled Change",
  }[action];
  const ending = action === "end_paid_access";
  const immediate = ending && mode === "immediately";
  const disabled =
    mutation.isPending ||
    isFetching ||
    isError ||
    !current.version ||
    reason.trim().length < 3 ||
    (ending && !hasPaidAccess(current)) ||
    (immediate && email.trim().toLowerCase() !== current.email.toLowerCase()) ||
    (ending &&
      mode === "period_end" &&
      (!canSchedule || !!current.paidAccessEndsAt));
  const submit = async () => {
    try {
      await mutation.mutateAsync({
        id: current._id,
        data: {
          action,
          reason: reason.trim(),
          expectedUpdatedAt: current.version!,
          ...(ending ? { mode } : {}),
        },
      });
      onClose();
    } catch {
      /* The mutation shows the server error; keep the dialog open. */
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {current.name} · {current.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {isError && (
            <p className="text-destructive">
              Unable to refresh this subscriber. Close this dialog and try
              again.
            </p>
          )}
          <div className="rounded-lg border p-3 space-y-1">
            <p>
              Current plan: <strong>{current.plan}</strong> · {current.status}
            </p>
            <p>Paid period ends: {accessDate(current.nextRenewalDate)}</p>
          </div>
          {action === "archive" && (
            <div className="space-y-2">
              <p>
                Hide this subscriber from the default list. Their account,
                documents and payment history are preserved.
              </p>
              <p>Login and paid access stay unchanged.</p>
              {hasPaidAccess(current) && (
                <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
                  This subscriber still has paid access
                  {current.nextRenewalDate
                    ? ` until ${accessDate(current.nextRenewalDate)}`
                    : ""}
                  . Use End Paid Access separately to change it.
                </p>
              )}
            </div>
          )}
          {action === "restore" && (
            <p>
              Return this subscriber to the main list. Their current access and
              expiry date stay unchanged; expired or ended paid access will not
              be reactivated.
            </p>
          )}
          {ending && (
            <>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as typeof mode)}
                className="space-y-3"
                aria-label="When paid access ends"
              >
                <div className="flex gap-3 rounded-lg border p-3">
                  <RadioGroupItem
                    id="end-period"
                    value="period_end"
                    disabled={!canSchedule || !!current.paidAccessEndsAt}
                  />
                  <Label
                    htmlFor="end-period"
                    className="space-y-1 leading-normal"
                  >
                    <span>At the end of the paid period</span>
                    <span className="block font-normal text-muted-foreground">
                      Keep premium access until{" "}
                      {accessDate(current.nextRenewalDate)}, then move to Free.
                    </span>
                  </Label>
                </div>
                <div className="flex gap-3 rounded-lg border p-3">
                  <RadioGroupItem id="end-now" value="immediately" />
                  <Label htmlFor="end-now" className="space-y-1 leading-normal">
                    <span>Immediately</span>
                    <span className="block font-normal text-muted-foreground">
                      Move to Free access now. Keep the account and existing
                      documents.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
              {current.paidAccessEndsAt && (
                <p>
                  Already scheduled for {accessDate(current.paidAccessEndsAt)}.
                  You can still end access immediately.
                </p>
              )}
              <p className="text-muted-foreground">
                Hesabe fixed-term payments renew manually. This action controls
                app access.
              </p>
              {immediate && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-subscriber-email">
                    Type {current.email} to confirm immediate removal of paid
                    access
                  </Label>
                  <Input
                    id="confirm-subscriber-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
            </>
          )}
          {action === "undo_scheduled_end" && (
            <p>
              Remove the scheduled change for{" "}
              {accessDate(current.paidAccessEndsAt)}. The paid period keeps its
              existing expiry date. This does not extend or renew the term.
            </p>
          )}
          <p className="text-muted-foreground">
            Payment records remain unchanged. Refunds are managed separately.
          </p>
          <div className="space-y-2">
            <Label htmlFor="subscriber-action-reason">Reason (required)</Label>
            <Textarea
              id="subscriber-action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Explain this administrative change…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Keep Unchanged
          </Button>
          <Button
            variant={immediate ? "destructive" : "default"}
            disabled={disabled}
            onClick={submit}
          >
            {mutation.isPending ? "Saving…" : title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
