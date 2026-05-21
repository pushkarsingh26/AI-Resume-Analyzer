import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [analysisData, setAnalysisData] = useState(null)
  const [atsData, setAtsData] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)

  const [chatQuery, setChatQuery] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload-resume', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        setUploadStatus(data.message)
      } else {
        setUploadStatus(`Error: ${data.detail}`)
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/analyze-resume')
      const data = await response.json()
      setAnalysisData(data)
    } catch (error) {
      alert(`Error analyzing: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAtsScore = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/ats-score')
      const data = await response.json()
      setAtsData(data)
    } catch (error) {
      alert(`Error getting ATS score: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/generate-questions')
      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      alert(`Error generating questions: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    if (!chatQuery.trim()) return
    const currentQuery = chatQuery
    setChatQuery('')
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }])
    setChatLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery })
      })
      const data = await response.json()
      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        alert(data.detail)
      }
    } catch (error) {
      alert(`Chat error: ${error.message}`)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AI Resume Analyzer</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>1. Upload Resume</h2>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading} style={{ marginLeft: '10px' }}>
          Upload
        </button>
        {uploadStatus && <p><strong>Status:</strong> {uploadStatus}</p>}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={handleAnalyze} disabled={loading || !uploadStatus}>Analyze Resume</button>
        <button onClick={handleAtsScore} disabled={loading || !uploadStatus}>Get ATS Score</button>
        <button onClick={handleGenerateQuestions} disabled={loading || !uploadStatus}>Generate Questions</button>
      </div>

      {loading && <p>Loading...</p>}

      {analysisData && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #4CAF50' }}>
          <h2>Analysis Results</h2>
          <p><strong>Detected Domain:</strong> {analysisData.domain}</p>
          <div>
            <strong>AI Suggestions:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px' }}>
              {analysisData.ai_suggestions}
            </pre>
          </div>
        </div>
      )}

      {atsData && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #2196F3' }}>
          <h2>ATS Score: {atsData.total_score}/100</h2>
          
          <h3>Score Breakdown</h3>
          <ul>
            {Object.entries(atsData.breakdown).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>

          <h3>Missing Skills</h3>
          {atsData.missing_skills.length > 0 ? (
            <ul>
              {atsData.missing_skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p>No major missing skills detected for the domain.</p>
          )}
        </div>
      )}

      {questions && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #FF9800' }}>
          <h2>Interview Questions</h2>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px' }}>
            {questions.questions}
          </pre>
        </div>
      )}

      {/* Chatbot System */}
      {uploadStatus && (
        <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #9C27B0' }}>
          <h2>Chat with Resume (RAG)</h2>
          <div style={{ 
            height: '300px', 
            overflowY: 'auto', 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {chatHistory.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>Ask anything about the uploaded resume...</p>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  padding: '10px',
                  maxWidth: '80%'
                }}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                  <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                </div>
              ))
            )}
            {chatLoading && <p style={{ color: '#888' }}>Thinking...</p>}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="e.g., What are the candidate's main skills?"
              style={{ flex: 1, padding: '10px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            />
            <button onClick={handleChat} disabled={chatLoading || !chatQuery.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
