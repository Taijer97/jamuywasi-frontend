import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  public render() {
    const { fallbackTitle, fallbackMessage } = ((this as any).props || {}) as Props;
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black text-rose-900">
                {fallbackTitle || 'Ocurrió un error al cargar esta sección'}
              </h4>
              <p className="text-xs text-rose-800/90 leading-relaxed">
                {fallbackMessage ||
                  'Hubo un problema inesperado al procesar los datos de esta vista. Puedes intentar reintentar la carga.'}
              </p>
              {this.state.error?.message && (
                <p className="text-[11px] font-mono bg-white/80 p-2 rounded-lg text-rose-700 border border-rose-200 mt-2">
                  {this.state.error.message}
                </p>
              )}
            </div>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs border border-neutral-200 transition-colors cursor-pointer"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props?.children;
  }
}
