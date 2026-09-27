import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { CLIENT, KNOWLEDGE } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, server } from "@/test/server";

import { KnowledgeTab } from "./KnowledgeTab";
import { knowledgeToValues, needsReapproval } from "./knowledgeForm";

describe("needsReapproval", () => {
  it("only for approved knowledge when services, FAQs or rules change", () => {
    const v = knowledgeToValues(KNOWLEDGE);
    expect(needsReapproval(KNOWLEDGE, v)).toBe(false);
    expect(needsReapproval(KNOWLEDGE, { ...v, timings: "9 to 5" })).toBe(false);
    expect(needsReapproval(KNOWLEDGE, { ...v, services: "Cleaning: ₹1,500" })).toBe(true);
    expect(needsReapproval({ ...KNOWLEDGE, approved: false }, { ...v, rules: "x" })).toBe(false);
  });
});

describe("KnowledgeTab", () => {
  it("warns that the owner must approve again after editing approved services", async () => {
    server.use(
      http.get(`${API}/clients/c1/knowledge`, () => HttpResponse.json(KNOWLEDGE)),
      http.get(`${API}/knowledge/templates/dental_clinic`, () =>
        HttpResponse.json({ niche: "dental_clinic", sample_business: "x", label: "Sample", knowledge: {} }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<KnowledgeTab client={CLIENT} />);

    expect(await screen.findByText(/Approved by Dr. Priya/)).toBeInTheDocument();
    expect(screen.queryByText(/approve again/)).not.toBeInTheDocument();

    const services = screen.getByLabelText("Services & prices");
    await user.clear(services);
    await user.type(services, "Cleaning: ₹1,500");

    expect(await screen.findByRole("alert")).toHaveTextContent(/approve again/);
  });
});
