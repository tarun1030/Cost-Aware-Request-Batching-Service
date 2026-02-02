'use client';

import { useState } from 'react';
import ApiConfigSection from '@/components/api-config-section';
import ThresholdSection from '@/components/threshold-section';
import { putSettings } from '@/lib/settings-api';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [thresholds, setThresholds] = useState({
    high: { tokens: 512, latency: 500 },
    medium: { tokens: 1024, latency: 500 },
    low: { tokens: 1800, latency: 500 },
  });
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const handleApiKeySave = async (newKey: string) => {
    setSettingsError(null);
    try {
      await putSettings({ api_key: newKey });
      setApiKey(newKey);
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : 'Failed to save API key');
    }
  };

  const handleThresholdUpdate = async (
    priority: 'high' | 'medium' | 'low',
    tokens: number,
    latency: number
  ) => {
    setSettingsError(null);
    const key = priority === 'high' ? 'high_priority' : priority === 'medium' ? 'medium_priority' : 'low_priority';
    try {
      await putSettings({ [key]: { tokens, latency } });
      setThresholds(prev => ({
        ...prev,
        [priority]: { tokens, latency },
      }));
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : `Failed to save ${priority} priority threshold`);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-foreground mb-12">Settings</h1>

        {settingsError && (
          <div className="mb-6 p-4 rounded-2xl border border-destructive/50 bg-destructive/10 text-destructive">
            {settingsError}
          </div>
        )}

        {/* API Configuration Section */}
        <ApiConfigSection onSave={handleApiKeySave} />

        {/* Divider */}
        <div className="my-12 h-px bg-border/30" />

        {/* Threshold Configuration */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-8">
            Threshold Configuration
          </h2>

          <div className="space-y-4">
            <ThresholdSection
              priority="high"
              initialTokens={thresholds.high.tokens}
              initialLatency={thresholds.high.latency}
              onUpdate={handleThresholdUpdate}
              color="text-foreground"
            />
            <ThresholdSection
              priority="medium"
              initialTokens={thresholds.medium.tokens}
              initialLatency={thresholds.medium.latency}
              onUpdate={handleThresholdUpdate}
              color="text-muted-foreground"
            />
            <ThresholdSection
              priority="low"
              initialTokens={thresholds.low.tokens}
              initialLatency={thresholds.low.latency}
              onUpdate={handleThresholdUpdate}
              color="text-muted-foreground/60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
