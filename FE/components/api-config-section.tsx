'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApiConfigSectionProps {
  onSave: (apiKey: string) => void;
}

export default function ApiConfigSection({ onSave }: ApiConfigSectionProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-8">
      <h2 className="text-2xl font-semibold text-foreground mb-8">API Configuration</h2>

      <div className="space-y-6">
        {/* API Key Input */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            API Key
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-input border-border/30 text-foreground placeholder:text-muted-foreground/40 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Your API key is stored securely and never shared
          </p>
        </div>
      </div>
    </div>
  );
}
