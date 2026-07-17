import { useState, useRef, useEffect } from 'react'
import './index.css'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [atsData, setAtsData] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState('') // 'upload', 'analyze', 'ats', 'questions'
  
  // Tab control: 'suggestions', 'ats', 'questions', 'chat'
  const [activeTab, setActiveTab] = useState('suggestions')

  const [chatQuery, setChatQuery] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadStatus('')
      setIsError(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!")
      return
    }

    setLoading(true)
    setLoadingType('upload')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        setUploadStatus(data.message)
        setIsError(false)
        
        // Reset states for the new resume
        setAnalysisData(null)
        setAtsData(null)
        setQuestions(null)
        setChatHistory([])
        setActiveTab('suggestions')
      } else {
        setUploadStatus(`Error: ${data.detail}`)
        setIsError(true)
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`)
      setIsError(true)
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const handleAnalyze = async () => {
    setActiveTab('suggestions')
    setLoading(true)
    setLoadingType('analyze')
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-resume`)
      const data = await response.json()
      if (response.ok) {
        setAnalysisData(data)
      } else {
        alert(`Error: ${data.detail || 'Could not analyze resume'}`)
      }
    } catch (error) {
      alert(`Error analyzing: ${error.message}`)
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const handleAtsScore = async () => {
    setActiveTab('ats')
    setLoading(true)
    setLoadingType('ats')
    try {
      const response = await fetch(`${API_BASE_URL}/ats-score`)
      const data = await response.json()
      if (response.ok) {
        setAtsData(data)
      } else {
        alert(`Error: ${data.detail || 'Could not fetch ATS score'}`)
      }
    } catch (error) {
      alert(`Error getting ATS score: ${error.message}`)
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const handleGenerateQuestions = async () => {
    setActiveTab('questions')
    setLoading(true)
    setLoadingType('questions')
    try {
      const response = await fetch(`${API_BASE_URL}/generate-questions`)
      const data = await response.json()
      if (response.ok) {
        setQuestions(data)
      } else {
        alert(`Error: ${data.detail || 'Could not generate questions'}`)
      }
    } catch (error) {
      alert(`Error generating questions: ${error.message}`)
    } finally {
      setLoading(false)
      setLoadingType('')
    }
  }

  const handleChat = async () => {
    if (!chatQuery.trim()) return
    const currentQuery = chatQuery
    setChatQuery('')
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }])
    setChatLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery })
      })
      const data = await response.json()
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        alert(data.detail || 'Failed to get chat response')
      }
    } catch (error) {
      alert(`Chat error: ${error.message}`)
    } finally {
      setChatLoading(false)
    }
  }

  const handleAskInChat = async (questionText) => {
    const queryText = `How should I answer this interview question based on my resume: "${questionText}"?`;
    
    // Switch to chat tab
    setActiveTab('chat');
    
    // Add to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: queryText }]);
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await response.json();
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        alert(data.detail || 'Failed to get chat response');
      }
    } catch (error) {
      alert(`Chat error: ${error.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null)
    setUploadStatus('')
    setIsError(false)
    setAnalysisData(null)
    setAtsData(null)
    setQuestions(null)
    setChatHistory([])
    setActiveTab('suggestions')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Calculate Dash Offset for ATS Radial SVG
  const calculateStrokeOffset = (score) => {
    const r = 70; // radius
    const c = 2 * Math.PI * r; // circumference (439.8)
    if (!score) return c;
    return c - (score / 100) * c;
  }

  const renderQuestions = (questionsText) => {
    if (!questionsText) return null;
    const lines = questionsText.split('\n');
    return (
      <div className="tab-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          const match = trimmed.match(/^(?:\d+\.|\-|\*)\s*(.+)$/);
          if (match) {
            const questionBody = match[1];
            return (
              <div 
                key={idx} 
                className="breakdown-item" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  textAlign: 'left', 
                  gap: '15px', 
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#e5e7eb', flex: 1, lineHeight: '1.5' }}>
                  {trimmed}
                </span>
                <button
                  onClick={() => handleAskInChat(questionBody)}
                  style={{
                    background: 'var(--grad-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  💬 Ask AI
                </button>
              </div>
            );
          }
          
          return (
            <h4 
              key={idx} 
              style={{ 
                margin: '12px 0 4px 0', 
                color: 'var(--color-secondary)', 
                fontSize: '14px', 
                fontWeight: '700',
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                paddingBottom: '3px'
              }}
            >
              {trimmed}
            </h4>
          );
        })}
      </div>
    );
  };

  const hasUploaded = uploadStatus && !isError;

  // Extracted upload card content
  const uploadCard = (
    <div className="card">
      <h2 className="card-title">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/>
        </svg>
        Resume Upload
      </h2>
      
      {!uploadStatus && (
        <div className="upload-zone" onClick={triggerFileInput}>
          <div className="upload-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <p className="upload-text">Select Resume PDF</p>
          <p className="upload-subtext">Click to browse files</p>
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input" 
            accept=".pdf" 
            onChange={handleFileChange} 
          />
        </div>
      )}

      {file && (
        <div className="selected-file-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <span className="file-icon">📄</span>
            <span style={{ fontWeight: '500', wordBreak: 'break-all', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {file.name}
            </span>
          </div>
          {!uploadStatus && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                padding: '2px 6px',
              }}
            >
              Change
            </button>
          )}
        </div>
      )}

      {!uploadStatus && (
        <button 
          className="btn-upload" 
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading && loadingType === 'upload' ? 'Parsing...' : 'Upload & Build Vector Store'}
        </button>
      )}

      {uploadStatus && (
        <div style={{ marginTop: '15px' }}>
          <div className={`status-box ${isError ? 'error' : ''}`}>
            {uploadStatus}
          </div>
          <button 
            className="btn-action"
            style={{
              marginTop: '15px',
              width: '100%',
              justifyContent: 'center',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#f87171'
            }}
            onClick={handleReset}
          >
            🔄 Upload Different Resume
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <span className="logo-badge">RAG-Powered Engine</span>
        <div>
          <h1 className="app-title">AI Resume Analyzer</h1>
        </div>
        <p className="app-subtitle">Upload resume PDF for real-time ATS scoring, LLM suggestions, and interactive chat.</p>
      </header>

      {/* Centered Upload (Default) vs Dashboard Grid (After Upload) */}
      {!hasUploaded ? (
        <div style={{ maxWidth: '520px', margin: '40px auto 0 auto', animation: 'scaleIn 0.4s ease-out' }}>
          {uploadCard}
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* Left Column: Upload & Actions */}
          <div className="left-column">
            {uploadCard}

            {/* Card 2: Operations Hub (visible only after upload) */}
            <div className="card" style={{ animation: 'scaleIn 0.3s' }}>
              <h2 className="card-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                </svg>
                Analysis Hub
              </h2>
              <div className="action-grid">
                <button 
                  className="btn-action" 
                  onClick={handleAnalyze} 
                  disabled={loading}
                >
                  <span>🔍 Domain & AI Audit</span>
                  <span className="btn-action-arrow">→</span>
                </button>
                <button 
                  className="btn-action" 
                  onClick={handleAtsScore} 
                  disabled={loading}
                >
                  <span>📊 Calculate ATS Score</span>
                  <span className="btn-action-arrow">→</span>
                </button>
                <button 
                  className="btn-action" 
                  onClick={handleGenerateQuestions} 
                  disabled={loading}
                >
                  <span>💡 Tailored Interview Qs</span>
                  <span className="btn-action-arrow">→</span>
                </button>
                <button 
                  className="btn-action" 
                  onClick={() => setActiveTab('chat')}
                  disabled={loading}
                >
                  <span>💬 Chat with Resume</span>
                  <span className="btn-action-arrow">→</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Tabbed Displays */}
          <div className="right-column">
            
            <div className="card">
              
              {/* Tab Header Bar */}
              <div className="results-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggestions')}
                >
                  🔍 Suggestions
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'ats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ats')}
                >
                  📊 ATS Score
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('questions')}
                >
                  💡 Questions
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  💬 Chat
                </button>
              </div>

              {/* Tab Content Panel */}
              <div className="tab-content-container">

                {/* Loading Spinner Overlays Tab Area */}
                {loading && loadingType !== 'upload' && (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <span style={{ fontWeight: '500', fontSize: '14.5px' }}>
                      {loadingType === 'analyze' && 'Running AI suggestions and domain classifier...'}
                      {loadingType === 'ats' && 'Evaluating keywords, experience and structure parameters...'}
                      {loadingType === 'questions' && 'Tailoring technical and behavioral questions...'}
                    </span>
                  </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === 'suggestions' && !loading && (
                  !analysisData ? (
                    <div className="placeholder-cta" style={{ animation: 'scaleIn 0.2s' }}>
                      <p>Run domain detection and extract improvement suggestions for this resume.</p>
                      <button className="btn-action" style={{ justifyContent: 'center', width: '220px' }} onClick={handleAnalyze}>
                        🔍 Domain & AI Audit
                      </button>
                    </div>
                  ) : (
                    <div className="tab-scroll-container" style={{ animation: 'scaleIn 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '17px' }}>AI suggestions</h3>
                        <span className="domain-badge">{analysisData.domain}</span>
                      </div>
                      <pre className="ai-suggestions-pre">
                        {analysisData.ai_suggestions}
                      </pre>
                    </div>
                  )
                )}

                {/* ATS Score Tab */}
                {activeTab === 'ats' && !loading && (
                  !atsData ? (
                    <div className="placeholder-cta" style={{ animation: 'scaleIn 0.2s' }}>
                      <p>Analyze how well your resume matches ATS filters and extract missing keywords.</p>
                      <button className="btn-action" style={{ justifyContent: 'center', width: '220px' }} onClick={handleAtsScore}>
                        📊 Calculate ATS Score
                      </button>
                    </div>
                  ) : (
                    <div className="tab-scroll-container" style={{ animation: 'scaleIn 0.2s' }}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '17px' }}>ATS Evaluation</h3>
                      
                      <div className="ats-score-container">
                        <div className="score-radial">
                          <svg width="150" height="150">
                            <circle className="score-radial-bg" cx="75" cy="75" r="70" />
                            <circle 
                              className="score-radial-progress" 
                              cx="75" 
                              cy="75" 
                              r="70" 
                              strokeDasharray="439.8"
                              strokeDashoffset={calculateStrokeOffset(atsData.total_score)}
                            />
                          </svg>
                          <div className="score-text-overlay">
                            <span className="score-number">{atsData.total_score}</span>
                            <div className="score-label">Score</div>
                          </div>
                        </div>

                        <div className="breakdown-grid">
                          {Object.entries(atsData.breakdown).map(([key, value]) => (
                            <div className="breakdown-item" key={key}>
                              <div className="breakdown-item-value">{value}</div>
                              <div className="breakdown-item-name">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="missing-skills-box">
                        <h4 className="missing-skills-title">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          Detected Missing Key Skills
                        </h4>
                        {atsData.missing_skills && atsData.missing_skills.length > 0 ? (
                          <div className="skills-badge-container">
                            {atsData.missing_skills.map((skill, index) => (
                              <span className="skill-badge" key={index}>{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: '0', color: 'var(--color-success)', fontSize: '13.5px', fontWeight: '500' }}>
                            ✓ Perfect! No major missing skills detected.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && !loading && (
                  !questions ? (
                    <div className="placeholder-cta" style={{ animation: 'scaleIn 0.2s' }}>
                      <p>Generate domain-specific technical and behavioral questions to test your prep.</p>
                      <button className="btn-action" style={{ justifyContent: 'center', width: '220px' }} onClick={handleGenerateQuestions}>
                        💡 Generate Questions
                      </button>
                    </div>
                  ) : (
                    renderQuestions(questions.questions)
                  )
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && !loading && (
                  <div className="chat-tab-container" style={{ animation: 'scaleIn 0.2s' }}>
                    <div className="chat-history">
                      {chatHistory.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: 'auto', fontSize: '14px', maxWidth: '300px' }}>
                          Ask anything about this resume (e.g. key projects, degree details, or skill proof).
                        </p>
                      ) : (
                        chatHistory.map((msg, idx) => (
                          <div className={`chat-bubble ${msg.role}`} key={idx}>
                            <div className="chat-bubble-sender">
                              {msg.role === 'user' ? 'You' : 'Assistant'}
                            </div>
                            <p className="chat-bubble-content">{msg.content}</p>
                          </div>
                        ))
                      )}
                      
                      {chatLoading && (
                        <div className="chat-loading-indicator">
                          <span>Vector RAG searching</span>
                          <span className="dot-flashing"></span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="chat-input-wrapper">
                      <input 
                        type="text" 
                        className="chat-input"
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="e.g. Detail the candidate's projects..."
                        onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                        disabled={chatLoading}
                      />
                      <button 
                        className="chat-btn-send" 
                        onClick={handleChat} 
                        disabled={chatLoading || !chatQuery.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  )
}

export default App
