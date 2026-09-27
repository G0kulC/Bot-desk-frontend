import { describe, expect, it } from "vitest";

import {
  addDaysISO,
  formatDate,
  formatDateTime,
  formatINR,
  formatMonth,
  formatRelative,
  monthIST,
  todayIST,
  toDate,
} from "./format";
import { formatPhone, isValidPhone, normalizePhone, waLink } from "./phone";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(123456)).toBe("₹1,23,456");
    expect(formatINR(1234567)).toBe("₹12,34,567");
    expect(formatINR(999)).toBe("₹999");
    expect(formatINR(0)).toBe("₹0");
  });
  it("accepts API decimal strings and shows paise only when present", () => {
    expect(formatINR("3999.00")).toBe("₹3,999");
    expect(formatINR("1999.50")).toBe("₹1,999.50");
    expect(formatINR("0.0088", 4)).toBe("₹0.0088");
  });
  it("handles negatives and junk", () => {
    expect(formatINR(-1500)).toBe("-₹1,500");
    expect(formatINR("abc")).toBe("₹0");
    expect(formatINR(null)).toBe("₹0");
  });
});

describe("IST dates", () => {
  it("formats in Asia/Kolkata with Indian month names", () => {
    // 20:00 UTC on 26 Sept is 01:30 IST on 27 Sept.
    expect(formatDate("2026-09-26T20:00:00Z")).toBe("27 Sept 2026");
    expect(formatDateTime("2026-09-26T20:00:00Z")).toBe("27 Sept 2026, 1:30 am");
  });
  it("treats plain dates as IST calendar dates", () => {
    expect(formatDate("2026-01-31")).toBe("31 Jan 2026");
    expect(toDate("2026-01-31")?.toISOString()).toBe("2026-01-30T18:30:00.000Z");
  });
  it("computes today and month in IST", () => {
    const lateUtc = new Date("2026-09-30T19:00:00Z"); // 1 Oct 00:30 IST
    expect(todayIST(lateUtc)).toBe("2026-10-01");
    expect(monthIST(lateUtc)).toBe("2026-10");
  });
  it("relative labels", () => {
    const now = new Date("2026-09-27T10:00:00Z");
    expect(formatRelative("2026-09-27T09:59:30Z", now)).toBe("now");
    expect(formatRelative("2026-09-27T09:45:00Z", now)).toBe("15m");
    expect(formatRelative("2026-09-26T08:00:00Z", now)).toBe("Yesterday");
    expect(formatRelative("2026-09-20T08:00:00Z", now)).toBe("20 Sept");
  });
  it("month and day helpers", () => {
    expect(formatMonth("2026-09")).toBe("September 2026");
    expect(formatMonth("2026-09-01", "short")).toBe("Sept 2026");
    expect(addDaysISO("2026-09-27", 7)).toBe("2026-10-04");
    expect(formatDate(null)).toBe("—");
  });
});

describe("phone", () => {
  it("normalises Indian numbers to E.164", () => {
    expect(normalizePhone("98400 12345")).toBe("+919840012345");
    expect(normalizePhone("098400-12345")).toBe("+919840012345");
    expect(normalizePhone("919840012345")).toBe("+919840012345");
    expect(normalizePhone("+91 98400 12345")).toBe("+919840012345");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });
  it("rejects junk", () => {
    expect(isValidPhone("12")).toBe(false);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("abcd")).toBe(false);
  });
  it("formats and links", () => {
    expect(formatPhone("+919840012345")).toBe("+91 98400 12345");
    expect(waLink("+91 98400 12345")).toBe("https://wa.me/919840012345");
  });
});
