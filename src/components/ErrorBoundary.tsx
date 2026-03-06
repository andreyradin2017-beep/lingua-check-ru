import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            background: "var(--bg-app, #121212)",
            color: "var(--text-primary, #fff)",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              padding: "1.5rem",
              borderRadius: "50%",
              marginBottom: "1.5rem",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <AlertTriangle size={48} color="var(--error, #ef4444)" />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "1rem",
            }}
          >
            Что-то пошло не так
          </h1>
          <p
            style={{
              color: "var(--text-secondary, #a1a1aa)",
              marginBottom: "2rem",
              maxWidth: "300px",
              lineHeight: "1.5",
            }}
          >
            Произошла неожиданная ошибка. Мы уже работаем над ее исцелением.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: "var(--primary, #8b5cf6)",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            }}
          >
            <RefreshCw size={18} />
            Обновить страницу
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: "2rem",
                padding: "1rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                fontSize: "0.7rem",
                textAlign: "left",
                maxWidth: "100%",
                overflow: "auto",
                color: "var(--error, #ef4444)",
              }}
            >
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
