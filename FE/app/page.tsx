'use client';

import { MessageSquare, BarChart3, Settings, Zap, DollarSign, Clock, TrendingDown, Wrench,Target} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30 mb-8">
            <Zap className="w-4 h-4 text-foreground" />
            <span className="text-sm text-muted-foreground">Cost-Optimized Language Model Processing</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Intelligent Request Batching for LLMs
          </h1>
          
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
            A Python-based API service that reduces language model costs by up to 70% through intelligent request batching, 
            while maintaining acceptable response latency for real-time applications.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-xl mb-4 mx-auto">
                <TrendingDown className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">Cost Reduction</div>
            </div>

            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-xl mb-4 mx-auto">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">Avg. Latency Overhead</div>
            </div>

            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-xl mb-4 mx-auto">
                <Zap className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">Throughput Increase</div>
            </div>
          </div>

          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Request Management */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all text-left">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <MessageSquare className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Request Management</h3>
              <p className="text-muted-foreground mb-4">
                Submit and track multiple text generation requests with configurable priority levels. 
                Monitor request status and batch assignments in real-time.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Priority-based queuing (High, Medium, Low)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Batch composition visualization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Individual request tracking</span>
                </li>
              </ul>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all text-left">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <BarChart3 className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Visualize the cost-latency tradeoff with comprehensive metrics. Track API calls saved, 
                processing times, and batch efficiency over time.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Model invocation reduction charts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Latency distribution analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Cost savings calculations</span>
                </li>
              </ul>
            </div>

            {/* Configuration */}
            <div className="bg-card rounded-2xl border border-border/30 p-8 hover:border-border/50 hover:shadow-lg transition-all text-left">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl">
                <Settings className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Batching Configuration</h3>
              <p className="text-muted-foreground mb-4">
                Fine-tune batching parameters to optimize for your specific use case. 
                Configure timing windows, size limits, and priority thresholds.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Adjustable batch size limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Configurable wait windows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span>
                  <span>Priority-specific thresholds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture Section */}
      <section className="px-4 py-20 bg-muted/5 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            The service intelligently combines compatible requests to minimize LLM API calls while maintaining quality of service
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative">
              <div className="bg-card rounded-2xl border border-border/30 p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                  1
                </div>
                <h3 className="font-semibold text-foreground mb-2">Request Ingestion</h3>
                <p className="text-sm text-muted-foreground">
                  API accepts incoming text generation requests with priority metadata and queues them for processing
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl border border-border/30 p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                  2
                </div>
                <h3 className="font-semibold text-foreground mb-2">Intelligent Batching</h3>
                <p className="text-sm text-muted-foreground">
                  Algorithm groups requests based on timing constraints, priority levels, and token size compatibility
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl border border-border/30 p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                  3
                </div>
                <h3 className="font-semibold text-foreground mb-2">Batch Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Combined requests are sent as a single LLM invocation, reducing API calls by up to 70%
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl border border-border/30 p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                  4
                </div>
                <h3 className="font-semibold text-foreground mb-2">Response Distribution</h3>
                <p className="text-sm text-muted-foreground">
                  Individual responses are parsed and returned to respective requesters with full traceability
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      /* Design & Implementation Features */
<section className="px-4 py-20 border-t border-border/30">
  <div className="max-w-5xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
      Built for Performance & Scale
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">

        {/* Cost */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <DollarSign className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Cost-Optimized Architecture</h3>
            <p className="text-muted-foreground text-sm">
              Reduces LLM API costs through intelligent request consolidation and efficient token usage
            </p>
          </div>
        </div>

        {/* Latency */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <Clock className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Latency Management</h3>
            <p className="text-muted-foreground text-sm">
              Configurable wait windows balance cost savings against response time requirements
            </p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <Zap className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Priority-Based Queuing</h3>
            <p className="text-muted-foreground text-sm">
              High-priority requests receive preferential treatment with shorter wait times
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* Monitoring */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <BarChart3 className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Real-Time Monitoring</h3>
            <p className="text-muted-foreground text-sm">
              Live dashboards track batch efficiency, cost savings, and system performance metrics
            </p>
          </div>
        </div>

        {/* Simulator */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <Wrench className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Simulation Framework</h3>
            <p className="text-muted-foreground text-sm">
              Built-in traffic simulator demonstrates cost-latency tradeoffs under various load conditions
            </p>
          </div>
        </div>

        {/* Production */}
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-card rounded-xl border border-border/30">
            <Target className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Production-Ready</h3>
            <p className="text-muted-foreground text-sm">
              Python-based REST API with async processing, error handling, and comprehensive logging
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

      {/* Use Cases Section */}
      <section className="px-4 py-20 bg-muted/5 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Perfect For
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <h3 className="font-semibold text-foreground mb-3">High-Volume Applications</h3>
              <p className="text-sm text-muted-foreground">
                Services processing thousands of LLM requests daily can dramatically reduce costs while maintaining performance
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <h3 className="font-semibold text-foreground mb-3">Research & Development</h3>
              <p className="text-sm text-muted-foreground">
                Experiment with different batching strategies and analyze the cost-latency tradeoff for your specific workload
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/30 p-6">
              <h3 className="font-semibold text-foreground mb-3">Production Systems</h3>
              <p className="text-sm text-muted-foreground">
                Deploy as a cost-optimization layer in front of existing LLM integrations without changing client code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stack Section */}
      <section className="px-4 py-20 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Modern Tech Stack</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built with industry-standard tools and frameworks for reliability and developer experience
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl border border-border/30 p-6">
              <div className="text-2xl mb-2">🐍</div>
              <div className="font-semibold text-foreground text-sm">Python</div>
              <div className="text-xs text-muted-foreground">Backend API</div>
            </div>
            <div className="bg-card rounded-xl border border-border/30 p-6">
              <div className="text-2xl mb-2">⚛️</div>
              <div className="font-semibold text-foreground text-sm">React</div>
              <div className="text-xs text-muted-foreground">Frontend UI</div>
            </div>
            <div className="bg-card rounded-xl border border-border/30 p-6">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-semibold text-foreground text-sm">Tailwind CSS</div>
              <div className="text-xs text-muted-foreground">Styling</div>
            </div>
            <div className="bg-card rounded-xl border border-border/30 p-6">
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold text-foreground text-sm">shadcn/ui</div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}