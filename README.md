# AI Model Playground

A Next.js application that allows users to compare responses from multiple AI models (GPT-4o, Claude 3.5 Sonnet, and Grok 3) side-by-side in real-time. The platform provides detailed metrics including token usage and cost analysis for each model response.

## Table of Contents

- [Project Structure and Architecture](#project-structure-and-architecture)
- [Setup Instructions](#setup-instructions)
- [Technical Decisions and Tradeoffs](#technical-decisions-and-tradeoffs)
- [Future Improvements](#future-improvements)

## Project Structure and Architecture

### Technology Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Integration**: Vercel AI Gateway + Vercel AI SDK
- **State Management**:
  - Zustand (client-side state)
  - TanStack Query (server state)
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Markdown Rendering**: react-markdown

### Directory Structure

```
ai-model-play/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/[chatId]/submit/ # Streaming endpoint for model responses
│   │   └── webhooks/clerk/       # Clerk webhook handler
│   ├── chat/                     # Chat pages
│   │   ├── [id]/page.tsx         # Individual chat view
│   │   └── page.tsx               # Chat list/landing
│   ├── layout.tsx                 # Root layout with providers
│   └── globals.css                # Global styles
├── components/
│   ├── chat/                      # Chat-specific components
│   │   ├── ChatSidebar.tsx        # Sidebar with chat history
│   │   ├── ChatMessage.tsx        # Individual message display
│   │   ├── ResponseGrid.tsx       # Grid layout for model responses
│   │   ├── StreamingResponse.tsx  # Real-time streaming display
│   │   └── ...
│   ├── common/                    # Shared components
│   │   ├── PromptInput.tsx        # Input component with submit
│   │   └── AuthButton.tsx         # Authentication button
│   ├── landing/                   # Landing page components
│   └── ui/                        # shadcn/ui components
├── hooks/                         # Custom React hooks
│   ├── useStreamingState.ts       # Manages streaming state
│   ├── useGetChat.ts              # Fetches chat data
│   ├── useAutoScroll.ts           # Auto-scroll during streaming
│   └── ...
├── lib/
│   ├── adapters/gateway.ts        # AI Gateway model configuration
│   ├── db.ts                      # Prisma client instance
│   ├── pricing.ts                 # Cost calculation utilities
│   └── utils.ts                   # General utilities
├── store/
│   └── usePlaygroundStore.ts      # Zustand store (legacy, used for landing)
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── types/                         # TypeScript type definitions
├── constants/
│   └── providers.ts               # AI provider configurations
└── helpers/                       # Helper functions
```

### Architecture Overview

#### Data Flow

1. **User submits prompt** → `PromptInput` component
2. **Create chat/prompt** → Server action creates database records
3. **Start streaming** → Three parallel API calls to `/api/chat/[chatId]/submit?provider=...`
4. **Stream responses** → Each provider streams text chunks in real-time
5. **Save to database** → Responses saved with metrics (latency, tokens, cost)
6. **Update UI** → TanStack Query refetches and updates display

#### Database Schema

The application uses a relational schema with the following entities:

- **User**: Stores Clerk user ID and profile information
- **Chat**: Represents a conversation session
- **Prompt**: User's input message within a chat
- **Response**: AI model response with metrics (latency, tokens, cost, status)

Relationships:

- User → Chat (one-to-many)
- Chat → Prompt (one-to-many)
- Prompt → Response (one-to-many, one per provider)

#### Streaming Architecture

The application implements parallel streaming from three AI providers:

1. **Optimistic UI**: Prompt appears immediately before database confirmation
2. **Parallel Requests**: All three providers stream simultaneously
3. **Real-time Updates**: Each chunk updates the UI as it arrives
4. **Completion Tracking**: System tracks when all three streams complete
5. **Database Sync**: After completion, refetch ensures UI matches database state

#### State Management Strategy

- **TanStack Query**: Manages server state (chats, prompts, responses)
  - Automatic caching and refetching
  - Optimistic updates support
  - Background synchronization

- **Zustand**: Client-side state (used primarily for landing page playground)
  - Simple, lightweight
  - Persisted to localStorage for history

- **React State**: Component-local state for UI interactions
  - Streaming progress
  - Form inputs
  - UI toggles

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL database (recommended: [Neon](https://neon.tech))
- [Clerk](https://clerk.com) account for authentication
- [Vercel AI Gateway](https://vercel.com/ai-gateway) API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-model-play
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:

   ```env
   # Vercel AI Gateway API Key
   # Get from: https://vercel.com/dashboard/~/ai-gateway/api-keys
   AI_GATEWAY_API_KEY=your-vercel-ai-gateway-api-key

   # Database URL (PostgreSQL)
   # Format: postgresql://user:password@host:port/database?sslmode=require
   DATABASE_URL="postgresql://..."

   # Clerk Authentication
   # Get from: https://dashboard.clerk.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   CLERK_WEBHOOK_SECRET=whsec_xxx
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

5. **Configure Clerk Webhook** (for user sync)

   In your Clerk dashboard, add a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`

6. **Run the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Production Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (recommended)

   ```bash
   vercel
   ```

   Ensure all environment variables are set in the Vercel dashboard.

3. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

## Technical Decisions and Tradeoffs

### Why Vercel AI Gateway?

**Decision**: Use Vercel AI Gateway instead of direct API calls to OpenAI, Anthropic, and xAI.

**Benefits**:

- **Unified API**: Single interface for multiple providers
- **Built-in Rate Limiting**: Prevents hitting provider limits
- **Cost Tracking**: Automatic token usage and cost calculation
- **Reliability**: Gateway handles retries and error handling
- **Future-proof**: Easy to add new providers

**Tradeoffs**:

- Additional dependency on Vercel infrastructure
- Slight latency overhead (minimal in practice)
- Requires API key management through Vercel

### Why Clerk for Authentication?

**Decision**: Use Clerk instead of building custom auth or using NextAuth.

**Benefits**:

- **Rapid Development**: Pre-built UI components and flows
- **Security**: Industry-standard authentication with built-in security features
- **User Management**: Automatic user profile management
- **Webhooks**: Easy integration for syncing users to database
- **Social Logins**: Built-in support for OAuth providers

**Tradeoffs**:

- Third-party dependency
- Cost at scale (free tier available)
- Less customization than custom solution

### State Management: Zustand + TanStack Query

**Decision**: Hybrid approach using both Zustand and TanStack Query.

**Rationale**:

- **TanStack Query**: Perfect for server state (chats, prompts, responses)
  - Automatic caching and background updates
  - Optimistic updates support
  - Built-in loading/error states
- **Zustand**: Lightweight for client-side state
  - Simple API for UI state
  - Easy persistence to localStorage
  - Minimal boilerplate

**Alternative Considered**: Redux Toolkit

- **Rejected**: Overkill for this application's complexity
- Zustand provides sufficient state management with less overhead

### Streaming Architecture

**Decision**: Parallel streaming with optimistic UI updates.

**Implementation Details**:

- Three simultaneous fetch requests (one per provider)
- Each stream updates UI independently as chunks arrive
- Completion tracking ensures all streams finish before finalizing
- Database saves happen after stream completion (via `onFinish` callback)

**Tradeoffs**:

- **Pros**: Real-time feedback, parallel execution, better UX
- **Cons**: More complex state management, potential race conditions (handled with refs)

**Alternative Considered**: Sequential requests

- **Rejected**: Slower overall experience, users wait longer for results

### Database Schema Design

**Decision**: Normalized relational schema with separate tables for User, Chat, Prompt, and Response.

**Rationale**:

- **Flexibility**: Easy to add new metrics or metadata
- **Query Performance**: Indexed foreign keys for fast lookups
- **Data Integrity**: Foreign key constraints ensure referential integrity
- **Scalability**: Can handle large numbers of chats and prompts

**Tradeoffs**:

- More complex queries (requires joins)
- More database round trips (mitigated with Prisma's query optimization)

**Alternative Considered**: Denormalized document store

- **Rejected**: Less flexible for analytics and reporting needs

### Optimistic UI Pattern

**Decision**: Show prompts immediately before database confirmation.

**Benefits**:

- Instant feedback improves perceived performance
- Better UX during network latency
- Handles edge cases gracefully (if DB save fails, user still sees their prompt)

**Implementation**:

- `useStreamingState` hook manages optimistic prompts
- SessionStorage used for new chats (before DB record exists)
- Automatic cleanup when database data arrives

## Future Improvements

1. **Pagination in Chat History**
   - Implement offset pagination for chat list
   - Load chats incrementally as user scrolls
   - Optimize database queries with proper indexing

2. **Context Management for Chats**
   - Add conversation context/memory to chats
   - Allow users to set system prompts or instructions per chat
   - Maintain conversation history context across prompts

3. **Privacy and Data Control**
   - Implement chat privacy settings (private, shared, public)
   - Add data retention policies and auto-deletion options
   - Enable end-to-end encryption for sensitive conversations

4. **Dynamic Multi-Model Selection**
   - Allow users to select which models to compare (not just all three)
   - Support dynamic provider and model selection from available options
   - Add model discovery UI showing all available models from each provider
   - Enable custom model configurations (temperature, max tokens, etc.)
   - Display model capabilities and pricing before selection

5. **Export Functionality**
   - Export chat history as Markdown
   - Export comparison data as CSV/JSON
   - PDF report generation

6. **Enhanced Analytics**
   - Cost tracking over time
   - Model performance comparison charts
   - Token usage trends
   - Response quality metrics

7. **Collaboration Features**
   - Team workspaces
   - Shared chat rooms
   - Comments and annotations on responses

8. **AI-Powered Features**
   - Automatic response quality assessment
   - Smart prompt suggestions
   - Response summarization
