# LazyDraft

LazyDraft is a professional AI-powered email drafting and automation platform integrated with Gmail. It leverages advanced Large Language Models (LLMs) to streamline communication workflows, enabling users to generate, manage, and schedule emails with precision.

## Core Features

### AI-Powered Drafting
- Context-aware email generation using Groq AI.
- Dynamic tone adjustment (Professional, Casual, Urgent, Persuasive, etc.).
- Precise length control (Short, Medium, Long) to suit different contexts.
- Multi-language support for seamless international communication.
- Smart subject line generation based on body content.

### Gmail Integration
- Secure authentication via Google OAuth 2.0.
- Direct integration with Gmail API for drafting and sending.
- Real-time synchronization of drafted messages to the user's Gmail account.
- Inbox monitoring for automated workflows.

### Email Automation and Scheduling
- **Recurring Emails**: Set up periodic emails (daily, weekly, monthly) for automated reporting or updates.
- **Scheduled Delivery**: Draft emails now and schedule them for precise future delivery.
- **AI Auto-Reply**: Intelligent automated responses to incoming emails based on user-defined rules and AI context.

### Analytics and Insights
- Comprehensive dashboard with Gmail analytics.
- Visualizations of email volume and patterns using Recharts.
- Top sender analysis and label-based filtering.
- Performance metrics for automated replies and sent messages.

### User Experience
- High-performance, responsive UI built with React 19 and Vite.
- Sophisticated animations and transitions using Framer Motion.
- Seamless Dark and Light mode transitions via `next-themes`.
- Export options for drafted emails as PDF or high-resolution images.

## Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Iconography**: Lucide React
- **UI Components**: Shadcn UI (Radix UI)
- **State/Form Management**: React Hook Form, Zod
- **Data Visualization**: Recharts
- **Router**: React Router DOM

### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Passport.js (Google OAuth), JWT
- **AI Engine**: Groq SDK
- **Email Service**: Resend (for system notifications) and Google APIs (for user emails)

## Project Structure

```text
LazyDraft/
├── frontend/             # React-based client application
│   ├── src/
│   │   ├── components/   # Atomic and molecular UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── services/     # API client and external service wrappers
│   │   └── hooks/        # Custom React hooks for business logic
├── backend/              # Node.js Express server
│   ├── src/
│   │   ├── controllers/  # Request handling and response formatting
│   │   ├── models/       # Data schemas and database models
│   │   ├── routes/       # API endpoint definitions
│   │   ├── services/     # Core business logic (AI, Mail, Automation)
│   │   ├── repositories/ # Data access layer
│   │   └── vendors/      # Third-party integrations (Gmail, AI)
```

## System Architecture

LazyDraft utilizes a background task system to handle time-sensitive operations:
- **Scheduled Mail Processor**: Checks every 15 seconds for emails due for delivery.
- **Recurring Mail Processor**: Manages periodic email tasks.
- **Auto-Reply Monitor**: Periodically scans the inbox of enabled users to generate and send AI-powered responses.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- Google Cloud Console Project with Gmail API enabled
- Groq AI API Key

### Installation

1. Clone the repository.
2. Install dependencies for both frontend and backend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

### Running Locally

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default 5000)
- `MONGO_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for session management
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GROQ_API_KEY`: API key for Groq AI
- `RESEND_API_KEY`: API key for Resend service

### Frontend (.env)
- `VITE_API_URL`: Backend server URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID

## License
This project is licensed under the ISC License.
