import type { MonthlyReport } from "@/api/types";
import { formatCount, formatMonth } from "@/lib/format";

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Short, WhatsApp-ready summary for the owner, e.g.
 * "September report for Smile Care Dental: 142 chats, 38 leads, 41% came at night (10 pm–8 am).
 *  Top question: root canal price."
 */
export function ownerSummary(report: MonthlyReport, clientName: string): string {
  const month = formatMonth(report.month).split(" ")[0];
  const parts = [
    `${formatCount(report.chats)} chat${report.chats === 1 ? "" : "s"}`,
    `${formatCount(report.leads)} lead${report.leads === 1 ? "" : "s"}`,
  ];
  if (report.night_enquiries > 0)
    parts.push(`${Math.round(report.night_share * 100)}% came at night (10 pm–8 am)`);
  let text = `${month} report for ${clientName}: ${parts.join(", ")}.`;
  if (report.bot_replies > 0) {
    text += ` The assistant sent ${formatCount(report.bot_replies)} replies`;
    text +=
      report.avg_bot_reply_seconds != null
        ? `, answering in about ${Math.max(1, Math.round(report.avg_bot_reply_seconds))} seconds.`
        : ".";
  }
  const top = report.top_questions[0];
  if (top) text += ` Top question: ${capitalise(top.question)}.`;
  return text;
}
