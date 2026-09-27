import { Bot, Hand, Languages, RotateCcw, Send, ShieldAlert, Target } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { errorMessage } from "@/api/client";
import type { Client, TestChatOut } from "@/api/types";
import { useTestChat } from "@/api/useChannel";
import { Button } from "@/components/Button";
import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { ChatThread } from "@/components/ChatThread";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { formatINR, formatTime } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { quickQuestionsFor } from "./quickQuestions";

type Turn =
  | { id: number; role: "user"; content: string; at: Date }
  | { id: number; role: "assistant"; content: string; at: Date; meta: TestChatOut }
  | { id: number; role: "error"; content: string; at: Date };

function MetaChip({
  icon,
  children,
  tone,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "warn" | "bad" | "ok";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-surface px-2 py-0.5 text-[11px] font-medium [&_svg]:size-3",
        tone === "warn" && "border-warn/40 text-warn",
        tone === "bad" && "border-bad/40 text-bad",
        tone === "ok" && "border-ok/40 text-ok",
        !tone && "border-line text-ink-2",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small chips shown under each bot reply. */
export function ReplyMeta({ meta }: { meta: TestChatOut }) {
  return (
    <>
      <MetaChip icon={<Languages />}>{meta.language}</MetaChip>
      {meta.lead && (
        <MetaChip icon={<Target />} tone="ok">
          Lead captured:{" "}
          {[meta.lead.name, meta.lead.need, meta.lead.when].filter(Boolean).join(" · ") || "details pending"}
        </MetaChip>
      )}
      {meta.handoff && (
        <MetaChip icon={<Hand />} tone="bad">
          Handed to owner: {meta.handoff_reason || "needs a person"}
        </MetaChip>
      )}
      {meta.guardrail_notes.map((n) => (
        <MetaChip key={n} icon={<ShieldAlert />} tone="warn">
          {n}
        </MetaChip>
      ))}
      <MetaChip icon={<Bot />}>{meta.model ?? "model"}</MetaChip>
      <MetaChip>{formatINR(meta.cost_inr, 4)}</MetaChip>
    </>
  );
}

export function TestBotTab({ client }: { client: Client }) {
  const chat = useTestChat(client.id);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reduced = usePrefersReducedMotion();

  function send(message: string) {
    const content = message.trim();
    if (!content || chat.isPending) return;
    const history = turns
      .filter((t): t is Extract<Turn, { role: "user" | "assistant" }> => t.role !== "error")
      .map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { id: nextId.current++, role: "user", content, at: new Date() }]);
    setText("");
    chat.mutate(
      { history, message: content },
      {
        onSuccess: (res) =>
          setTurns((prev) => [
            ...prev,
            { id: nextId.current++, role: "assistant", content: res.reply, at: new Date(), meta: res },
          ]),
        onError: (err) =>
          setTurns((prev) => [
            ...prev,
            { id: nextId.current++, role: "error", content: errorMessage(err), at: new Date() },
          ]),
      },
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(text);
    inputRef.current?.focus();
  }

  const header = (
    <div className="flex items-center gap-3 border-b border-line bg-brand px-3 py-2.5 text-brand-ink">
      <div className="grid size-9 place-items-center rounded-full bg-brand-ink/15 font-display font-semibold">
        {client.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{client.name}</p>
        <p className="text-xs opacity-80">
          {chat.isPending ? "typing…" : "Test chat · nothing is sent or saved"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-brand-ink hover:bg-brand-ink/10"
        onClick={() => setTurns([])}
        disabled={!turns.length}
      >
        <RotateCcw /> New chat
      </Button>
    </div>
  );

  const footer = (
    <div className="border-t border-line bg-surface p-2">
      <div className="scrollbar-none mb-2 flex gap-1.5 overflow-x-auto">
        {quickQuestionsFor(client.niche).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            disabled={chat.isPending}
            className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-ink-2 hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <label htmlFor="testbot-input" className="sr-only">
          Message
        </label>
        <textarea
          id="testbot-input"
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
          placeholder="Type as a customer… (English, Tanglish, தமிழ்)"
          className="field-input max-h-32 min-h-10 flex-1 resize-none py-2"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={!text.trim() || chat.isPending}>
          <Send />
        </Button>
      </form>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative rounded-lg">
        {!reduced && (
          <BorderBeam size={80} duration={12} colorFrom="hsl(var(--brand))" colorTo="hsl(var(--ok))" />
        )}
        <ChatThread
          header={header}
          footer={footer}
          className="h-[calc(100dvh-260px)] min-h-[420px]"
          scrollKey={turns.length + (chat.isPending ? 0.5 : 0)}
          label="Test chat"
        >
          {turns.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-ink-2">
              {reduced ? (
                <p>Ask anything a customer would. The reply uses the same AI and guardrails as WhatsApp.</p>
              ) : (
                <TypingAnimation
                  as="p"
                  duration={25}
                  className="text-sm font-normal leading-relaxed text-ink-2"
                >
                  Ask anything a customer would. The reply uses the same AI and guardrails as WhatsApp.
                </TypingAnimation>
              )}
            </div>
          )}
          {turns.map((t) =>
            t.role === "user" ? (
              <ChatBubble key={t.id} side="in" time={formatTime(t.at)}>
                {t.content}
              </ChatBubble>
            ) : t.role === "assistant" ? (
              <ChatBubble
                key={t.id}
                side="out"
                label="Bot"
                time={formatTime(t.at)}
                footer={<ReplyMeta meta={t.meta} />}
              >
                {t.content}
              </ChatBubble>
            ) : (
              <ChatBubble key={t.id} side="system" label="Error">
                {t.content}
              </ChatBubble>
            ),
          )}
          {chat.isPending && <TypingIndicator label="Bot is typing" />}
        </ChatThread>
      </div>
    </div>
  );
}
