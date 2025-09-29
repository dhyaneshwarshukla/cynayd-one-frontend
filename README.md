# CYNAYD One Frontend

This is the standalone frontend application for CYNAYD One, extracted from the monorepo structure.

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- Responsive design
- Admin dashboard
- User management
- Organization management
- Role-based access control

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env.local
```

3. Update the environment variables in `.env.local` with your configuration.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build the application for production:

```bash
npm run build
```

### Static Export

Export the application as static files:

```bash
npm run export
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Configuration and utilities
│   ├── utils/              # Utility functions
│   └── index.ts            # Main export file
├── public/                 # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Application URL for NextAuth.js
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret

## Backend Integration

This frontend is designed to work with the CYNAYD One backend API. Make sure the backend is running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.

## Deployment

The application can be deployed as:

1. **Static Export**: For static hosting (Netlify, Vercel, etc.)
2. **Docker**: Using the provided Dockerfile
3. **Standalone**: Using `npm run build && npm start`

## License

Private - CYNAYD One

