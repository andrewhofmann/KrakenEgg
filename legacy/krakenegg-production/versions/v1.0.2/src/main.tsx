import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🦑 Starting KrakenEgg React application...');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('🦑 Root element found, creating React app...');
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('🦑 React app rendered');
} else {
  console.error('🦑 Root element not found!');
}