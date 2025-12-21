# 🧠 DocuMind

> **A production-grade Retrieval-Augmented Generation (RAG) platform.** > _Upload a PDF. Index it instantly. Chat with it intelligently._

DocuMind is a Full-Stack Next.js application that allows users to interact with their documents using natural language. It leverages vector embeddings, semantic search, and streaming AI responses to provide accurate, context-aware answers.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-green)

---

## ✨ Key Features

- **⚡ Real-Time Streaming:** Zero-latency responses using the Vercel AI SDK (3.3+).
- **🔍 Semantic Search:** Uses OpenAI Embeddings (`text-embedding-3-small`) and Supabase `pgvector` to understand intent, not just keywords.
- **🎙️ Voice Interface:** Integrated Web Speech API for seamless voice-to-text interaction.
- **📝 Rich Text Rendering:** Markdown support for bolding, lists, and formatted code blocks.
- **🧠 Context-Aware:** Smart suggestion pills and follow-up prompts based on conversation history.
- **🎨 Glassmorphism UI:** A polished, fully responsive interface with smooth transitions and loading states.
- **🛡️ Data Integrity:** Strict parsing using `pdf2json` to handle complex PDF structures server-side.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, Framer Motion (animations via clsx/tailwind).
- **Backend:** Next.js API Routes (Edge/Node runtimes).
- **AI Orchestration:** Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai), LangChain.
- **Database:** Supabase (PostgreSQL + pgvector extension).
- **Vector Store:** OpenAI Embeddings.
- **Parsing:** pdf2json (Node.js based PDF parsing).

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/your-username/documind.git](https://github.com/your-username/documind.git)
cd documind
```
