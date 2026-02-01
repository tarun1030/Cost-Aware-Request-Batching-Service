'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ThresholdSectionProps {
  priority: 'high' | 'medium' | 'low';
  initialTokens: number;
  initialLatency: number;
  onUpdate: (priority: 'high' | 'medium' | 'low', tokens: number, latency: number) => void;
  color: string;
}

export default function ThresholdSection({
  priority,
  initialTokens,
  initialLatency,
  onUpdate,
  color,
}: ThresholdSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState(initialTokens.toString());
  const [latency, setLatency] = useState(initialLatency.toString());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(priority, parseInt(tokens) || 0, parseInt(latency) || 0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden transition-all duration-200">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
      >
        <div className="text-left">
          <h3 className={`font-semibold ${color}`}>{priorityLabel} Priority</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tokens: {initialTokens.toLocaleString()} | Latency: {initialLatency}ms
          </p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-border/30 px-6 py-6 bg-muted/5">
          <div className="space-y-4">
            {/* Token Count Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Token Count Limit
              </label>
              <Input
                type="number"
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
                placeholder="Enter token limit"
                className="bg-input border-border/30 text-foreground"
              />
            </div>

            {/* Latency Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Max Latency (ms)
              </label>
              <Input
                type="number"
                value={latency}
                onChange={(e) => setLatency(e.target.value)}
                placeholder="Enter max latency"
                className="bg-input border-border/30 text-foreground"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              {saved ? 'Saved' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
