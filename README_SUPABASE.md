# Supabase Integration Setup

This project has been migrated to use Supabase for data persistence. Follow these steps to set up your backend.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Create a new project.
3. Wait for the database to start.

## 2. Database Schema Setup
1. Go to the **SQL Editor** in your Supabase dashboard.
2. Open the `supabase_schema.sql` file in this project.
3. Copy the entire content of `supabase_schema.sql`.
4. Paste it into the SQL Editor and run it.
   - This will create the `customers`, `invoices`, `settings`, and `coupons` tables.
   - It will also create the `bills` storage bucket and set up security policies.

## 3. Environment Variables
1. Create a file named `.env.local` in the root of your project (if it doesn't exist).
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. You can find these keys in your Supabase dashboard under **Project Settings > API**.

## 4. Restart Development Server
After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
# or
pnpm dev
```

## Features Enabled
- **Persistent Data**: Customers, Invoices, Settings, and Coupons are now stored in the database.
- **File Uploads**: Bill copies (PDFs/Images) are uploaded to Supabase Storage.
- **Real-time**: Changes are saved immediately.

## Notes
- The application uses Row Level Security (RLS) with public access policies for simplicity. In a production environment, you should configure authentication and restrict access.
