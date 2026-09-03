"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  BrainCircuit,
  ShieldCheck,
  Maximize2
} from "lucide-react";
import Link from "next/link";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AssistantWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Why was this course recommended?",
    "What are my weakest skills?",
    "Give me an AsyncIO study plan",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userName = session?.user?.name || "there";
      setMessages([
        {
          id: "widget-welcome",
          role: "assistant",
          content: `Hi **${userName}**! Need guidance on your diagnostic results, skill gaps, or learning roadmap? Ask me anything!`,
        },
      ]);
    }
  }, [isOpen, messages.length, session]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: WidgetMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply },
        ]);
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions.slice(0, 3));
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", content: data?.error?.message || "Failed to process request." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Network connectivity issue." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-tr from-slate-950 via-indigo-950 to-indigo-800 text-white font-semibold text-xs shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-indigo-500/30 group animate-slide-up"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <Bot className="h-4 w-4 text-indigo-300 group-hover:rotate-12 transition-transform" />
          <span>AI Learning Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-3.5 px-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  Learning Assistant
                  <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono bg-white/10 text-emerald-300 border-white/20">
                    Read-Only
                  </Badge>
                </h3>
                <span className="text-[10px] text-slate-400">Contextual Learning Companion</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link href="/assistant" onClick={() => setIsOpen(false)} title="Open Full Screen">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10">
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 subtle-scroll bg-slate-50/50 dark:bg-slate-900/30">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-950 text-white text-[10px]">
                      <Bot className="h-3.5 w-3.5 text-indigo-300" />
                    </div>
                  )}
                  <div
                    className={`p-2.5 px-3 rounded-xl max-w-[85%] text-[11px] leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-white dark:bg-card border border-border/80 text-foreground rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start items-center text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span className="text-[11px]">Analyzing learning context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border/40 bg-card flex flex-wrap gap-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 transition-all truncate max-w-[170px]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-2.5 border-t border-border/60 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about skill gaps, courses..."
                disabled={loading}
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !inputValue.trim()}
                className="h-7 w-7 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shrink-0"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
