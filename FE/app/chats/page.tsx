'use client';

import { useState, useEffect } from 'react';
import { Plus, History, ArrowLeft, Loader2 } from 'lucide-react';
import ChatCard from '@/components/chat-card';
import ChatHistoryItemCard from '@/components/chat-history-item';
import { Button } from '@/components/ui/button';
import { submitQuery, fetchChatHistory, type ChatHistoryItem } from '@/lib/chat-api';

interface ChatRequest {
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
}

type View = 'home' | 'history';

export default function ChatsPage() {
  const [view, setView] = useState<View>('home');
  const [cards, setCards] = useState<ChatRequest[]>([
    {
      id: '1',
      username: 'user@example.com',
      query: 'How do I configure API authentication?',
      priority: 2,
    },
  ]);

  const [historyItems, setHistoryItems] = useState<ChatHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (view !== 'history') return;
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const list = await fetchChatHistory();
        if (!cancelled) setHistoryItems(list);
      } catch (e) {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : 'Failed to load chat history');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view]);

  const addCard = () => {
    const newCard: ChatRequest = {
      id: Date.now().toString(),
      username: '',
      query: '',
      priority: 1,
    };
    setCards([...cards, newCard]);
  };

  const updateCard = (id: string, updates: Partial<ChatRequest>) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const submitCard = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card || !card.query.trim() || !card.username.trim()) return;

    const requestId = crypto.randomUUID();
    updateCard(id, { loading: true, requestId, response: '' });

    // Track accumulated response text using closure
    let accumulatedResponse = '';

    submitQuery(
      requestId,
      card.username.trim(),
      card.query.trim(),
      card.priority,
      // onChunk: append streaming text
      (chunk: string) => {
        accumulatedResponse += chunk;
        updateCard(id, {
          response: accumulatedResponse,
        });
      },
      // onComplete: set final metadata
      (response) => {
        updateCard(id, {
          loading: false,
          response: response.text,
          timestamp: new Date(response.completed_at).toLocaleTimeString(),
          tokensUsed: response.tokens_used,
          latencyMs: response.latency_ms,
          requestId: response.request_id,
        });
      },
      // onError: show error message
      (error: string) => {
        updateCard(id, {
          loading: false,
          response: `Error: ${error}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    );
  };

  const submitAll = async () => {
    // Filter to only cards with query and username
    const cardsToSubmit = cards.filter(
      card => card.query.trim() && card.username.trim()
    );
    if (cardsToSubmit.length === 0) return;

    // Set loading for all cards at once
    cardsToSubmit.forEach(card => updateCard(card.id, { loading: true }));

    // Submit all cards in parallel at the same time
    await Promise.all(cardsToSubmit.map(card => submitCard(card.id)));
  };

  if (view === 'history') {
    return (
      <div className="min-h-screen bg-background px-4 py-12 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => setView('home')}
              variant="ghost"
              size="icon"
              className="rounded-full border border-border/30 hover:bg-muted/50"
              aria-label="Back to chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-bold text-foreground">Chat History</h1>
          </div>

          {historyError && (
            <div className="mb-6 p-4 rounded-2xl border border-destructive/50 bg-destructive/10 text-destructive">
              {historyError}
            </div>
          )}

          {historyLoading && (
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading chat history…
            </div>
          )}

          {!historyLoading && !historyError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyItems.map((item, index) => (
                <ChatHistoryItemCard
                  key={item.request_id ?? `history-${index}`}
                  item={item}
                />
              ))}
            </div>
          )}

          {!historyLoading && !historyError && historyItems.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
              <p className="text-muted-foreground">No chat history yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-foreground">Chats</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setView('history')}
              variant="outline"
              className="gap-2 border-border/30 text-foreground hover:bg-muted/10 bg-transparent"
            >
              <History className="w-4 h-4" />
              Chat History
            </Button>
            {cards.length > 1 && (
              <Button
                onClick={submitAll}
                variant="default"
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Submit All
              </Button>
            )}
            <Button
              onClick={addCard}
              variant="default"
              className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Card
            </Button>
          </div>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <ChatCard
              key={card.id}
              card={card}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onSubmit={submitCard}
            />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-96 text-center">
            <p className="text-muted-foreground mb-4">No chat requests yet</p>
            <Button
              onClick={addCard}
              className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Create First Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}