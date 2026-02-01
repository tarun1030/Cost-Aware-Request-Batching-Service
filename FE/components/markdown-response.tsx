'use client';

import { Component, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Fallback when markdown parsing fails (e.g. malformed or unexpected content). */
class MarkdownErrorBoundary extends Component<
  { fallback: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {this.props.fallback}
        </div>
      );
    }
    return this.props.children;
  }
}

const markdownClasses = {
  root: 'text-foreground/80 text-sm leading-relaxed [&>*+*]:mt-2',
  p: 'mb-2 last:mb-0',
  strong: 'font-semibold text-foreground',
  em: 'italic',
  a: 'text-primary underline underline-offset-2 hover:opacity-90',
  ul: 'list-disc pl-5 space-y-1 my-2',
  ol: 'list-decimal pl-5 space-y-1 my-2',
  li: 'leading-relaxed',
  code: 'rounded bg-muted/80 px-1.5 py-0.5 text-xs font-mono text-foreground',
  pre: 'rounded-lg bg-muted/80 p-3 overflow-x-auto my-2 border border-border/30',
  preCode: 'text-sm font-mono text-foreground block p-0 bg-transparent',
  blockquote: 'border-l-2 border-border pl-4 my-2 text-muted-foreground italic',
  h1: 'text-lg font-bold mt-4 mb-2 first:mt-0',
  h2: 'text-base font-semibold mt-3 mb-2 first:mt-0',
  h3: 'text-sm font-semibold mt-2 mb-1 first:mt-0',
  table: 'w-full border-collapse my-2 text-sm',
  th: 'border border-border/50 bg-muted/50 px-3 py-2 text-left font-semibold',
  td: 'border border-border/50 px-3 py-2',
  hr: 'border-border/50 my-3',
};

interface MarkdownResponseProps {
  content: string;
  className?: string;
  /** Max height for scroll area (default: 16rem / 256px). Set to none for no scroll. */
  maxHeight?: string | number;
}

export default function MarkdownResponse({
  content,
  className,
  maxHeight = '16rem',
}: MarkdownResponseProps) {
  const safeContent = content == null ? '' : String(content);
  const heightValue =
    typeof maxHeight === 'string' && maxHeight !== 'none'
      ? maxHeight
      : typeof maxHeight === 'number'
        ? `${maxHeight}px`
        : null;
  const style = heightValue ? { height: heightValue, maxHeight: heightValue } : undefined;

  const inner = (
    <div className={cn(markdownClasses.root, 'break-words')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className={markdownClasses.p}>{children}</p>,
          strong: ({ children }) => <strong className={markdownClasses.strong}>{children}</strong>,
          em: ({ children }) => <em className={markdownClasses.em}>{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={markdownClasses.a}>
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className={markdownClasses.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={markdownClasses.ol}>{children}</ol>,
          li: ({ children }) => <li className={markdownClasses.li}>{children}</li>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = typeof codeClassName === 'string' && codeClassName.includes('language-');
            return (
              <code
                className={isBlock ? cn(markdownClasses.preCode, codeClassName) : markdownClasses.code}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className={markdownClasses.pre}>{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className={markdownClasses.blockquote}>{children}</blockquote>
          ),
          h1: ({ children }) => <h1 className={markdownClasses.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={markdownClasses.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={markdownClasses.h3}>{children}</h3>,
          table: ({ children }) => <table className={markdownClasses.table}>{children}</table>,
          th: ({ children }) => <th className={markdownClasses.th}>{children}</th>,
          td: ({ children }) => <td className={markdownClasses.td}>{children}</td>,
          hr: () => <hr className={markdownClasses.hr} />,
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );

  const wrapped = (
    <MarkdownErrorBoundary fallback={safeContent}>
      {inner}
    </MarkdownErrorBoundary>
  );

  if (maxHeight !== 'none' && style) {
    return (
      <ScrollArea
        style={style}
        className={cn('rounded-lg bg-input/50 w-full shrink-0', className)}
      >
        <div className="p-3 pr-4 min-h-0">{wrapped}</div>
      </ScrollArea>
    );
  }

  return (
    <div className={cn('rounded-lg bg-input/50 p-3', className)}>
      {wrapped}
    </div>
  );
}
