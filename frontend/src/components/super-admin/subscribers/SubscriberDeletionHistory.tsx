import { useState } from "react";
import {
  useSubscriberDeletionHistory,
  useRetainedSubscriberPayments,
} from "@/hooks/api/useSubscribers";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RecordCounts } from "./DeleteSubscriberDialog";
import { accessDate } from "./SubscriberManagementDialog";

const recordDate = (value?: string) =>
  value && Number.isFinite(new Date(value).getTime())
    ? accessDate(value)
    : "Date not recorded";

export function SubscriberDeletionHistory({
  onClose,
}: {
  onClose: () => void;
}) {
  const {
    data: records,
    isLoading,
    isError,
  } = useSubscriberDeletionHistory(true);
  const [selected, setSelected] = useState("");
  const payments = useRetainedSubscriberPayments(selected);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Deletion History</SheetTitle>
          <SheetDescription>
            Read-only audit and retained payment records. Latest 100 deleted
            accounts.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4 text-sm">
          {isLoading && <p>Loading deletion history…</p>}
          {isError && <p role="alert">Unable to load deletion history.</p>}
          {records?.length === 0 && (
            <p>No subscribers have been permanently deleted.</p>
          )}
          {records?.map((record) => (
            <article
              key={record.subscriberId}
              className="rounded-lg border p-4 space-y-3"
            >
              <div>
                <strong>{record.subscriberName}</strong>
                <p>{record.subscriberEmail}</p>
                <p className="text-muted-foreground">
                  Deleted {accessDate(record.deletedAt)} · {record.actorEmail}
                </p>
              </div>
              <p>Reason: {record.reason}</p>
              <details>
                <summary className="cursor-pointer">
                  Removed and retained records
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Removed</h3>
                    <RecordCounts counts={record.deletedCounts} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Retained</h3>
                    <RecordCounts counts={record.retainedCounts} />
                  </div>
                </div>
              </details>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((current) =>
                    current === record.subscriberId ? "" : record.subscriberId,
                  )
                }
              >
                {selected === record.subscriberId
                  ? "Hide payment records"
                  : "View retained payment records"}
              </Button>
              {selected === record.subscriberId && (
                <div className="space-y-3">
                  {payments.isLoading && <p>Loading payment records…</p>}
                  {payments.isError && (
                    <p role="alert">Unable to load payment records.</p>
                  )}
                  {payments.data && (
                    <>
                      <p className="text-muted-foreground">
                        Up to 100 records from each ledger. Amounts use their
                        original currency. Sandbox records remain test payments.
                      </p>
                      <h3 className="font-semibold">Payment transactions</h3>
                      {!payments.data.transactions.length && (
                        <p>No payment transactions.</p>
                      )}
                      {payments.data.transactions.map((payment) => (
                        <div
                          key={payment.transactionId}
                          className="rounded border p-3 break-words"
                        >
                          <strong>
                            {Number(payment.amount).toFixed(3)}{" "}
                            {payment.currency} · {payment.status}
                          </strong>
                          <p>
                            {payment.provider} · {payment.type}
                            {payment.isSandbox ? " · Sandbox test payment" : ""}
                          </p>
                          <p>{payment.transactionId}</p>
                          <p>{recordDate(payment.transactionDate)}</p>
                          {payment.needsManualReconciliation && (
                            <p className="text-destructive">
                              Manual reconciliation required: payment verified
                              after account deletion.
                            </p>
                          )}
                        </div>
                      ))}
                      <h3 className="font-semibold">Hesabe orders</h3>
                      {!payments.data.orders.length && <p>No Hesabe orders.</p>}
                      {payments.data.orders.map((order) => (
                        <div
                          key={order.reference}
                          className="rounded border p-3 break-words"
                        >
                          <strong>
                            {(order.amountFils / 1000).toFixed(3)}{" "}
                            {order.currency} · {order.state}
                          </strong>
                          <p>
                            {order.reference} · {order.environment}
                          </p>
                          {order.needsManualReconciliation && (
                            <p className="text-destructive">
                              Manual reconciliation required.
                            </p>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
