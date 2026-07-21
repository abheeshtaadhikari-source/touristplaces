import React, { useState, useEffect, useRef } from 'react';

const AIWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your AI Travel Assistant. Ask me anything about Indian tourist places, entry fees, weather, or routing!'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of chat window
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || message).trim();
    if (!query || loading) return;

    // Append User Message to local state
    const updatedMessages = [...messages, { sender: 'user', text: query }];
    setMessages(updatedMessages);
    setMessage('');
    setLoading(true);

    try {
      // Map message history context for backend proxy controller
      const chatHistory = messages
        .slice(1) // omit the default welcome prompt
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          text: msg.text
        }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, chatHistory })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
      } else {
        throw new Error(data.error || 'Failed to communicate with AI');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Oops! I encountered an error retrieving that information. Please verify your connection or try again later.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const selectSuggestion = (text) => {
    handleSend(text);
  };

  const suggestions = [
    'Suggest top destinations',
    'What is the best time to visit Jaipur?',
    'What is the entry fee for Taj Mahal?',
    'Route planning tips'
  ];

  return (
    <div className="ai-widget-root">
      {/* Floating launcher bubble button */}
      <button 
        className={`ai-widget-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          // Close Icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="bubble-icon">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Chat Icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="bubble-icon">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* AI Chat Window Panel */}
      {isOpen && (
        <div className="ai-chat-window">
          <header className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar-glow">AI</div>
              <div>
                <h3 className="ai-title-name">Travel Assistant</h3>
                <span className="ai-status-online">Online</span>
              </div>
            </div>
            <button className="ai-close-header-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ai-close-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-bubble-wrapper ${msg.sender}`}>
                <div className="message-bubble">
                  {msg.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className="message-paragraph">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message-bubble-wrapper assistant">
                <div className="message-bubble loading-dots-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions menu */}
          {messages.length === 1 && !loading && (
            <div className="ai-suggestions-grid">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => selectSuggestion(s)}
                  className="suggestion-btn"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <footer className="ai-chat-input-bar">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              className="ai-chat-input"
              disabled={loading}
            />
            <button 
              onClick={() => handleSend()}
              className="ai-chat-send-btn"
              disabled={!message.trim() || loading}
              aria-label="Send Message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="send-icon-svg">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AIWidget;
