import { useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadDocuments() {
    try {
      const response = await fetch(`${API_URL}/documents`);
      if (!response.ok) throw new Error('Could not load documents');
      setDocuments(await response.json());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadDocuments(); }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/ingest`, { method: 'POST', body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${response.status})`);
      }
      const data = await response.json();
      await loadDocuments();
      setSelectedDocument(data.document_id);
      setAnswer(`Ingested ${data.filename}: ${data.pages_extracted} pages, ${data.chunks_stored} chunks.`);
      setSources([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          hybrid_threshold: 0.0,
          document_id: selectedDocument || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Server responded with ${response.status}`);
      }
      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedDocument) return;
    const response = await fetch(`${API_URL}/documents/${selectedDocument}`, { method: 'DELETE' });
    if (response.ok) {
      setSelectedDocument('');
      await loadDocuments();
      setAnswer('');
      setSources([]);
    }
  }

  return (
    <div className="app-container">
      <h1>RAG Compliance Copilot</h1>
      <p className="subtitle">Upload BRSR/ESG reports and ask grounded questions with page-level sources.</p>

      <section className="document-panel">
        <label className="upload-button">
          {uploading ? 'Uploading...' : 'Upload PDF'}
          <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} disabled={uploading} hidden />
        </label>

        <select value={selectedDocument} onChange={(e) => setSelectedDocument(e.target.value)}>
          <option value="">All documents</option>
          {documents.map((doc) => (
            <option key={doc.document_id} value={doc.document_id}>
              {doc.document_name} ({doc.pages} pages)
            </option>
          ))}
        </select>

        {selectedDocument && (
          <button type="button" className="delete-button" onClick={handleDelete}>Delete</button>
        )}
      </section>

      <form onSubmit={handleSubmit} className="query-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the company's total energy consumption?"
          disabled={loading}
        />
        <button type="submit" disabled={loading || documents.length === 0}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {documents.length === 0 && <p className="hint">Upload a PDF to begin.</p>}
      {error && <p className="error">{error}</p>}

      {answer && (
        <div className="answer-box">
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}

      {sources.length > 0 && (
        <div className="sources-box">
          <h2>Verified Sources</h2>
          {sources.map((source) => (
            <div key={source.chunk_id} className="source-card">
              <div className="source-header">
                <span>{source.document_name} · Page {source.page_start}</span>
                <span className="score">score: {source.score}</span>
              </div>
              <p className="source-text">{source.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
