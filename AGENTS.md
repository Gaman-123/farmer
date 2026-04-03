# E-Krishi Portal

Welcome to the E-Krishi Marketplace Portal project.

## Overview
E-Krishi is a Next.js (App Router) web application built for farmers and buyers in Karnataka to facilitate agricultural marketplace transactions.

## Environment Variables
The application requires the following environment variables (see `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_VISION_API_KEY`
- `DATABASE_URL`

## Running Locally
To start the development server, run:
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

## Supabase Schema Notes
- **Farmers**: Source-of-truth farmer profiles.
- **Buyers**: Traders, processors, and direct consumers.
- **Marketplace Listings**: Produce listings created by farmers.
- **Transactions**: Ledger of completed sales.
- Make sure to use the correct schema references and Row Level Security (RLS) policies as defined in the SQL setup files.
