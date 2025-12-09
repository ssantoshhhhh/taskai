# Website Knowledge Base: TaskAI / Article Creator Pro

This document provides a comprehensive overview of the website's architecture, features, and functionality. It is intended to serve as a knowledge base for AI agents to understand and answer questions about the platform.

## 1. High-Level Overview
**Application Name:** TaskAI / Reva AI (Internal codename: `ai-task-weaver`)
**Purpose:** An intelligent productivity application integrating Task Management, Note Taking, and AI-driven capabilities. It features a modern, responsive user interface with custom authentication flows.

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript and Vite.
- **Styling:** Tailwind CSS with Shadcn UI (Radix UI) primitives.
- **State Management:** React Query (@tanstack/react-query) for server state; customized Context API for Auth.
- **Routing:** React Router DOM (v6).
- **Animations:** Framer Motion, GSAP.
- **Icons:** Lucide React.
- **Form Handling:** React Hook Form with Zod validation.

### Backend & Infrastructure
- **Server:** Node.js with Express (handles custom auth flows).
- **Database & Auth:** Supabase (PostgreSQL).
- **AI/ML:** Integration with Google Gemini (via client/server) and Pinecone (for RAG - Retrieval Augmented Generation).
- **Email:** Nodemailer (SMTP via Gmail).
- **Runtime:** Bun (deduced from `bun.lockb`) or Node.js.

## 3. Directory Structure
- **`src/pages`**: Contains top-level page components.
- **`src/components`**: Reusable UI components (buttons, inputs, etc.).
- **`src/context`**: React Context providers (e.g., `AuthContext`).
- **`src/lib`**: Utility functions and clients (e.g., Supabase client).
- **`server.ts`**: The backend server entry point handling API routes.

## 4. Key Features & Pages

### 4.1 Authentication (`/auth`)
- **Method:** Custom OTP (One-Time Password) via Email.
- **Flow:**
    1. User enters email.
    2. Backend (`/api/send-login-otp`) generates a 6-digit code and sends it via Nodemailer.
    3. User enters code.
    4. Backend verify endpoint (`/api/verify-login-otp`) validates code and generates a Supabase session token.
    5. User is logged in automatically.
- **Security:** 15-minute expiration for OTPs; in-memory storage of codes.

### 4.2 Dashboard (`/dashboard`)
- **Access:** Protected (Requires Login).
- **Functionality:**
    - Provides a high-level overview of user activity.
    - Likely displays summary statistics (Tasks pending, Recent notes).
    - Quick navigation to other modules.

### 4.3 Task Management (`/tasks`)
- **Access:** Protected.
- **Functionality:**
    - Create, Read, Update, and Delete (CRUD) tasks.
    - Task organization and categorization.
    - "Summarize Task" AI feature (mentioned in development history).

### 4.4 Notes System (`/notes`)
- **Access:** Protected.
- **Functionality:**
    - Rich text or markdown-based note creation.
    - "Cubes" interactive background effect for visual appeal.
    - Integration with RAG (Retrieval Augmented Generation) to allow the chatbot to "chat" with notes.

### 4.5 Settings (`/settings`)
- **Access:** Protected.
- **Functionality:**
    - User Profile management.
    - Update Display Name.
    - Upload/Update Profile Picture (Avatar).
    - Theme preferences (Dark/Light mode).

### 4.6 AI Chatbot (Integrated Feature)
- **Capability:** Answers questions using context from User Notes and Tasks.
- **Mechanism:**
    - Uses Pinecone (Vector Database) to store embeddings of user content.
    - Uses Google Gemini for generating responses.
    - Uses n8n workflows (referenced in history) for orchestration.


