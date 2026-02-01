'use client';

import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownResponse from '@/components/markdown-response';

interface ChatCardProps {
  card: {
    id: string;
    username: string;
    query: string;
    priority: number; // 0=Low, 1=Medium, 2=High
    response?: string;
    loading?: boolean;
    timestamp?: string;
    tokensUsed?: number;
    latencyMs?: number;
    requestId?: string;
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
}

export default function ChatCard({
  card,
  onUpdate,
  onDelete,
  onSubmit,
}: ChatCardProps) {
  const priorityOptions = [
    { value: 2, label: 'High' },
    { value: 1, label: 'Medium' },
    { value: 0, label: 'Low' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-6 transition-all duration-200 hover:border-border/50 hover:shadow-lg">
      {/* Close Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => onDelete(card.id)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Username Input */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
          Username
        </label>
        <Input
          type="text"
          placeholder="Enter username"
          value={card.username}
          onChange={(e) =>
            onUpdate(card.id, { username: e.target.value })
          }
          className="bg-input border-border/30 text-foreground placeholder:text-muted-foreground/40 rounded-lg"
          disabled={card.loading}
        />
      </div>

      {/* Query Textarea */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
          Query
        </label>
        <textarea
          placeholder="Enter your query"
          value={card.query}
          onChange={(e) =>
            onUpdate(card.id, { query: e.target.value })
          }
          disabled={card.loading}
          className="w-full bg-input border border-border/30 text-foreground placeholder:text-muted-foreground/40 rounded-lg p-3 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
        />
      </div>

      {/* Priority Selection */}
      <div className="mb-6">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
          Priority
        </label>
        <div className="flex gap-2">
          {priorityOptions.map((option) => {
            const isSelected = card.priority === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onUpdate(card.id, { priority: option.value })}
                disabled={card.loading}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/30 bg-input text-muted-foreground hover:border-border/50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit(card.id)}
        disabled={card.loading || !card.query.trim() || !card.username.trim()}
        className="w-full mb-4 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {card.loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Submit'
        )}
      </Button>

      {/* Response Area */}
      {card.response && (
        <div className="mt-6 pt-6 border-t border-border/30">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Response
            </label>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              {card.timestamp && <span>{card.timestamp}</span>}
              {card.tokensUsed != null && (
                <span>{card.tokensUsed.toLocaleString()} tokens</span>
              )}
              {card.latencyMs != null && (
                <span>{Math.round(card.latencyMs)}ms</span>
              )}
              {card.requestId && (
                <span className="truncate max-w-24" title={card.requestId}>
                  {card.requestId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>
          <MarkdownResponse
            content={card.response}
            maxHeight="16rem"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          />
        </div>
      )}
    </div>
  );
}