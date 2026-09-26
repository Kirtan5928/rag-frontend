# RAG Compliance Copilot — Frontend

React + Vite frontend for the RAG Compliance Copilot.

## Product role

The frontend provides the user-facing workflow for uploading BRSR/ESG reports, selecting an indexed document, asking questions, and inspecting grounded evidence.

## Features

- Upload PDF reports
- 100 MB client-side upload limit
- Select an indexed document or query across all documents
- Ask grounded compliance/ESG questions
- Display generated answers with page-level source chunks
- Display source relevance information
- Delete indexed documents
- Clear loading, empty, and API-error states
- Production configuration through `VITE_API_URL`
- Responsive layout for desktop and mobile
- Reduced-motion support
- Premium dark visual system with animated ambient background
- 3D/tactile hover interactions for interactive controls and source cards

## User workflow

```text
Open application
     │
     ▼
View indexed document state
     │
     ├── Upload PDF ──► backend ingestion
     │
     ▼
Select document (optional)
     │
     ▼
Enter compliance question
     │
     ▼
Ask Copilot
     │
     ▼
View grounded answer
     │
     ▼
Inspect source pages/chunks
```

## Local development

Install dependencies:

```bash
npm install
```

Create `.env.local` if the backend is not running on the default local URL:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

The default development URL is:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
```

Preview the generated production build:

```bash
npm run preview
```

Vite writes the production bundle to `dist/`.

## Backend contract

The frontend expects:

- `GET /documents`
- `POST /ingest`
- `POST /query`
- `DELETE /documents/{document_id}`

Backend repository:

https://github.com/Kirtan5928/rag-compliance-copilot

## Deployment

The frontend is deployed as a Vite static application on Vercel and connects to the deployed FastAPI backend through `VITE_API_URL`.

The frontend is intentionally presentation-focused: retrieval, ranking, grounding, abstention, and document processing remain backend responsibilities.

## Design notes

The interface is designed around three principles:

1. **Evidence first:** answers are paired with source cards rather than presented as isolated chat text.
2. **Low-friction workflow:** upload, select, ask, inspect.
3. **Visual hierarchy:** the active document, question composer, grounded answer, and evidence sources are visually separated without adding unnecessary container boxes.

The global root container uses the full viewport width so the application does not render artificial vertical side borders around the centered workspace.
