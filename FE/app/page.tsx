'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Modern SaaS Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            A premium, developer-focused interface for managing requests, analytics, and configuration. Built with React, Tailwind CSS, and shadcn/ui.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/chats">
              <Button className="gap-2 bg-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-lg">
                Explore Chats
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2 border-border/30 text-foreground hover:bg-muted/10 px-8 py-6 text-lg bg-transparent">
                View Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Chats Feature */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <MessageSquare className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Chats</h3>
              <p className="text-muted-foreground">
                Manage multiple request cards with batch submission. Add, update, and submit queries with priority levels.
              </p>
            </div>

            {/* Dashboard Feature */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <BarChart3 className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Dashboard</h3>
              <p className="text-muted-foreground">
                Visualize analytics with summary cards and charts. Track request counts and priority distribution.
              </p>
            </div>

            {/* Settings Feature */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <Settings className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Settings</h3>
              <p className="text-muted-foreground">
                Configure API keys and set thresholds for different priority levels with expandable controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Design Features Section */}
      <section className="px-4 py-20 bg-muted/5 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Premium Design Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Monochrome Theme</h3>
                <p className="text-muted-foreground text-sm">Minimal black & white color scheme with subtle grays</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Rounded Corners</h3>
                <p className="text-muted-foreground text-sm">Consistent rounded-2xl styling throughout</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Smooth Transitions</h3>
                <p className="text-muted-foreground text-sm">Fluid animations and hover effects</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Responsive Layout</h3>
                <p className="text-muted-foreground text-sm">Mobile-first design that scales perfectly</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Subtle Shadows</h3>
                <p className="text-muted-foreground text-sm">Depth through minimal shadow usage</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Developer-Focused</h3>
                <p className="text-muted-foreground text-sm">Clean architecture with reusable components</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Explore the three main sections of the dashboard to see how it all works together.
          </p>
          <Link href="/chats">
            <Button className="gap-2 bg-primary text-primary-foreground hover:opacity-90 px-8 py-6 text-lg">
              Open Chats Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
