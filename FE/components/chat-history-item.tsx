'use client';

import type { ChatHistoryItem } from '@/lib/chat-api';
import MarkdownResponse from '@/components/markdown-response';

const priorityLabels: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
};

const priorityStyles: Record<number, string> = {
  0: 'border-muted/30 text-muted-foreground/60 bg-muted/20',
  1: 'border-muted text-muted-foreground bg-muted/30',
  2: 'border-white/40 text-white bg-white/10',
};

export default function ChatHistoryItemCard({ item }: { item: ChatHistoryItem }) {
  const response = item.response ?? '—';
  const priority = typeof item.priority === 'number' ? item.priority : 1;

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-6 transition-all duration-200 hover:border-border/50 hover:shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-sm font-medium text-foreground">{item.username}</span>
        <span
          className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
            priorityStyles[priority] ?? priorityStyles[1]
          }`}
        >
          {priorityLabels[priority] ?? 'Medium'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Query</label>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
            {item.query}
          </p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Response</label>
          <MarkdownResponse content={response} maxHeight="16rem" />
        </div>
      </div>

      {(item.created_at ?? item.completed_at) && (
        <p className="mt-4 text-xs text-muted-foreground/60">
          {item.completed_at
            ? new Date(item.completed_at).toLocaleString()
            : item.created_at
              ? new Date(item.created_at).toLocaleString()
              : null}
        </p>
      )}
    </div>
  );
}
