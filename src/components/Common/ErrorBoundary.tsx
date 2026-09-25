import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, WifiOff, Sparkles, LifeBuoy, Home, ChevronDown, Copy } from 'lucide-react';
import { isChunkLoadError } from '../../utils/chunkErrors';

interface Props {
  children: ReactNode;
  /** Título para errores generales (los de conexión y versión nueva tienen su propio texto) */
  fallbackTitle?: string;
  fallbackMessage?: string;
  /** "page": ocupa la pantalla (error general de la app). "section": tarjeta dentro de una pestaña. */
  variant?: 'page' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

type Kind = 'update' | 'offline' | 'generic';

function classify(error: Error | null): Kind {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline) return 'offline';
  if (error && isChunkLoadError(error)) return 'update';
  if (error && /Failed to fetch|NetworkError|Load failed|network/i.test(error.message || '')) return 'offline';
  return 'generic';
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, copied: false };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  public componentDidMount() {
    window.addEventListener('online', this.handleOnline);
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
  }

  // Si el error fue por falta de internet, reintentar solo cuando vuelve la conexión
  private handleOnline = () => {
    if (this.state.hasError && classify(this.state.error) !== 'generic') this.handleReset();
  };

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, copied: false });
  };

  private goHome = () => {
    window.location.href = '/';
  };

  private copyDetails = async () => {
    const text = `${this.state.error?.name || 'Error'}: ${this.state.error?.message || ''}\nURL: ${window.location.href}\nNavegador: ${navigator.userAgent}\nFecha: ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(text);
      (this as any).setState({ copied: true });
    } catch { /* noop */ }
  };

  public render() {
    const { fallbackTitle, fallbackMessage, variant = 'section', children } = ((this as any).props || {}) as Props;
    if (!this.state.hasError) return children;

    const kind = classify(this.state.error);
    const content = {
      update: {
        icon: <Sparkles className="w-6 h-6" />,
        tone: 'bg-emerald-100 text-emerald-700',
        title: 'Hay una versión nueva de JamuyWasi',
        message: 'Actualizamos la plataforma mientras la tenías abierta. Toca “Actualizar” para cargar la versión nueva. Tu sesión y tu carrito se mantienen.',
        primary: { label: 'Actualizar ahora', icon: <RefreshCw className="w-4 h-4" />, action: () => window.location.reload() },
      },
      offline: {
        icon: <WifiOff className="w-6 h-6" />,
        tone: 'bg-amber-100 text-amber-700',
        title: 'Sin conexión a internet',
        message: 'No pudimos cargar esta parte porque parece que no hay conexión. Revisa tu wifi o datos móviles; en cuanto vuelva la conexión lo intentaremos de nuevo automáticamente.',
        primary: { label: 'Reintentar', icon: <RefreshCw className="w-4 h-4" />, action: this.handleReset },
      },
      generic: {
        icon: <LifeBuoy className="w-6 h-6" />,
        tone: 'bg-rose-100 text-rose-700',
        title: fallbackTitle || 'Algo no salió bien en esta sección',
        message: fallbackMessage || 'No es tu culpa: ocurrió un problema al mostrar esta parte. Tus datos están a salvo. Puedes reintentar o volver al inicio.',
        primary: { label: 'Reintentar', icon: <RefreshCw className="w-4 h-4" />, action: this.handleReset },
      },
    }[kind];

    const card = (
      <div role="alert" className="w-full max-w-md mx-auto bg-white rounded-3xl border border-neutral-200 shadow-lg p-6 sm:p-8 text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${content.tone}`}>
          {content.icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black text-neutral-900 leading-snug">{content.title}</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">{content.message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={content.primary.action}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {content.primary.icon}
            <span>{content.primary.label}</span>
          </button>
          <button
            type="button"
            onClick={this.goHome}
            className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ir al inicio</span>
          </button>
        </div>

        {kind === 'generic' && this.state.error?.message && (
          <details className="group text-left pt-2 border-t border-neutral-100">
            <summary className="list-none cursor-pointer text-xs text-neutral-500 hover:text-neutral-800 flex items-center justify-center gap-1 select-none">
              <span>Detalles técnicos (para soporte)</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-2">
              <p className="text-xs font-mono bg-neutral-50 p-2.5 rounded-lg text-neutral-700 border border-neutral-200 break-words">
                {this.state.error.message}
              </p>
              <button
                type="button"
                onClick={this.copyDetails}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{this.state.copied ? 'Copiado' : 'Copiar detalles para enviar a soporte'}</span>
              </button>
            </div>
          </details>
        )}
      </div>
    );

    return variant === 'page'
      ? <div className="min-h-[80vh] flex items-center justify-center p-4 bg-neutral-50">{card}</div>
      : <div className="py-8 px-4">{card}</div>;
  }
}
