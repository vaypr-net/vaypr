import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Subscriber } from "@/api/services/subscriber.service";
import { SubscriberManagementDialog } from "./SubscriberManagementDialog";
import { EditSubscriberDialog } from "./EditSubscriberDialog";

const mocks = vi.hoisted(() => ({ manage: vi.fn(), update: vi.fn() }));
vi.mock("@/hooks/api/useSubscribers", () => ({
  useGetSubscriberById: () => ({ data: undefined, isFetching: false }),
  useManageSubscriber: () => ({ mutateAsync: mocks.manage, isPending: false }),
  useUpdateSubscriber: () => ({ mutateAsync: mocks.update, isPending: false }),
}));
vi.mock("@/hooks/api/useBillingPlans", () => ({
  useGetPlans: () => ({
    data: {
      items: [
        { name: "Free", price: 0 },
        { name: "Business", price: 20 },
      ],
    },
  }),
}));

const subscriber = {
  _id: "subscriber-1",
  version: "2026-10-28T12:00:00.000Z",
  name: "QA Subscriber",
  email: "qa@example.invalid",
  plan: "Business",
  status: "active",
  paymentProvider: "hesabe",
  nextRenewalDate: "2099-11-28T12:00:00Z",
} as Subscriber;

describe("Subscriber management confirmations", () => {
  beforeEach(() => {
    mocks.manage.mockReset().mockResolvedValue({});
    mocks.update.mockReset().mockResolvedValue({});
  });
  afterEach(cleanup);
  it("archives visibility only, with a reason and an explicit paid-access warning", async () => {
    render(
      <SubscriberManagementDialog
        subscriber={subscriber}
        action="archive"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Login and paid access stay unchanged/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This subscriber still has paid access/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Archive Subscriber" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason (required)"), {
      target: { value: "Duplicate test account" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Archive Subscriber" }));
    await waitFor(() =>
      expect(mocks.manage).toHaveBeenCalledWith({
        id: subscriber._id,
        data: {
          action: "archive",
          reason: "Duplicate test account",
          expectedUpdatedAt: subscriber.version,
        },
      }),
    );
  });
  it("defaults to keeping the paid term and submits an explicit period-end change", async () => {
    render(
      <SubscriberManagementDialog
        subscriber={subscriber}
        action="end_paid_access"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("radio", { name: /At the end of the paid period/ }),
    ).toBeChecked();
    fireEvent.change(screen.getByLabelText("Reason (required)"), {
      target: { value: "Finish current term" },
    });
    fireEvent.click(screen.getByRole("button", { name: "End Paid Access" }));
    await waitFor(() =>
      expect(mocks.manage).toHaveBeenCalledWith({
        id: subscriber._id,
        data: {
          action: "end_paid_access",
          expectedUpdatedAt: subscriber.version,
          mode: "period_end",
          reason: "Finish current term",
        },
      }),
    );
  });
  it("requires the exact subscriber email before immediately ending paid access", async () => {
    render(
      <SubscriberManagementDialog
        subscriber={subscriber}
        action="end_paid_access"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /Immediately/ }));
    fireEvent.change(screen.getByLabelText("Reason (required)"), {
      target: { value: "Approved access change" },
    });
    const button = screen.getByRole("button", { name: "End Paid Access" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Type qa@example.invalid/), {
      target: { value: "wrong@example.invalid" },
    });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Type qa@example.invalid/), {
      target: { value: subscriber.email },
    });
    fireEvent.click(button);
    await waitFor(() =>
      expect(mocks.manage).toHaveBeenCalledWith({
        id: subscriber._id,
        data: {
          action: "end_paid_access",
          expectedUpdatedAt: subscriber.version,
          mode: "immediately",
          reason: "Approved access change",
        },
      }),
    );
  });
  it("explains that restoring an expired subscriber does not restore paid access", () => {
    render(
      <SubscriberManagementDialog
        subscriber={{
          ...subscriber,
          status: "canceled",
          plan: "Free",
          archivedAt: "2026-10-28T12:00:00Z",
        }}
        action="restore"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/expired or ended paid access will not be reactivated/),
    ).toBeInTheDocument();
  });
  it("saving a canceled subscriber profile does not send a plan or active status", async () => {
    render(
      <EditSubscriberDialog
        subscriber={{ ...subscriber, status: "canceled", plan: "Free" }}
        open
        onOpenChange={vi.fn()}
        onEndPaidAccess={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        id: subscriber._id,
        data: { name: subscriber.name, email: subscriber.email },
      }),
    );
  });
});
