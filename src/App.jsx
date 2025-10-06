import { useState, useEffect } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('chatkit_api_key') || '');
  const [workflowId, setWorkflowId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('workflow') || localStorage.getItem('chatkit_workflow_id') || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (workflowId && apiKey && !clientSecret) {
      handleLoadChat();
    }
  }, []);

  const handleLoadChat = async () => {
    setLoading(true);
    setError('');

    // Save to localStorage
    if (apiKey) localStorage.setItem('chatkit_api_key', apiKey);
    if (workflowId) localStorage.setItem('chatkit_workflow_id', workflowId);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://chatkit-link-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          api_key: apiKey
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create session');
      }

      const data = await response.json();
      console.log('Session response data:', data);
      console.log('client_secret:', data.client_secret);

      setClientSecret(data.client_secret);

      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('workflow', workflowId);
      window.history.pushState({}, '', url);

    } catch (err) {
      setError(err.message);
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>ChatKit Link</h1>
        <p className="subtitle">Demo your ChatKit workflows instantly</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="api-key">API Key:</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLoadChat()}
            placeholder="sk-..."
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <label htmlFor="workflow-id">Workflow ID:</label>
          <input
            id="workflow-id"
            type="text"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLoadChat()}
            placeholder="wf_abc123..."
            disabled={loading}
          />
          <button
            onClick={handleLoadChat}
            disabled={loading || !workflowId || !apiKey}
          >
            {loading ? <span className="loading"></span> : 'Load Chat'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chat-container">
        {clientSecret ? (
          <ChatKitComponent clientSecret={clientSecret} />
        ) : (
          <div className="placeholder">
            <svg width="64" height="64" fill="#ddd" viewBox="0 0 24 24" style={{ marginBottom: '1rem' }}>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p>Enter a workflow ID to start</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatKitComponent({ clientSecret }) {
  console.log('ChatKitComponent rendered with clientSecret:', clientSecret);

  useEffect(() => {
    console.log('ChatKitComponent mounted/updated, clientSecret:', clientSecret);
  }, [clientSecret]);

  const chatkit = useChatKit({
    api: {
      async getClientSecret(existing) {
        if (existing) {
          console.log('Refreshing session...');
        }
        return clientSecret;
      },
    },
    theme: {
      colorScheme: 'light',
    },
    startScreen: {
      greeting: 'How can I help you today?',
      prompts: [
        {
          label: 'What can you do?',
          prompt: 'What can you do?',
        }
      ]
    },
    composer: {
      placeholder: 'Ask anything...',
    },
    onError: (error) => {
      console.error('ChatKit error:', error);
    },
  });

  console.log('useChatKit returned chatkit object:', chatkit);
  console.log('control:', chatkit.control);

  // Check if there's an error state
  if (chatkit.error) {
    console.error('ChatKit has error:', chatkit.error);
    return <div className="error">ChatKit Error: {chatkit.error.message}</div>;
  }

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      width: '100%',
      minHeight: '600px',
      overflow: 'hidden'
    }}>
      <ChatKit
        control={chatkit.control}
        style={{
          display: 'block',
          height: '100%',
          width: '100%',
          flex: 1
        }}
      />
    </div>
  );
}

export default App;
