import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
  pageName?: string;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[BCCC EASE] Page render failed:', error, errorInfo);
    }
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (previousProps.pageName !== this.props.pageName && this.state.hasError) {
      this.setState({
        hasError: false,
        error: undefined,
      });
    }
  }

  private refreshPage = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage =
      import.meta.env.DEV && this.state.error?.message
        ? this.state.error.message
        : 'The page could not be displayed properly. Please refresh the page and try again.';

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f3ea] px-5 py-12 text-[#1b1712] dark:bg-[#070807] dark:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(169,132,67,0.18),transparent_34%),linear-gradient(135deg,rgba(23,56,45,0.12),transparent_42%)]" />
        <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-[#a98443]/50 to-transparent" />
        <div className="absolute inset-x-10 bottom-10 h-px bg-gradient-to-r from-transparent via-[#a98443]/30 to-transparent" />

        <section className="relative w-full max-w-xl border border-[#a98443]/30 bg-white/76 p-8 shadow-[0_30px_100px_rgba(27,23,18,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-[#a98443]/40 bg-[#f4ead9] text-[#7a5a24] dark:bg-white/10 dark:text-[#e6c88b]">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#8a6a35] dark:text-[#e6c88b]">
                Display notice
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                This page needs to reload
              </h1>
            </div>
          </div>

          <p className="max-w-lg text-sm leading-7 text-[#6c6257] dark:text-white/70">
            {errorMessage}
          </p>

          {import.meta.env.DEV && this.props.pageName ? (
            <div className="mt-5 border border-[#1b1712]/10 bg-[#1b1712]/[0.03] p-4 text-xs text-[#6c6257] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              <span className="font-semibold text-[#1b1712] dark:text-white">Page:</span>{' '}
              {this.props.pageName}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.refreshPage}
              className="inline-flex items-center gap-2 border border-[#17382d] bg-[#17382d] px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#10271f] dark:border-[#e6c88b] dark:bg-[#e6c88b] dark:text-[#17120a]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <a
              href="/"
              className="inline-flex items-center border border-[#1b1712]/15 bg-white/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#1b1712] transition duration-300 hover:-translate-y-0.5 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Return home
            </a>
          </div>
        </section>
      </main>
    );
  }
}
