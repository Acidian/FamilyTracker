import React from 'react';
import ReactDOM from 'react-dom/client';
import { FamilyProvider } from './store';
import App from './App';
import './styles.css';
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: boolean}> {
  state = {error:false};
  static getDerivedStateFromError() { return {error:true}; }
  render() { return this.state.error ? <main className="crash"><h1>Let’s try that again.</h1><p>Nightlight couldn’t open this view. Your saved records have not been cleared.</p><button onClick={() => location.reload()}>Reload Nightlight</button></main> : this.props.children; }
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><FamilyProvider><App/></FamilyProvider></ErrorBoundary></React.StrictMode>);
