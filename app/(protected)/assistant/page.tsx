"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  User,
  Send,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
  ArrowRight,
  Loader2,
  HelpCircle,
  Award
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_SUGGESTIONS = [
  "Why was this course recommended to me?",
  "What are my weakest skills?",
  "What should I study before reassessment?",
  "Give me a learning plan for AsyncIO",
  "Explain my latest assessment result",
];

export default function AssistantPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming greeting
  useEffect(() => {
    const userName = session?.user?.name || "there";
    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content: `Hi **${userName}**! 👋 I am your **Capacity Connect Learning Assistant**.\n\nI can help you understand your diagnostic assessment results, explain why specific courses were recommended, analyze your skill gaps, and build targeted study plans.\n\n*What would you like to explore today?*`,
        timestamp: new Date(),
      },
    ]);
  }, [session]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: data?.error?.message || "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Network connectivity issue. Please check your connection and retry.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleClearChat() {
    const userName = session?.user?.name || "there";
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Conversation reset. How else can I assist your learning journey, **${userName}**?`,
        timestamp: new Date(),
      },
    ]);
    setSuggestions(INITIAL_SUGGESTIONS);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-lg border border-slate-800/80 animate-slide-up">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
        <div className="absolute inset-0 hero-mesh-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold backdrop-blur-md text-indigo-200 border border-white/15 shadow-2xs">
              <Bot className="h-3.5 w-3.5 text-indigo-300 animate-pulse" />
              <span>AI Learning Companion</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block ml-1" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Capacity Connect Learning Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Read-only educational AI advisor for explaining skill gap assessments, recommendation rationales, and customized study roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20 font-mono py-1 px-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mr-1" />
              Read-Only
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearChat}
              className="text-xs font-semibold gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white transition-all btn-premium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="border border-border/80 shadow-md flex flex-col h-[600px] overflow-hidden bg-card">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-border/60 py-3 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-xs font-bold text-foreground">Interactive Learning Session</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Role: {session?.user?.role || "EMPLOYEE"} • Tenant: {session?.user?.organizationId === "org-kl-university" ? "Capacity Connect" : (session?.user?.organizationId || "Capacity Connect")}
              </CardDescription>
            </div>
          </div>

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            🔒 Strictly isolated to your authenticated profile
          </span>
        </CardHeader>

        {/* Messages Stream */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 subtle-scroll">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-800 text-white shadow-2xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] text-xs leading-relaxed shadow-2xs ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : "bg-slate-50 dark:bg-slate-900/50 border border-border/80 text-foreground rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>
                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      isUser ? "text-indigo-200" : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-border/80 flex items-center gap-2 text-xs text-muted-foreground shadow-2xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>Assistant is analyzing your learning metrics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/20 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider self-center mr-1">
              Suggested:
            </span>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={loading}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 transition-all shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 border-t border-border/60 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your skill gaps, recommendations, or topic study roadmaps..."
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all"
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 h-9 shadow-xs btn-premium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
