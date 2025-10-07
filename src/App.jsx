import { useState, useEffect } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('chatkit_api_key') || '');
  const [workflows, setWorkflows] = useState(() => {
    const saved = localStorage.getItem('chatkit_workflows');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeWorkflowId, setActiveWorkflowId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('workflow') || localStorage.getItem('chatkit_active_workflow') || '';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('chatkit_sidebar_collapsed');
    return saved === 'true';
  });
  const [newWorkflowId, setNewWorkflowId] = useState('');
  const [newWorkflowLabel, setNewWorkflowLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (activeWorkflowId && apiKey && !clientSecret) {
      loadWorkflow(activeWorkflowId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatkit_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('chatkit_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const loadWorkflow = async (workflowId) => {
    if (!apiKey || !workflowId) return;

    setLoading(true);
    setError('');
    setClientSecret(null);

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
      setClientSecret(data.client_secret);
      setActiveWorkflowId(workflowId);
      localStorage.setItem('chatkit_active_workflow', workflowId);

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

  const handleAddWorkflow = () => {
    if (!newWorkflowId.trim()) return;

    const workflow = {
      id: newWorkflowId.trim(),
      label: newWorkflowLabel.trim() || newWorkflowId.trim().substring(0, 20)
    };

    setWorkflows([...workflows, workflow]);
    setNewWorkflowId('');
    setNewWorkflowLabel('');
    setShowAddForm(false);
    loadWorkflow(workflow.id);
  };

  const handleDeleteWorkflow = (workflowId) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    if (activeWorkflowId === workflowId) {
      setClientSecret(null);
      setActiveWorkflowId('');
      localStorage.removeItem('chatkit_active_workflow');
    }
  };

  const handleSwitchWorkflow = (workflowId) => {
    if (workflowId !== activeWorkflowId) {
      loadWorkflow(workflowId);
    }
  };

  return (
    <div className="app-layout">
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {!sidebarCollapsed ? (
          <>
            <div className="sidebar-header">
              <h2>ChatKit Link</h2>
            </div>

            <div className="api-key-section">
              <label htmlFor="api-key">API Key</label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('chatkit_api_key', e.target.value);
                }}
                placeholder="sk-proj-..."
                disabled={loading}
              />
            </div>

            <div className="workflows-section">
              <button
                className="add-workflow-btn"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                + Add Workflow
              </button>

              {showAddForm && (
                <div className="add-workflow-form">
                  <input
                    type="text"
                    placeholder="Workflow label (optional)"
                    value={newWorkflowLabel}
                    onChange={(e) => setNewWorkflowLabel(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="wf_abc123..."
                    value={newWorkflowId}
                    onChange={(e) => setNewWorkflowId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddWorkflow()}
                  />
                  <div className="form-actions">
                    <button onClick={handleAddWorkflow}>Add</button>
                    <button onClick={() => setShowAddForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {workflows.length > 0 && (
                <div className="workflows-label">Workflows:</div>
              )}

              <div className="workflows-list">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`workflow-item ${activeWorkflowId === workflow.id ? 'active' : ''}`}
                    onClick={() => handleSwitchWorkflow(workflow.id)}
                  >
                    <div className="workflow-info">
                      {activeWorkflowId === workflow.id && <span className="checkmark">✓</span>}
                      <div className="workflow-details">
                        <div className="workflow-label">{workflow.label}</div>
                        <div className="workflow-id">{workflow.id.substring(0, 15)}...</div>
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkflow(workflow.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(true)}
            >
              ← Collapse
            </button>
          </>
        ) : (
          <>
            <div className="sidebar-logo">C</div>
            <button
              className="expand-btn"
              onClick={() => setSidebarCollapsed(false)}
            >
              →
            </button>
          </>
        )}
      </div>

      <div className="main-content">
        {error && <div className="error">{error}</div>}

        <div className="chat-container">
          {clientSecret ? (
            <ChatKitComponent clientSecret={clientSecret} />
          ) : (
            <div className="placeholder">
              <svg width="64" height="64" fill="#ddd" viewBox="0 0 24 24" style={{ marginBottom: '1rem' }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <p className="value-prop">
                Chat with the agents you've built<br />
                in OpenAI Agent Builder
              </p>
              <p>Add your workflow and API key to get started</p>
              <div className="docs-links">
                <a
                  href="https://platform.openai.com/docs/guides/agent-builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-link"
                >
                  Learn about Agent Builder →
                </a>
                <a
                  href="https://platform.openai.com/docs/guides/chatkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-link"
                >
                  Learn about ChatKit →
                </a>
              </div>
            </div>
          )}
        </div>
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
