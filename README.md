# Campus Buddy - AI-Powered Campus Companion

A production-ready SaaS web application that serves as a 24/7 AI assistant for college students, helping with hostel management, academics, campus navigation, and administrative services.

## 🚀 Features

### Core Features
- **🤖 AI Chatbot**: Intelligent assistant powered by Groq (Llama 3.1) with Google Gemini fallback
- **🏠 Hostel Management**: Maintenance requests, mess menu, visitor passes, laundry bookings
- **🎓 Academic Management**: Timetable, assignment tracker, study resources
- **🧭 Campus Navigation**: Interactive maps with OpenStreetMap (coming soon)
- **📢 Notifications**: Real-time alerts via Supabase Realtime
- **📚 Library**: Book search and reservation system (coming soon)
- **⚙️ Admin Dashboard**: User management, analytics, system settings

### Technical Features
- ✅ Role-based access control (Student, Admin, Hostel Staff)
- ✅ Dark/Light mode toggle
- ✅ Fully responsive design
- ✅ Real-time updates
- ✅ Secure authentication with Supabase Auth
- ✅ PostgreSQL database with Row Level Security
- ✅ Modern UI with ShadCN components
- ✅ Built entirely on free tiers

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4
- ShadCN UI
- Framer Motion
- Zustand (State Management)

**Backend:**
- Supabase (Auth, Database, Storage, Realtime)
- Next.js API Routes

**AI:**
- Groq API (Primary - Llama 3.1 70B)
- Google Gemini Pro (Fallback)

**Maps:**
- Leaflet.js + OpenStreetMap (Planned)

**Deployment:**
- Vercel (Free tier)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- A Supabase account (free at supabase.com)
- A Groq API key (free at console.groq.com)
- A Google Gemini API key (free at makersuite.google.com)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CampusBuddyFinal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `database_schema.sql` and run it
4. Navigate to Project Settings > API to get your credentials

### 4. Get API Keys

**Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up and create an API key
3. Free tier: 30 requests/minute, very generous

**Google Gemini API Key:**
1. Visit [makersuite.google.com](https://makersuite.google.com)
2. Create an API key
3. Free tier: 60 requests/minute

### 5. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
GROQ_API_KEY=your-groq-api-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Campus Buddy
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
CampusBuddyFinal/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── chat/
│   │   ├── hostel/
│   │   ├── academics/
│   │   ├── navigation/
│   │   ├── library/
│   │   ├── notifications/
│   │   ├── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                 # API routes
│   │   └── chat/route.ts
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # ShadCN components
│   ├── chat/                # Chat interface
│   ├── shared/              # Shared components
│   └── ...
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── ai/                  # AI integrations
│   └── constants.ts
├── store/                   # Zustand stores
├── types/                   # TypeScript types
├── hooks/                   # Custom React hooks
├── database_schema.sql      # Complete DB schema
├── .env.local.example       # Environment variables template
└── README.md
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- `profiles` - User profiles with roles
- `chats` & `messages` - AI chat history
- `hostel_requests` - Maintenance and service requests
- `assignments` - Academic assignments
- `timetables` - Class schedules
- `campus_locations` - Map locations
- `bookings` - Facility reservations
- `notifications` - User notifications
- `books` & `book_reservations` - Library system
- `events` - Campus events

All tables have Row Level Security (RLS) policies for data protection.

## 🔐 Authentication & Authorization

The app uses Supabase Authentication with:
- Email/Password login
- Google OAuth
- Role-based access (Student, Admin, Hostel Staff)
- Automatic profile creation on signup
- Protected routes via middleware

## 🤖 AI Chatbot

The chatbot uses a dual-API strategy:
1. **Primary**: Groq API with Llama 3.1 70B (fast, free)
2. **Fallback**: Google Gemini Pro (reliable, free)

Features:
- Context-aware conversations (last 10 messages)
- System prompt optimized for campus assistance
- Chat history saved to database
- Streaming responses (planned)

## 🎨 UI/UX

- Modern, clean SaaS design
- Dark/Light mode with system preference detection
- Smooth animations with Framer Motion
- Mobile-responsive layout
- Accessible components from ShadCN

## 🚀 Deployment to Vercel

### Option 1: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in the project settings
6. Click "Deploy"

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to deploy.

### Environment Variables on Vercel

Add all variables from `.env.local` to your Vercel project:
- Go to Project Settings > Environment Variables
- Add each variable for Production, Preview, and Development

## 📊 Free Tier Limits

This application is designed to run entirely on free tiers:

- **Vercel**: 100 GB bandwidth/month
- **Supabase**: 500 MB database, 1 GB storage, 2 GB bandwidth
- **Groq**: 30 requests/minute, 6000 tokens/minute
- **Gemini**: 60 requests/minute
- **OpenStreetMap**: Unlimited (no API key needed)

These limits can easily support 5,000-10,000 students.

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Environment variables for sensitive data
- HTTPS enforced in production
- Input validation on all forms
- XSS protection via React
- Secure session management

## 🎯 Roadmap

### Completed ✅
- Project setup and infrastructure
- Authentication system
- AI chatbot with dual API support
- Dashboard layout and navigation
- Basic module pages
- Dark/Light mode
- Landing page

### In Progress 🚧
- Full hostel management features
- Complete academic tools
- Interactive campus map
- Real-time notifications
- Library system

### Planned 📅
- Voice input for chatbot
- OCR for document uploads
- AI schedule optimizer
- Multi-language support
- Push notifications
- Advanced analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For support, please:
1. Check the documentation
2. Review the database schema in `database_schema.sql`
3. Ensure all environment variables are set correctly
4. Check the browser console for errors

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the excellent backend platform
- Groq for fast, free AI inference
- ShadCN for beautiful UI components
- The open-source community

---

Built with ❤️ for college students everywhere.

**Campus Buddy** - Your AI-Powered Campus Companion
