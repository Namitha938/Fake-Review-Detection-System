import React, { useState, useEffect, useRef } from 'react';
import { assistantApi } from '../api';
import { AssistantChatMessage, ReviewAnalysisResult } from '../types';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  ChevronDown,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Minimize2,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      role: 'assistant',
      content:
        "👋 **Hello! I am your Veridex AI Forensic Co-Pilot.**\n\nI can analyze why reviews were flagged, explain SHAP attributions, detect subtle astroturfing patterns, or rewrite reviews to make them authentic.\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<ReviewAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I spot fake Amazon reviews?',
    'What is rating-sentiment dissonance?',
    'Explain SHAP explainability',
  ]);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Listen for custom event to open assistant with review context
  useEffect(() => {
    const handleOpenWithContext = (e: CustomEvent) => {
      setIsOpen(true);
      if (e.detail) {
        setActiveContext(e.detail);
        // Add greeting specific to the review
        const reviewSummary = e.detail.review_text?.slice(0, 80) + '...';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `🔍 **Review Context Attached!**\n\nI've loaded your review: *"${reviewSummary}"*\n\nVerdict: **${(
              e.detail.prediction || 'Analysis'
            ).toUpperCase()}** (${((e.detail.fake_probability || 0.5) * 100).toFixed(
              1
            )}% Deception Probability).\n\nAsk me *"Why was this flagged?"* or *"How to rewrite this authentically?"*!`,
          },
        ]);
        setSuggestions([
          'Why was this review flagged?',
          'How can I rewrite this to look authentic?',
          'Explain this review\'s keywords',
        ]);
      }
    };

    window.addEventListener('veridex:open-assistant' as any, handleOpenWithContext as any);
    return () => {
      window.removeEventListener('veridex:open-assistant' as any, handleOpenWithContext as any);
    };
  }, []);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const newHistory: AssistantChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const response = await assistantApi.chat(text, activeContext, newHistory);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.suggested_prompts && response.suggested_prompts.length > 0) {
        setSuggestions(response.suggested_prompts);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ **Connection Notice**: Unable to reach AI Assistant service right now. Please check backend connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. What would you like to investigate next?',
      },
    ]);
  };

  // Basic markdown-like parser for bolding, bullet points, and headers
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <p key={idx} className="font-bold text-slate-900 dark:text-white">
                {line.replace(/\*\*/g, '')}
              </p>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const raw = line.slice(2);
            // Replace **bold**
            const parts = raw.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-500 font-bold">•</span>
                <span>
                  {parts.map((p, pIdx) =>
                    p.startsWith('**') && p.endsWith('**') ? (
                      <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                        {p.slice(2, -2)}
                      </strong>
                    ) : (
                      p
                    )
                  )}
                </span>
              </div>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="pl-2.5 py-1 border-l-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 italic text-[11px] rounded-r my-1"
              >
                {line.slice(2)}
              </blockquote>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }

          // Parse inline bold
          const inlineParts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx}>
              {inlineParts.map((part, pIdx) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER BUTTON (Compact Icon-Only FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 hover:scale-105 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open Veridex AI Co-Pilot"
          title="Open Veridex AI Co-Pilot"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-indigo-700" />
          </div>
        </button>
      )}

      {/* CHAT WINDOW SIDE DRAWER */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 sm:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <aside
            aria-label="Veridex AI Co-Pilot Drawer"
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
          >
            {/* Header */}
            <div className="p-4 px-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Veridex AI Co-Pilot</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Forensics & Deception Intelligence
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  title="Close panel"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Active Context Chip */}
          {activeContext && (
            <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="font-semibold text-indigo-900 dark:text-indigo-300 truncate">
                  Context: Review (★{activeContext.rating || 'N/A'}) • {activeContext.prediction?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setActiveContext(null)}
                className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 ml-2"
                title="Detach context"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-xs font-sans whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      {renderFormattedContent(msg.content)}
                      <div className="flex justify-end pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Copy assistant reply"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none p-3 shadow-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-200" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Analyzing forensics...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts Pills */}
          {suggestions.length > 0 && (
            <div className="p-2 px-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
              {suggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleSend(suggestion)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 hover:scale-102"
                >
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeContext ? 'Ask AI about this review...' : 'Ask anything about fake review detection...'
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </>
    )}
  </>
  );
};

