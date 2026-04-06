# 🚀 Supabase Google Auth Setup Guide

To enable Google Sign-In for your Campus Buddy application, follow these steps in the Google Cloud Console and your Supabase Dashboard.

## Part 1: Google Cloud Console Setup

1.  **Go to Google Cloud Console**: Visit [console.cloud.google.com](https://console.cloud.google.com/).
2.  **Create a New Project**: Click the project selector and create a new project called "Campus Buddy".
3.  **OAuth Consent Screen**:
    - Go to **APIs & Services > OAuth consent screen**.
    - Choose **External** and click **Create**.
    - Fill in **App Name** (Campus Buddy), **User support email**, and **Developer contact info**.
    - Click **Save and Continue** until finished.
4.  **Create Credentials**:
    - Go to **APIs & Services > Credentials**.
    - Click **+ Create Credentials > OAuth client ID**.
    - Select **Web application**.
    - **Authorized JavaScript origins**:
      - `http://localhost:3000` (for local dev)
      - `https://your-app-domain.vercel.app` (your production URL)
    - **Authorized redirect URIs**:
      - Find this in your **Supabase Dashboard > Authentication > Providers > Google**.
      - It must also include your specific app callback:
        - `http://localhost:3000/auth/callback` (for local dev)
        - `https://your-app-domain.vercel.app/auth/callback` (your production URL)
5.  **Get your Keys**: Copy the **Client ID** and **Client Secret**.

## Part 2: Supabase Dashboard Configuration

1.  **Go to Supabase**: Log in to your project at [app.supabase.com](https://app.supabase.com/).
2.  **Authentication Settings**:
    - Navigate to **Authentication > Providers**.
    - Find **Google** in the list and expand it.
    - **Enable** the Google provider.
    - Paste your **Client ID** and **Client Secret** copied from Part 1.
    - Click **Save**.
3.  **Site URL**:
    - Go to **Authentication > URL Configuration**.
    - Set **Site URL** to your production URL (e.g., `https://your-app.vercel.app`).
    - Add `http://localhost:3000/**` to **Redirect URLs**.

## Part 3: Run the Database Trigger

1.  Go to the **Supabase SQL Editor**.
2.  Open the [**`supabase/onboarding_trigger.sql`**](file:///e:/CampusBuddyFinal/supabase/onboarding_trigger.sql) file in your project.
3.  Copy the code and run it. This ensures that every time someone logs in with Google, a profile is automatically created in your database.

---

> [!TIP]
> **Testing locally**: Make sure you use the `redirectTo` option pointing to your localhost in `hooks/useAuth.ts` during development.
