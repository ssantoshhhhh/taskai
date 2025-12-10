# AI Task Weaver: Project Architecture & Interview Guide

This document is a comprehensive technical breakdown of the **AI Task Weaver** project. Use this guide to prepare for technical interviews, explaining every component of the application, specifically focusing on the RAG (Retrieval-Augmented Generation) implementation and n8n workflow integration.

---

## 1. Executive Summary

**AI Task Weaver** is an advanced productivity platform that bridges the gap between **Task Management**, **Knowledge Base (Notes)**, and **Agentic AI**.

Unlike standard todo apps, AI Task Weaver features a "Second Brain." It uses vector database technology to "remember" every note and task the user creates. Users can chat with an AI Agent that can retrieve this specific personal context to answer questions, summarize projects, or even escalate issues via email.

---

## 2. Technology Stack

### **Frontend**
*   **Framework**: React 18 (Vite) - Chosen for speed and modern component architecture.
*   **Language**: TypeScript - Ensures type safety and code maintainability.
*   **Styling**:
    *   **Tailwind CSS**: For utility-first, rapid styling.
    *   **Shadcn UI**: A collection of re-usable components based on Radix UI (accessible, headless).
*   **Animation**:
    *   **Framer Motion**: For complex UI transitions and layout animations.
    *   **GSAP**: For high-performance, timeline-based animations (likely on the Landing Page).
*   **State Management**: React Query (TanStack Query) used for efficient server state management.

### **Backend & Infrastructure**
*   **Authentication**: Supabase Auth (Secure, scalable user management).
*   **Database (Relational)**: Supabase (PostgreSQL) - Stores user profiles, structured task data, etc.
*   **Database (Vector)**: Pinecone - Stores high-dimensional vector embeddings of notes and tasks for AI retrieval.
*   **AI orchestration**: n8n - A node-based workflow automation tool that serves as the backend logic for the AI Agent.

### **AI Core**
*   **Embeddings Provider**: Google Gemini (`models/embedding-001`) - Converts text into vector numbers.
*   **LLM Provider**: OpenRouter - Gateway to access large language models (e.g., GPT-4o, Claude 3.5).

---

## 3. The RAG Architecture (Retrieval-Augmented Generation)

This is the most critical technical component of the project. RAG allows the AI to answer questions based on private data that the base model (like GPT-4) was never trained on.

### **Phase 1: Ingestion (Client-Side)**
*Code Reference*: `src/lib/pinecone.ts`

Traditional RAG often happens on the server. In this architecture, we perform **Client-Side Ingestion** for immediate feedback.

1.  **Event**: User creates a Task or Note.
2.  **Vectorization**: The frontend calls the **Google Gemini API** directly.
    *   *Input*: "Discuss the marketing launch for Q4."
    *   *Output*: `[0.12, -0.45, 0.88, ...]` (A 768-dimension vector).
3.  **Indexing**: This vector is sent to **Pinecone**.
    *   **Metadata**: Crucially, we store the *original text* in the metadata field of the vector.
    *   *Why?*: Pinecone searches by numbers (vector similarity) but returns the metadata (text) so the LLM can read it.

### **Phase 2: Retrieval & Reasoning (The n8n Agent)**
*Code Reference*: `My workflow.json`

The backend logic is handled by an **n8n Workflow**. This acts as an autonomous agent.

#### **Workflow Step-by-Step:**

1.  **Webhook Trigger (`Node: Webhook`)**:
    *   Listens for POST requests from the Frontend Chat UI containing the user's message.

2.  **Memory Management (`Node: Postgres Chat Memory`)**:
    *   Connects to a Postgres database to retrieve the conversation history (`session_id`). This ensures the AI remembers that you just asked about "Project X" if you say "Tell me more about it."

3.  **The AI Agent (`Node: AI Agent`)**:
    *   This is the "Brain." It uses an LLM (via OpenRouter) to analyze the user's intent.
    *   It decides **which tool to use** based on the question. It doesn't just guess; it "functions calls."

