import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:40,fontFamily:'monospace',color:'var(--color-error)',background:'var(--bg-app)',height:'100%'}}>
          <h1>Render Error</h1>
          <pre style={{whiteSpace:'pre-wrap',fontSize:14,marginTop:16}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:'pre-wrap',fontSize:12,color:'var(--text-secondary)',marginTop:16}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
