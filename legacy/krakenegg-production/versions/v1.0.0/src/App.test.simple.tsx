import { useState } from 'react';

function SimpleTestApp() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui',
      background: '#f0f0f0',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1>KrakenEgg Test</h1>
      <p>If you can see this, React is working!</p>
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
        <h2>System Info:</h2>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Platform: {navigator.platform}</p>
        <p>Language: {navigator.language}</p>
      </div>
    </div>
  );
}

export default SimpleTestApp;