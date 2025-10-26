import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Smile, Frown, Meh, Mic, MicOff, Volume2, VolumeX, Brain, Sparkles, Globe, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { mindAdvice } from '../utils/api';
import './Mindfulness.css';

const Mindfulness = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [mood, setMood] = useState('😊');
  const [intensity, setIntensity] = useState(5);
  const [moodNote, setMoodNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [exercises, setExercises] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [useWebKnowledge, setUseWebKnowledge] = useState(true);
  
  // Speech-to-Speech state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [holdToTalkMode, setHoldToTalkMode] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const pendingTranscriptRef = useRef(null);
  const holdToTalkRef = useRef(false);

  const moods = [
    { emoji: '😞', label: 'Sad' },
    { emoji: '😟', label: 'Anxious' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '🙂', label: 'Good' },
    { emoji: '😊', label: 'Happy' }
  ];

  useEffect(() => {
    fetchExercises();
    fetchMoodLogs();
    initSpeechRecognition();
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        console.log('Hold to talk mode (state):', holdToTalkMode);
        console.log('Hold to talk mode (ref):', holdToTalkRef.current);
        
        setMessage(transcript);
        pendingTranscriptRef.current = transcript;
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setHoldToTalkMode(false);
        holdToTalkRef.current = false;
        showNotification('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        console.log('Pending transcript:', pendingTranscriptRef.current);
        console.log('Hold to talk mode (ref) on end:', holdToTalkRef.current);
        
        setIsListening(false);
        
        // Check if we should auto-send after recognition ends
        if (holdToTalkRef.current && pendingTranscriptRef.current && pendingTranscriptRef.current.trim()) {
          const textToSend = pendingTranscriptRef.current;
          pendingTranscriptRef.current = null;
          setHoldToTalkMode(false);
          holdToTalkRef.current = false;
          
          console.log('Auto-sending message:', textToSend);
          
          // Send immediately
          setTimeout(() => {
            sendMessageDirectly(textToSend);
          }, 100);
        }
      };
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showNotification('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMessage('');
      recognitionRef.current.start();
      setIsListening(true);
      showNotification('Listening... Speak now');
    }
  };

  const handleMouseDown = () => {
    if (!recognitionRef.current) {
      showNotification('Speech recognition not supported in this browser');
      return;
    }
    
    setMessage('');
    setHoldToTalkMode(true);
    holdToTalkRef.current = true;  // Set ref immediately
    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleMouseUp = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleMouseLeave = () => {
    // Stop recording if mouse leaves button area (important for Firefox)
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const sendMessageWithText = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text: text };
    setChat(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const data = await mindAdvice(text, useWebKnowledge);
      const aiMsg = { 
        role: 'ai', 
        text: data.response,
        sources: data.sources || []
      };
      setChat(prev => [...prev, aiMsg]);
      
      if (voiceEnabled) {
        speakText(data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMsg = "I'm here to listen. Take a deep breath and know that it's okay to feel what you're feeling. Would a breathing exercise help?";
      setChat(prev => [...prev, { 
        role: 'ai', 
        text: fallbackMsg,
        sources: []
      }]);
      
      if (voiceEnabled) {
        speakText(fallbackMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessageDirectly = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text: text };
    setChat(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      console.log('Sending message:', text, 'useWeb:', useWebKnowledge);
      const data = await mindAdvice(text, useWebKnowledge);
      console.log('Received response:', data);
      const aiMsg = { 
        role: 'ai', 
        text: data.response,
        sources: data.sources || []
      };
      setChat(prev => [...prev, aiMsg]);
      
      if (voiceEnabled) {
        speakText(data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMsg = "I'm here to listen. Take a deep breath and know that it's okay to feel what you're feeling. Would a breathing exercise help?";
      setChat(prev => [...prev, { 
        role: 'ai', 
        text: fallbackMsg,
        sources: []
      }]);
      
      if (voiceEnabled) {
        speakText(fallbackMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for therapeutic effect
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a calm, soothing voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const showNotification = (msg, type = null) => {
    if (type) {
      setNotification({ message: msg, type });
    } else {
      setNotification(msg);
    }
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/mind/mindfulness-exercises', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchMoodLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/mind/mood-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMoodLogs(data.slice(0, 5)); // Show last 5
      }
    } catch (error) {
      console.error('Error fetching mood logs:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', text: message };
    setChat([...chat, userMsg]);
    const messageToSend = message;  // Save message before clearing
    setMessage('');
    setLoading(true);

    try {
      // Use RAG-enabled advice endpoint
      console.log('Sending message:', messageToSend, 'useWeb:', useWebKnowledge);
      const data = await mindAdvice(messageToSend, useWebKnowledge);
      console.log('Received response:', data);
      const aiMsg = { 
        role: 'ai', 
        text: data.response,
        sources: data.sources || []
      };
      setChat(prev => [...prev, aiMsg]);
      
      // Speak the response if voice is enabled
      if (voiceEnabled) {
        speakText(data.response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const fallbackMsg = "I'm here to listen. Take a deep breath and know that it's okay to feel what you're feeling. Would a breathing exercise help?";
      setChat(prev => [...prev, { 
        role: 'ai', 
        text: fallbackMsg,
        sources: []
      }]);
      
      if (voiceEnabled) {
        speakText(fallbackMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const logMood = async () => {
    if (!mood) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/mind/log-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood,
          intensity,
          note: moodNote
        })
      });

      if (response.ok) {
        showNotification('Mood logged successfully! 💚', 'success');
        setMoodNote('');
        fetchMoodLogs();
      }
    } catch (error) {
      showNotification('Failed to log mood', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mindfulness-container"
      >
        <div className="header-title">
          <Heart className="page-icon" size={36} />
          <h1>Mindfulness & Therapy</h1>
        </div>
        <p className="header-subtitle">Your safe space for emotional wellness and mental clarity</p>

        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="mindfulness-grid">
          {/* AI Chat Section */}
          <div className="chat-section">
            <Card className="chat-card">
              <div className="chat-card-header">
                <div className="chat-header-content">
                  <Brain size={24} className="header-icon" />
                  <h3>Talk to Your AI Companion</h3>
                </div>
              </div>
              
              <div className="chat-window">
                {chat.length === 0 && (
                  <div className="chat-empty">
                    <Heart size={48} className="empty-icon" />
                    <p>Hi there 💚 I'm here to listen without judgment.</p>
                    <p className="empty-subtitle">How are you feeling today?</p>
                  </div>
                )}
                
                <AnimatePresence>
                  {chat.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`chat-message ${msg.role}`}
                    >
                      {msg.role === 'ai' ? (
                        <>
                          <div className="ai-message-header">
                            <Sparkles size={16} className="ai-icon" />
                            <div className="message-text">{msg.text}</div>
                          </div>
                          
                          {/* Display sources if available */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="message-sources">
                              <div className="sources-label">Sources:</div>
                              <div className="sources-links">
                                {msg.sources.map((source, idx) => (
                                  <a 
                                    key={idx}
                                    href={source.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="source-pill"
                                  >
                                    {source.title || new URL(source.url).hostname}
                                    <ExternalLink size={12} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="message-text">{msg.text}</div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {loading && (
                  <div className="chat-message ai typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <div className="voice-controls">
                  <button
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                    onTouchCancel={handleMouseUp}
                    className={`voice-button hold-to-talk ${isListening ? 'listening' : ''}`}
                    title="Hold to talk, release to send"
                  >
                    <Mic size={20} />
                    {isListening ? 'Release to send' : 'Hold to talk'}
                  </button>
                  <button
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (!voiceEnabled) {
                        showNotification('Voice responses enabled');
                      } else {
                        stopSpeaking();
                        showNotification('Voice responses disabled');
                      }
                    }}
                    className={`voice-button ${voiceEnabled ? 'active' : ''}`}
                    title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                  >
                    {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="voice-button stop-speaking"
                      title="Stop speaking"
                    >
                      Stop
                    </button>
                  )}
                </div>
                <div className="chat-input-wrapper">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Listening..." : "Share what's on your mind or use the microphone..."}
                    className="chat-input"
                    rows="2"
                    disabled={isListening}
                  />
                  <Button onClick={sendMessage} disabled={loading || !message.trim() || isListening}>
                    <Send size={18} />
                    Send
                  </Button>
                </div>
              </div>

              {/* Web Knowledge Toggle */}
              <div className="web-knowledge-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useWebKnowledge}
                    onChange={(e) => setUseWebKnowledge(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-slider"></span>
                  <Globe size={16} className="toggle-icon" />
                  <span>Use web knowledge</span>
                </label>
                {useWebKnowledge && (
                  <span className="web-knowledge-badge">Web sources enabled</span>
                )}
              </div>
            </Card>

            {/* Mood Tracker */}
            <Card className="mood-card">
              <div className="card-header">
                <Smile size={24} />
                <h3>Log Your Mood</h3>
              </div>
              
              <div className="mood-selector">
                {moods.map(m => (
                  <button
                    key={m.emoji}
                    onClick={() => setMood(m.emoji)}
                    className={`mood-btn ${mood === m.emoji ? 'active' : ''}`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>

              <div className="intensity-slider">
                <label>Intensity: {intensity}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  className="slider"
                />
              </div>

              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Optional note about your mood..."
                className="mood-note-input"
                rows="2"
              />

              <Button onClick={logMood} className="log-mood-btn">
                Save Mood Log
              </Button>
            </Card>
          </div>

          {/* Exercises & Logs Section */}
          <div className="sidebar-section">
            {/* Mindfulness Exercises */}
            <Card className="exercises-card">
              <div className="card-header">
                <Brain size={24} />
                <h3>Guided Exercises</h3>
              </div>
              
              <div className="exercises-list">
                {exercises.map(ex => (
                  <motion.div
                    key={ex.id}
                    whileHover={{ scale: 1.02 }}
                    className="exercise-item"
                  >
                    <span className="exercise-icon">{ex.icon}</span>
                    <div className="exercise-info">
                      <h4>{ex.title}</h4>
                      <p className="exercise-desc">{ex.description}</p>
                      <span className="exercise-duration">{ex.duration}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Recent Mood Logs */}
            {moodLogs.length > 0 && (
              <Card className="mood-history-card">
                <div className="card-header">
                  <Heart size={24} />
                  <h3>Recent Moods</h3>
                </div>
                
                <div className="mood-logs-list">
                  {moodLogs.map(log => (
                    <div key={log.id} className="mood-log-item">
                      <span className="log-mood">{log.mood}</span>
                      <div className="log-details">
                        <span className="log-intensity">{log.intensity}/10</span>
                        <span className="log-date">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Mindfulness;
