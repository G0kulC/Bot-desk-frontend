import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { CLIENT } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, server } from "@/test/server";

import { TestBotTab } from "./TestBotTab";

describe("TestBotTab", () => {
  it("shows lead and handoff chips from the reply", async () => {
    let sent: { message?: string; history?: unknown[] } = {};
    server.use(
      http.post(`${API}/clients/c1/test-chat`, async ({ request }) => {
        sent = (await request.json()) as typeof sent;
        return HttpResponse.json({
          reply: "Sorry to hear that. The team will call you.",
          language: "Tanglish",
          lead: { name: "Ravi", phone: "", need: "cleaning", when: "Saturday" },
          handoff: true,
          handoff_reason: "tooth pain",
          model: "primary/model",
          tokens_in: 900,
          tokens_out: 40,
          cost_inr: "0.0088",
          guardrail_notes: ["trimmed_to_60_words"],
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<TestBotTab client={CLIENT} />);

    await user.click(screen.getByRole("button", { name: "What is the price for teeth cleaning?" }));

    expect(await screen.findByText("Sorry to hear that. The team will call you.")).toBeInTheDocument();
    expect(screen.getByText("Lead captured: Ravi · cleaning · Saturday")).toBeInTheDocument();
    expect(screen.getByText("Handed to owner: tooth pain")).toBeInTheDocument();
    expect(screen.getByText("Tanglish")).toBeInTheDocument();
    expect(screen.getByText("trimmed_to_60_words")).toBeInTheDocument();
    expect(screen.getByText("₹0.0088")).toBeInTheDocument();
    expect(sent.message).toBe("What is the price for teeth cleaning?");
    expect(sent.history).toEqual([]);
  });
});
