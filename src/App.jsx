import { useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" fill="currentColor" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" fill="currentColor" opacity=".65" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v5h4M9 13h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M10 4h4l1 3H9l1-3ZM8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function fetchDocuments() {
      try {
        const response = await fetch(`${API_URL}/documents`);
        if (!response.ok) throw new Error('Could not load documents');
        const data = await response.json();
        if (!ignore) {
          setDocuments(data);
          setError('');
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      }
    }

    fetchDocuments();
    return () => { ignore = true; };
  }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxFileSize = 100 * 1024 * 1024;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      event.target.value = '';
      return;
    }
    if (file.size > maxFileSize) {
      setError('PDF must be 100 MB or smaller.');
      event.target.value = '';
      return;
    }

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

    const document = documents.find((doc) => doc.document_id === selectedDocument);
    const confirmed = window.confirm(
      `Delete "${document?.document_name || 'this document'}" and all of its indexed chunks?`
    );
    if (!confirmed) return;

    setError('');
    try {
      const response = await fetch(
        `${API_URL}/documents/${selectedDocument}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Delete failed (${response.status})`);
      }

      setSelectedDocument('');
      await loadDocuments();
      setAnswer('');
      setSources([]);
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedDoc = documents.find((doc) => doc.document_id === selectedDocument);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><SparkIcon /></div>
          <div>
            <div className="brand-name">RAG<span>•</span>Copilot</div>
            <div className="brand-caption">Compliance intelligence workspace</div>
          </div>
        </div>
        <div className="topbar-status">
          <span className="status-dot" />
          Grounded retrieval
        </div>
      </header>

      <main className="workspace">
        <section className="hero">
          <div className="eyebrow"><span /> DOCUMENT INTELLIGENCE</div>
          <h1>Ask your reports.<br /><em>Get evidence, not guesses.</em></h1>
          <p>
            Upload BRSR and ESG reports, ask natural-language questions, and trace
            every answer back to the exact pages that support it.
          </p>
        </section>

        <section className="control-card">
          <div className="section-heading">
            <div>
              <span className="step-label">01 / SOURCE</span>
              <h2>Choose your report</h2>
            </div>
            {documents.length > 0 && (
              <span className="document-count">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
            )}
          </div>

          <div className="document-controls">
            <label className="upload-zone">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
                hidden
              />
              <span className="upload-icon"><UploadIcon /></span>
              <span className="upload-copy">
                <strong>{uploading ? 'Processing report…' : 'Upload PDF'}</strong>
                <small>PDF only · up to 100 MB</small>
              </span>
              <span className="upload-arrow"><ArrowIcon /></span>
            </label>

            <div className="select-wrap">
              <span className="field-label">ACTIVE DOCUMENT</span>
              <select value={selectedDocument} onChange={(e) => setSelectedDocument(e.target.value)}>
                <option value="">All documents</option>
                {documents.map((doc) => (
                  <option key={doc.document_id} value={doc.document_id}>
                    {doc.document_name} ({doc.pages} pages)
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument && (
              <button type="button" className="delete-button" onClick={handleDelete} title="Delete selected document">
                <TrashIcon />
              </button>
            )}
          </div>

          {selectedDoc && (
            <div className="document-meta">
              <div className="meta-file"><FileIcon /></div>
              <div className="meta-copy">
                <strong>{selectedDoc.document_name}</strong>
                <span>{selectedDoc.pages} pages · {selectedDoc.chunks} indexed chunks</span>
              </div>
              <span className="indexed-pill">INDEXED</span>
            </div>
          )}
        </section>

        <section className="query-section">
          <div className="section-heading query-heading">
            <div>
              <span className="step-label">02 / ASK</span>
              <h2>What do you want to know?</h2>
            </div>
            <span className="query-hint">Answers are grounded in your uploaded reports</span>
          </div>

          <form onSubmit={handleSubmit} className="query-box">
            <div className="query-input-wrap">
              <span className="query-prefix">⌁</span>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What percentage of the Board of Directors are female?"
                disabled={loading}
                aria-label="Ask a question"
              />
              <span className="query-shortcut">ENTER ↵</span>
            </div>
            <button type="submit" className="ask-button" disabled={loading || documents.length === 0 || !question.trim()}>
              <span>{loading ? 'Analyzing…' : 'Ask Copilot'}</span>
              {!loading && <ArrowIcon />}
            </button>
          </form>

          {documents.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><FileIcon /></div>
              <div>
                <strong>Start with a report</strong>
                <span>Upload a BRSR or ESG PDF above to unlock grounded question answering.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="error">
              <span className="error-mark">!</span>
              <span>{error}</span>
            </div>
          )}
        </section>

        {(answer || sources.length > 0) && (
          <section className="results-section">
            <div className="results-divider">
              <span>03 / EVIDENCE</span>
              <div />
              <span>{sources.length} source{sources.length === 1 ? '' : 's'}</span>
            </div>

            {answer && (
              <article className="answer-card">
                <div className="answer-glow" />
                <div className="answer-topline">
                  <span className="verified-badge"><span /> GROUNDED ANSWER</span>
                  {selectedDoc && <span className="answer-document">{selectedDoc.document_name}</span>}
                </div>
                <div className="answer-content">
                  <h2>{answer}</h2>
                </div>
              </article>
            )}

            {sources.length > 0 && (
              <div className="sources-section">
                <div className="sources-heading">
                  <div>
                    <span className="step-label">SUPPORTING EVIDENCE</span>
                    <h2>Verified source passages</h2>
                  </div>
                  <span>Ranked by retrieval relevance</span>
                </div>

                <div className="source-grid">
                  {sources.map((source, index) => (
                    <article key={source.chunk_id} className="source-card">
                      <div className="source-number">0{index + 1}</div>
                      <div className="source-card-main">
                        <div className="source-header">
                          <div className="source-location">
                            <span className="page-badge">PAGE {source.page_start}</span>
                            <span>{source.document_name}</span>
                          </div>
                          <span className="score">RELEVANCE {source.score}</span>
                        </div>
                        <p className="source-text">{source.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="footer">
          <span>RAG Compliance Copilot</span>
          <span>Hybrid retrieval · Page-aware evidence · Grounded generation</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
