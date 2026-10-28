import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { DeleteSubscriberDialog } from "./DeleteSubscriberDialog";
import {
  Subscriber,
  SubscriberDeletionPreview,
} from "@/api/services/subscriber.service";

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  preview: null as SubscriberDeletionPreview | null,
  isError: false,
  isFetching: false,
}));
vi.mock("@/hooks/api/useSubscribers", () => ({
  useSubscriberDeletionPreview: () => ({
    data: mocks.preview,
    isFetching: mocks.isFetching,
    isError: mocks.isError,
  }),
  useDeleteSubscriber: () => ({ mutateAsync: mocks.remove, isPending: false }),
}));
const subscriber = {
  _id: "a".repeat(24),
  name: "Deletion QA",
  email: "delete.qa@example.invalid",
} as Subscriber;
describe("Restricted permanent deletion confirmation", () => {
  beforeEach(() => {
    mocks.remove.mockReset().mockResolvedValue({});
    mocks.isError = false;
    mocks.isFetching = false;
    mocks.preview = {
      subscriberId: subscriber._id,
      name: subscriber.name,
      email: subscriber.email,
      canDelete: true,
      blockers: [],
      deletedCounts: { Account: 1, Invoices: 2 },
      retainedCounts: { "Hesabe sandbox transactions": 1 },
      previewToken: "test-preview-token",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    };
  });
  afterEach(cleanup);
  it("shows removed and retained counts before exposing the final action", () => {
    render(
      <DeleteSubscriberDialog subscriber={subscriber} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Permanently removed")).toBeInTheDocument();
    expect(screen.getByText("Hesabe sandbox transactions")).toBeInTheDocument();
    expect(screen.getByText(/not purged by this action/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Permanently" }),
    ).not.toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("requires the email, DELETE, reason and both acknowledgements", async () => {
    const close = vi.fn();
    render(<DeleteSubscriberDialog subscriber={subscriber} onClose={close} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to Confirmation" }),
    );
    const button = screen.getByRole("button", { name: "Delete Permanently" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type the subscriber email"), {
      target: { value: "wrong@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Type DELETE"), {
      target: { value: "DELETE" },
    });
    fireEvent.change(screen.getByLabelText("Deletion reason (required)"), {
      target: { value: "Approved account deletion" },
    });
    fireEvent.click(
      screen.getByLabelText(/account and workspace data cannot be restored/),
    );
    fireEvent.click(
      screen.getByLabelText(/payment records and audit identity are retained/),
    );
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type the subscriber email"), {
      target: { value: subscriber.email },
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() =>
      expect(mocks.remove).toHaveBeenCalledWith({
        id: subscriber._id,
        data: {
          previewToken: "test-preview-token",
          confirmEmail: subscriber.email,
          confirmation: "DELETE",
          reason: "Approved account deletion",
          acknowledgeIrreversible: true,
          acknowledgeRetention: true,
        },
      }),
    );
    expect(close).toHaveBeenCalled();
  });
  it("shows server-side blockers and prevents proceeding", () => {
    mocks.preview = {
      ...mocks.preview!,
      canDelete: false,
      previewToken: null,
      blockers: ["End paid access before deleting this account."],
    };
    render(
      <DeleteSubscriberDialog subscriber={subscriber} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("End paid access");
    expect(
      screen.getByRole("button", { name: "Continue to Confirmation" }),
    ).toBeDisabled();
  });
  it.each(["error", "loading", "expired", "wrong account"])(
    "cannot proceed with an %s preview",
    (state) => {
      if (state === "error") mocks.isError = true;
      if (state === "loading") mocks.isFetching = true;
      if (state === "expired")
        mocks.preview!.expiresAt = new Date(Date.now() - 1).toISOString();
      if (state === "wrong account")
        mocks.preview!.subscriberId = "b".repeat(24);
      render(
        <DeleteSubscriberDialog subscriber={subscriber} onClose={vi.fn()} />,
      );
      expect(
        screen.getByRole("button", { name: "Continue to Confirmation" }),
      ).toBeDisabled();
    },
  );
  it("Keep Subscriber exits without making a deletion request", () => {
    const close = vi.fn();
    render(<DeleteSubscriberDialog subscriber={subscriber} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep Subscriber" }));
    expect(close).toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
