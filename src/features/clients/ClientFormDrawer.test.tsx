import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";
import { renderWithProviders } from "@/test/render";

import { datesForStatus } from "./clientForm";
import { ClientFormDrawer } from "./ClientFormDrawer";

const CONFIG = {
  default_provider: "own",
  ai_model: "m",
  ai_fallback_model: "f",
  packages: {
    starter: { setup: "3999.00", monthly: "1999.00", includes: [] },
    business: { setup: "7999.00", monthly: "3999.00", includes: [] },
    growth: { setup: "12999.00", monthly: "6999.00", includes: [] },
  },
  languages: [],
  niches: [],
  trial_days: 7,
  app_version: "0.1.0",
};

function setup() {
  server.use(http.get(`${API}/config`, () => HttpResponse.json(CONFIG)));
  renderWithProviders(<ClientFormDrawer open onClose={() => {}} />);
}

describe("ClientFormDrawer", () => {
  it("package cards fill in the fees, which stay editable", async () => {
    const user = userEvent.setup();
    setup();
    const setup_ = screen.getByLabelText("Setup fee (₹)") as HTMLInputElement;
    const monthly = screen.getByLabelText("Monthly fee (₹)") as HTMLInputElement;
    await user.click(screen.getByRole("radio", { name: /Business/ }));
    expect(setup_.value).toBe("7999");
    expect(monthly.value).toBe("3999");
    await user.click(screen.getByRole("radio", { name: /Growth/ }));
    expect(monthly.value).toBe("6999");
    await user.clear(monthly);
    await user.type(monthly, "5500");
    expect(monthly.value).toBe("5500");
  });

  it("status trial/live fills the dates with today", async () => {
    const user = userEvent.setup();
    setup();
    const trial = screen.getByLabelText(/Trial start/) as HTMLInputElement;
    const live = screen.getByLabelText(/Go-live date/) as HTMLInputElement;
    expect(trial.value).toBe("");
    await user.selectOptions(screen.getByLabelText("Status"), "trial");
    expect(trial.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await user.selectOptions(screen.getByLabelText("Status"), "live");
    expect(live.value).toBe(trial.value);
  });

  it("does not overwrite dates that are already set", () => {
    expect(datesForStatus("trial", { trial_start: "2026-01-01", live_date: "" }, "2026-09-27")).toEqual({});
    expect(datesForStatus("live", { trial_start: "", live_date: "" }, "2026-09-27")).toEqual({
      live_date: "2026-09-27",
    });
  });

  it("validates the owner's WhatsApp number", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("Business name"), "Glow Studio");
    await user.type(screen.getByLabelText(/Owner WhatsApp/), "12345");
    await user.click(screen.getByRole("button", { name: "Add client" }));
    expect(await screen.findByText(/Enter a valid WhatsApp number/)).toBeInTheDocument();

    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/clients`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: "c1", ...body }, { status: 201 });
      }),
    );
    await user.clear(screen.getByLabelText(/Owner WhatsApp/));
    await user.type(screen.getByLabelText(/Owner WhatsApp/), "98400 12345");
    await user.click(screen.getByRole("button", { name: "Add client" }));
    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.owner_phone).toBe("+919840012345");
  });
});