4.  **Available Tools (The Agent's Toolkit)**:

    *   **Tool A: Pinecone Vector Store (`Node: Pinecone Vector Store1`)**:
        *   *Trigger*: User asks about their own data (e.g., "What notes do I have on React?").
        *   *Action*:
            1.  Converts the *question* into a vector using **Google Gemini Embeddings**.
            2.  Performs a "Similarity Search" in Pinecone.
            3.  Retrieves the top matching Notes/Tasks.
            4.  Feeds this text to the LLM to generate an answer.

    *   **Tool B: RAG HTTP Request (`Node: RAG`)**:
        *   *Trigger*: General business/support questions.
        *   *Action*: Sends a request to an external Pinecone generic agent. This separates tailored user data from general knowledge.

    *   **Tool C: Gmail Integration (`Node: Send a message in Gmail`)**:
        *   *Trigger*: Escalation or reporting issues (e.g., "Send an email to support about this bug.").
        *   *Action*: Formats an email and sends it via Gmail API to `srkrcsdcsitleavemanagement@gmail.com`.

---

## 4. Key Application Modules

### **Dashboard & Landing Page**
*   **Landing Page**: Uses high-impact visuals and animations to sell the product vision.
*   **Dashboard**: The central hub. It likely aggregates stats (Tasks completed) and provides the entry point for the AI Chat.

### **Task Management (`TasksPage.tsx`)**
*   **Functionality**: CRUD (Create, Read, Update, Delete) for tasks.
*   **Sync**: Uses React Query to keep the UI in sync with Supabase.
*   **AI Hook**: Every save triggers the `pinecone.indexTask()` function to ensure the AI logic is always up-to-date.

### **Notes System (`NotesPage.tsx`)**
*   **Functionality**: A space for unstructured thought.
*   **AI Hook**: Calls `pinecone.indexNote()` to index content. This allows the AI to perform "Semantic Search" (finding notes by *meaning*, not just keyword matching).

---

## 5. Project Structure & Codebase Navigation

Knowing where code lives is crucial for the "Live Coding" or "Walkthrough" part of an interview.

### **Root Directory**
*   **`src/`**: Source code of the application.
*   **`public/`**: Static assets (robots.txt, favicon).
*   **`My workflow.json`**: The n8n AI Agent definition file.
*   **`package.json`**: Dependencies list.
*   **`vite.config.ts`**: Configuration for the build tool (Vite).

### **Data & Logic (`src/lib` & `src/hooks`)**
*   **`src/lib/pinecone.ts`**: **[CRITICAL]** The bridge between frontend and AI. Contains `indexTask()` and `indexNote()` which generate embeddings via Google Gemini and push to Pinecone.
*   **`src/integrations/supabase/`**: Contains the Supabase client setup (database connection).
*   **`src/hooks/`**: Custom React hooks (e.g., `use-toast.ts` for notifications).

### **Components (`src/components`)**
*   **`src/components/ui/`**: **Shadcn UI** library components.
    *   *Standard*: `button.tsx`, `input.tsx`, `card.tsx`.
    *   *Fancy Effects*: `MagicBento.tsx`, `GridScan.tsx`, `Cubes.tsx`. If asked about the "cool animations," look here.
*   **`src/components/chat/`**: Likely contains the `<ChatWidget />` that appears on the Dashboard.

### **Pages (`src/pages`)**
The application routes are defined here.
*   **`AuthPage.tsx`**: Login/Register forms.
*   **`LandingPage.tsx`**: The main marketing page.
*   **`DashboardPage.tsx`**: The main user interface after login.
*   **`TasksPage.tsx`**: Task management logic.
*   **`NotesPage.tsx`**: Note editing interface.
*   **`SettingsPage.tsx`**: User configuration.

### **Entry Points**
*   **`src/App.tsx`**: Main component, establishes Routing (`react-router-dom`) and Layouts.
*   **`src/main.tsx`**: Application entry point, mounts React to the DOM.

---

## 6. Potential Interview Questions & Answers

**Q: Why did you choose n8n over a custom Python/Node.js backend?**
> **A:** n8n allows for rapid visual prototyping of complex AI agentic flows. It handles the "glue code" between OpenAI, Pinecone, and Postgres automatically, allowing us to focus on the prompt engineering and tool definitions rather than boilerplate API integrations.

**Q: How do you handle data privacy with the AI?**
> **A:** Data is vectorized. The LLM (OpenRouter) only sees the specific snippets of text retrieved by Pinecone relevant to the current question, not the entire database. We separate personal user notes (Pinecone Tool) from general business queries (HTTP RAG Tool).

**Q: What happens if the RAG fails to find an answer?**
> **A:** The Agent is instructed (via System Prompt) to gracefully handle "I don't know" scenarios or default to general knowledge if appropriate. If the user specifically asks for support, the Agent can seamlessly switch to the Gmail tool to escalate the request to a human.

**Q: Explain the vector embedding process.**
> **A:** We use Google's `embedding-001` model. It takes string input (text) and maps it to a 768-dimensional vector space. Concepts that are semantically similar (e.g., "Software Engineer" and "Developer") will be located close together in this mathematical space, allowing Pinecone to find relevant matches even if the exact keywords differ.
