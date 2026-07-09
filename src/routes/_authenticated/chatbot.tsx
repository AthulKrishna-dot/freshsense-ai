import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chatbot")({
  component: ChatbotPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How should I store fresh strawberries?",
  "How long does milk last in the fridge?",
  "What are signs of spoiled leafy greens?",
  "Best way to freeze cooked rice?",
];

function ChatbotPage() {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **FreshBot**, your AI Food Assistant. Ask me anything about food storage, shelf life, spoilage signs, or preservation." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.content }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-14rem)]">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="size-6 text-primary" /> AI Food Assistant
        </h2>
        <p className="text-sm text-muted-foreground">Ask FreshBot about storage, shelf life & food safety.</p>
      </div>

      <div className="glass-card rounded-xl flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={
                m.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm"
                  : "bg-secondary/60 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] text-sm prose prose-invert prose-sm max-w-none"
              }>
                {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary/60 rounded-2xl px-4 py-3 flex gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="size-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary/60 flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border/60 p-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about food storage, shelf life…"
            className="min-h-11 max-h-32 resize-none"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="gradient-primary text-primary-foreground self-end h-11">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
