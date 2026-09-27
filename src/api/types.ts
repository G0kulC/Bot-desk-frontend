/** Friendly aliases for the generated OpenAPI schema types. */
import type { components } from "./schema";

type S = components["schemas"];

export type User = S["UserOut"];
export type Client = S["ClientOut"];
export type ClientCreate = S["ClientCreate"];
export type ClientUpdate = S["ClientUpdate"];
export type ClientStatus = S["ClientStatus"];
export type Niche = S["Niche"];
export type Package = S["Package"];
export type Provider = S["Provider"];
export type ClientsPage = S["Page_ClientOut_"];
export type AppConfig = S["ConfigOut"];

export type Knowledge = S["KnowledgeOut"];
export type KnowledgeIn = S["KnowledgeIn"];
export type KnowledgeVersion = S["KnowledgeVersionOut"];
export type KnowledgeTemplate = S["KnowledgeTemplateOut"];

export type Channel = S["ChannelOut"];
export type ChannelIn = S["ChannelIn"];
export type ChannelTest = S["ChannelTestOut"];

export type TestChatIn = S["TestChatIn"];
export type TestChatOut = S["TestChatOut"];
export type ChatTurn = S["ChatTurn"];

export type InboxItem = S["InboxItem"];
export type Message = S["MessageOut"];
export type Contact = S["ContactOut"];

export type Lead = S["LeadOut"];
export type LeadCreate = S["LeadCreate"];
export type LeadUpdate = S["LeadUpdate"];
export type LeadStatus = S["LeadStatus"];

export type Payment = S["PaymentOut"];
export type PaymentCreate = S["PaymentCreate"];
export type PaymentType = S["PaymentType"];
export type PaymentMethod = S["PaymentMethod"];
export type Renewal = S["RenewalOut"];

export type Dashboard = S["DashboardOut"];
export type Attention = S["AttentionOut"];
export type MonthlyReport = S["MonthlyReportOut"];

export type BillingStatus = "paid" | "due" | "overdue" | "upcoming" | "not_live";
