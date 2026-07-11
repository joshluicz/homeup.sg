"use client";

import { useState, useRef, useEffect } from "react";
import { BotMessageSquare, Loader2, Send, Sparkles } from "lucide-react";
import type { DatePreset, GaDateRange } from "@/lib/analytics/dateRange";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What's driving the most traffic this period?",
  "Which playbook articles perform best for ads?",
  "How many WhatsApp clicks did we get?",
  "Which articles convert search clicks to WA leads?",
  "Is engagement improving or declining?",
];

interface AnalyticsAskPanelProps {
  dateRange: GaDateRange;
}

export function AnalyticsAskPanel({ dateRange }: AnalyticsAskPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setInput("");
    const userMsg: Message = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await fetch("/api/admin/analytics/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          history: messages.slice(-6),
          preset: dateRange.preset,
          startIso: dateRange.startIso,
          endIso: dateRange.endIso,
        }),
      });
      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.detail ?? result.error ?? "Failed to get answer");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-gradient-to-r from-primary-50 via-white to-white px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 ring-1 ring-primary-200">
          <BotMessageSquare className="h-4 w-4 text-primary-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">Insights Analyst</p>
          <p className="text-xs text-neutral-500">
            Ask questions about {dateRange.label}
          </p>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">
              <Sparkles className="inline h-3.5 w-3.5 mr-1 text-primary-500" />
              Ask anything about your site performance, articles, or ad placement.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-8 bg-neutral-900 text-white"
                : "mr-4 bg-primary-50 text-neutral-800 ring-1 ring-primary-100 whitespace-pre-wrap",
            )}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing data…
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-neutral-100 bg-neutral-50/60 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Which articles should I put ads on?"
          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
