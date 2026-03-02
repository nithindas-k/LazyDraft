<div align="center">
  <img src="./frontend/public/LazyDraftBgremoved.png" alt="LazyDraft Logo" width="250" />
  <h1>LazyDraft</h1>
  <p>
    <a href="https://lazydraft.nithin.site/login" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-Available-00a884?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>
  <p><strong>AI-powered email drafting and automation platform integrated with Gmail.</strong></p>
</div>

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Overview

LazyDraft leverages advanced Large Language Models (LLMs) to streamline communication workflows, enabling users to generate, manage, and schedule emails with precision — directly through Gmail.

---

## Core Features

###  AI-Powered Drafting
- Context-aware email generation using **Groq AI**
- Dynamic tone adjustment — Professional, Casual, Urgent, Persuasive, and more
- Precise length control — Short, Medium, or Long
- Multi-language support for international communication
- Smart subject line generation based on body content

###  Gmail Integration
- Secure authentication via **Google OAuth 2.0**
- Direct Gmail API integration for drafting and sending
- Real-time synchronization of drafted messages
- Inbox monitoring for automated workflows

###  Email Automation & Scheduling
- **Recurring Emails** — Set up daily, weekly, or monthly automated emails
- **Scheduled Delivery** — Draft now, deliver at a precise future time
- **AI Auto-Reply** — Intelligent automated responses based on user-defined rules

###  Analytics & Insights
- Comprehensive dashboard with Gmail analytics
- Email volume and pattern visualizations via Recharts
- Top sender analysis and label-based filtering
- Performance metrics for automated replies and sent messages

###  User Experience
- High-performance, responsive UI built with **React 19 + Vite**
- Smooth animations via **Framer Motion**
- Dark / Light mode support
- Export drafts as PDF or high-resolution images

---

## Technology Stack

### Frontend

| Category | Technology |
|---|---|
| Framework | React 19 (Vite) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI (Radix UI) |
| Iconography | Lucide React |
| State & Forms | React Hook Form, Zod |
| Data Visualization | Recharts |
| Router | React Router DOM |

### Backend

| Category | Technology |
|---|---|
| Runtime | Node.js (TypeScript) |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Authentication | Passport.js (Google OAuth), JWT |
| AI Engine | Groq SDK |
| Email Service | Resend (system) + Google APIs (user) |

---

## Project Structure
```text
LazyDraft/
├── frontend/
│   └── src/
│       ├── components/   # Atomic and molecular UI components
│       ├── pages/        # Route-level page components
│       ├── services/     # API client and external service wrappers
│       └── hooks/        # Custom React hooks for business logic
└── backend/
    └── src/
        ├── controllers/  # Request handling and response formatting
        ├── models/        # Data schemas and database models
        ├── routes/        # API endpoint definitions
        ├── services/      # Core business logic (AI, Mail, Automation)
        ├── repositories/  # Data access layer
        └── vendors/       # Third-party integrations (Gmail, AI)
```

---

## System Architecture

LazyDraft runs background processors to handle time-sensitive operations:

| Processor | Description |
|---|---|
| **Scheduled Mail Processor** | Checks every 15 seconds for emails due for delivery |
| **Recurring Mail Processor** | Manages periodic email tasks (daily / weekly / monthly) |
| **Auto-Reply Monitor** | Scans inboxes of enabled users and sends AI-generated responses |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Atlas or Local)
- Google Cloud Console project with Gmail API enabled
- Groq AI API Key

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/lazydraft.git
cd lazydraft

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Running Locally
```bash
# Start the backend
cd backend
npm run dev

# Start the frontend (in a new terminal)
cd frontend
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Secret for session management |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GROQ_API_KEY` | API key for Groq AI |
| `RESEND_API_KEY` | API key for Resend (system notifications) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend server URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

---

## License

This project is licensed under the **ISC License**.
