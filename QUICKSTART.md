# Quick Start Guide - Campus Buddy

## Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase (2 minutes)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization, give it a name, and set a database password
4. Wait for the project to initialize (~1 minute)
5. Go to SQL Editor (left sidebar)
6. Copy all content from `database_schema.sql` and paste it into the editor
7. Click "Run" to execute the schema

### Step 3: Get Your Supabase Credentials
1. Go to Project Settings (gear icon) > API
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 4: Get AI API Keys (1 minute each)

**Groq API:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up with GitHub or email
3. Go to API Keys section
4. Click "Create API Key"
5. Copy the key → `GROQ_API_KEY`

**Google Gemini API:**
1. Visit [makersuite.google.com](https://makersuite.google.com)
2. Sign in with Google account
3. Click "Get API Key" in the left menu
4. Create a new API key
5. Copy the key → `GOOGLE_GEMINI_API_KEY`

### Step 5: Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace placeholder values with your actual keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   GROQ_API_KEY=gsk_your-groq-key-here
   GOOGLE_GEMINI_API_KEY=your-gemini-key-here
   ```

### Step 6: Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 7: Create Your First Account
1. Click "Get Started" or "Sign Up"
2. Fill in the registration form
3. Choose role: Student (or Admin if you're setting up the system)
4. Check your email for verification (if email confirmation is enabled)
5. Log in with your credentials

## 🎉 You're All Set!

You now have a fully functional Campus Buddy application running locally.

## Next Steps

### Explore the Features
- Try the AI Chatbot on the `/chat` page
- Check out the Dashboard at `/dashboard`
- Browse the Hostel, Academics, and other modules

### Customize for Your University
1. Update campus locations in `lib/constants.ts`
2. Modify the system prompt in `lib/ai/systemPrompt.ts`
3. Add your university's branding/colors in Tailwind config
4. Customize mess menus and academic calendars

### Deploy to Production
See the main README.md for detailed deployment instructions to Vercel.

## Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
npm install
```

**Supabase connection errors:**
- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Make sure you ran the SQL schema
- Check that the anon key is correct

**AI chatbot not responding:**
- Verify both Groq and Gemini API keys are set
- Check the browser console for error messages
- Ensure you have internet connectivity

**Authentication issues:**
- Clear browser cookies and try again
- Check that Supabase Auth is enabled in your project settings
- Verify email confirmation settings in Supabase

### Getting Help

1. Check the main README.md for detailed documentation
2. Review the database schema in `database_schema.sql`
3. Check browser console for JavaScript errors
4. Check terminal for server-side errors

## Tips for Development

- Use Chrome DevTools to inspect network requests
- Check Supabase dashboard to view database data
- Use the Toaster notifications for user feedback
- Test different user roles (student, admin, hostel_staff)

Happy coding! 🚀
