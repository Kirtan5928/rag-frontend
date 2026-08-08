import { useState } from 'react';
import './App.css';

const API_URL = 'https://rag-compliance-copilot.onrender.com';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hybrid_threshold: 0.8 }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err) {
      setError(`Failed to get an answer: ${err.message}. Is the FastAPI server running?`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <h1>RAG Compliance Copilot</h1>
      <p className="subtitle">Ask questions about the ingested BRSR/ESG report</p>

      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the company's total energy consumption?"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {answer && (
        <div className="answer-box">
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}

      {sources.length > 0 && (
        <div className="sources-box">
          <h2>Sources (verified retrieval, not LLM-generated)</h2>
          {sources.map((s) => (
            <div key={s.chunk_id} className="source-card">
              <div className="source-header">
                <span className="chunk-id">{s.chunk_id}</span>
                <span className="score">score: {s.score}</span>
              </div>
              <p className="source-text">{s.text.slice(0, 300)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;