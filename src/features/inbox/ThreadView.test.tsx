import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";
import { API, server } from "@/test/server";

import { canReply } from "./replyWindow";
import { ThreadView } from "./ThreadView";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function contact(lastInboundHoursAgo: number) {
  return {
    id: "ct1",
    client_id: "c1",
    wa_id: "919876543210",
    profile_name: "Ravi",
    detected_language: "English",
    first_seen_at: hoursAgo(100),
    last_inbound_at: hoursAgo(lastInboundHoursAgo),
    handoff_active: false,
    handoff_since: null,
    handoff_reason: null,
    opted_out: false,
  };
}

function mockThread(lastInboundHoursAgo: number) {
  server.use(
    http.get(`${API}/contacts/ct1`, () => HttpResponse.json(contact(lastInboundHoursAgo))),
    http.get(`${API}/contacts/ct1/messages`, () =>
      HttpResponse.json([
        {
          id: "m1",
          contact_id: "ct1",
          direction: "in",
          sender: "customer",
          msg_type: "text",
          body: "Hello?",
          status: "received",
          error: null,
          ai_model: null,
          tokens_in: null,
          tokens_out: null,
          cost_usd: null,
          latency_ms: null,
          meta: null,
          created_at: hoursAgo(lastInboundHoursAgo),
        },
      ]),
    ),
    http.get(`${API}/inbox`, () => HttpResponse.json([])),
    http.get(`${API}/leads`, () => HttpResponse.json([])),
  );
}

describe("reply window", () => {
  it("canReply is true only within 24 hours", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(canReply({ last_inbound_at: "2026-09-27T00:00:00Z" }, now)).toBe(true);
    expect(canReply({ last_inbound_at: "2026-09-26T11:00:00Z" }, now)).toBe(false);
    expect(canReply({ last_inbound_at: null }, now)).toBe(false);
  });

  it("disables the reply box outside the 24-hour window", async () => {
    mockThread(30);
    renderWithProviders(<ThreadView contactId="ct1" />);
    expect(await screen.findByText("Hello?")).toBeInTheDocument();
    expect(screen.getByLabelText("Reply as agent")).toBeDisabled();
    expect(screen.getByText(/more than 24 hours ago/)).toBeInTheDocument();
  });

  it("enables the reply box inside the window", async () => {
    mockThread(2);
    renderWithProviders(<ThreadView contactId="ct1" />);
    expect(await screen.findByText("Hello?")).toBeInTheDocument();
    expect(screen.getByLabelText("Reply as agent")).toBeEnabled();
  });
});
