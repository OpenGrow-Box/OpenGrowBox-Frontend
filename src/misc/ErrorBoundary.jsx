import React from 'react';
import { useHomeAssistant } from '../Components/Context/HomeAssistantContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingReconnect: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error boundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    // Simple page refresh
    window.location.reload();
  }

  handleReconnect = () => {
    // Try to reconnect if reconnect function is provided
    if (this.props.onReconnect) {
      this.props.onReconnect();
    } else {
      // Fallback to refresh
      this.handleRefresh();
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}
        >
          <h2>Something went wrong</h2>
          <p>We encountered an error in the application.</p>
          <button
            onClick={this.handleRefresh}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            Refresh Page
          </button>
          <button
            onClick={this.handleReconnect}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              margin: '10px'
            }}
          >
            Try Reconnect
          </button>

          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error Details (for developers)</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
