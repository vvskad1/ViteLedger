import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import './CareTakerAI.css';

const CareTakerAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hi! I'm CareTaker, your VitalEdger assistant. I can help you understand how to use the app, explain features, and answer questions about your health tracking journey. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    "How do I track my fitness?",
    "What can the AI therapist help me with?",
    "How do I upload lab reports?",
    "Tell me about the reminder system",
    "How does web knowledge work?",
    "What features does VitalEdger have?"
  ];

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/caretaker/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: data.response,
          timestamp: new Date(),
          contextUsed: data.context_used
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestionClick = (question) => {
    sendMessage(question);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="caretaker-ai-container"
      >
        <div className="caretaker-ai-header">
          <div className="header-icon-wrapper">
            <Bot size={36} className="header-icon" />
            <Sparkles size={18} className="sparkle-icon" />
          </div>
          <h1>CareTaker AI Assistant</h1>
          <p>Your guide to understanding and using VitalEdger</p>
        </div>

        <Card className="chat-card">
          <div className="chat-container">
            <div className="messages-container">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`chat-message ${message.type}`}
                  >
                    {message.type === 'ai' && (
                      <div className="message-icon">
                        <Bot size={20} />
                      </div>
                    )}
                    <div className="message-content">
                      <p>{message.text}</p>
                      {message.contextUsed && (
                        <span className="context-badge">
                          <BookOpen size={12} />
                          Knowledge Base
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="chat-message ai"
                >
                  <div className="message-icon">
                    <Bot size={20} />
                  </div>
                  <div className="message-content loading">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="suggestions-container"
              >
                <div className="suggestions-header">
                  <HelpCircle size={18} />
                  <span>Try asking:</span>
                </div>
                <div className="suggestions-grid">
                  {suggestedQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="suggestion-pill"
                      onClick={() => handleSuggestionClick(question)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="chat-input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about VitalEdger..."
                className="chat-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={loading || !input.trim()}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default CareTakerAI;
