import { useState } from 'react';

function MinimalApp() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui',
      background: '#f0f0f0',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1 style={{color: 'red', fontSize: '24px'}}>KrakenEgg React Test</h1>
      <p>This is a minimal React component test.</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
      <div style={{ marginTop: '20px' }}>
        <p>If you can see this, React is working correctly!</p>
      </div>
    </div>
  );
}

export default MinimalApp;