import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // 🛑 If a component crashes, React will toggle this to true
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Ananta AI Core:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // 🎨 Fallback UI instead of a blank white screen
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-background p-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Oops! Ananta AI ran into a snag.</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            A component encountered an unexpected render glitch, but we intercepted it before it crashed completely.
          </p>
          
          <div className="bg-destructive/10 p-4 rounded-xl mb-6 max-w-lg text-sm font-mono text-destructive border border-destructive/20">
            {this.state.error?.message || "Unknown rendering error."}
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:bg-primary/90 transition-all"
          >
            Reload Ananta AI
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}