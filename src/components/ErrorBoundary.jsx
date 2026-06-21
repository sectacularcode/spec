import { Component } from "react";

// Catches any unhandled React render errors and shows a clean fallback
// instead of a blank white screen. Wrap the app root in main.jsx.
//
// Usage:
//   <ErrorBoundary>
//     <App />
//   </ErrorBoundary>

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        background: "#fafafa",
        padding: "40px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "32px", fontWeight: 800, color: "#09090b", marginBottom: "8px" }}>
          spec.
        </div>
        <div style={{ fontSize: "16px", color: "#6b7280", marginBottom: "24px", maxWidth: "400px" }}>
          Something went wrong. Reload the page to continue — your work is saved.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            background: "#b45309",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}>
          Reload
        </button>
        {import.meta.env.DEV && (
          <pre style={{
            marginTop: "32px",
            padding: "16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#991b1b",
            textAlign: "left",
            maxWidth: "600px",
            overflow: "auto",
          }}>
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}
