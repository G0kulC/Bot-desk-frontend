import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { CLIENT } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, server } from "@/test/server";

import { monthlyPrefill, setupPrefill } from "./paymentForm";
import { PaymentsPage } from "./PaymentsPage";

const RENEWAL = {
  client_id: "c1",
  client_name: "Smile Care Dental",
  package: "business",
  setup_fee: "7999.00",
  amount: "3999.00",
  due_date: "2026-08-15",
  status: "overdue",
  setup_paid: false,
  period_month: "2026-08-01",
};

describe("payment prefill", () => {
  it("monthly and setup prefills", () => {
    expect(monthlyPrefill(RENEWAL)).toEqual({
      client_id: "c1",
      type: "monthly",
      for_month: "2026-08",
      amount: "3999",
    });
    expect(setupPrefill(RENEWAL)).toEqual({ client_id: "c1", type: "setup", amount: "7999" });
  });

  it("'Mark paid' opens the drawer with the right client, month and amount", async () => {
    server.use(
      http.get(`${API}/billing/renewals`, () => HttpResponse.json([RENEWAL])),
      http.get(`${API}/payments`, () => HttpResponse.json([])),
      http.get(`${API}/clients`, () =>
        HttpResponse.json({ items: [CLIENT], total: 1, page: 1, page_size: 200 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<PaymentsPage />);

    // Desktop table and mobile cards both render in jsdom; use the first button.
    const [markPaid] = await screen.findAllByRole("button", { name: "Mark paid" });
    await user.click(markPaid);

    const dialog = await screen.findByRole("dialog", { name: "Record payment" });
    const d = within(dialog);
    expect((d.getByLabelText("Client") as HTMLSelectElement).value).toBe("c1");
    expect((d.getByLabelText("Type") as HTMLSelectElement).value).toBe("monthly");
    expect((d.getByLabelText("For month") as HTMLInputElement).value).toBe("2026-08");
    expect((d.getByLabelText("Amount (₹)") as HTMLInputElement).value).toBe("3999");
  });
});
