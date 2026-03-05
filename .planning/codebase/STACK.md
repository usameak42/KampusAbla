# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- TypeScript 5.8.3 - Application code with strict null checks disabled
- JavaScript ES2020 - Target output for bundle optimization

**Secondary:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- HTML5 - Semantic markup structure

## Runtime

**Environment:**
- Node.js - Runtime (implied by package.json)
- Browser - Client-side execution

**Package Manager:**
- npm - Package management
- bun.lockb - Dependency lockfile

## Frameworks

**Core:**
- Vite 5.4.19 - Build tool and development server
- React 18.3.1 - UI library with hooks
- React Router 6.30.1 - Client-side routing
- SWC - React compiler for Vite plugin

**Testing:**
- Vitest 3.2.4 - Unit testing framework
- Testing Library 16.0.0/6.6.0 - Component testing
- Playwright 1.58.1 - End-to-end testing

**Build/Dev:**
- ESLint 9.32.0 - Linting
- Prettier 3.8.1 - Code formatting
- PostCSS 8.5.6 - CSS post-processing
- Autoprefixer 10.4.21 - CSS prefixing

## Key Dependencies

**Critical:**
- @tanstack/react-query 5.83.0 - Server state management
- @supabase/supabase-js 2.93.1 - Database and auth client
- zod 3.25.76 - Schema validation
- react-hook-form 7.61.1 - Form management
- @hookform/resolvers 3.10.0 - Form validation

**UI Components:**
- Radix UI - Accessible component primitives
- Lucide React 0.462.0 - Icon library
- Tailwind CSS Animate 1.0.7 - Animation utilities
- Framer Motion 12.29.2 - Animation library

**Infrastructure:**
- @sentry/react 10.38.0 - Error monitoring
- Firebase 12.8.0 - Push notifications
- @react-google-maps/api 2.20.8 - Maps integration
- date-fns 3.6.0 - Date manipulation

## Configuration

**Environment:**
- Environment variables with VITE_ prefix
- Multiple env files (.env, .env.development, .env.production)
- Supabase Edge Functions for serverless backend

**Build:**
- Vite configuration with SWC React plugin
- TypeScript strict mode disabled
- Path alias @ for src directory
- Component tagger for development

**Development:**
- Hot module replacement enabled
- Development server on port 8080
- Automatic code formatting with Prettier

## Platform Requirements

**Development:**
- Node.js runtime
- npm package manager
- Browser with WebSocket support

**Production:**
- Supabase hosting (database + Edge Functions)
- Firebase Cloud Messaging
- Google Maps API integration
- Payment gateway (iyzico/Papara) integration

---

*Stack analysis: 2026-03-05*
```