# Deployment Checklist - Campus Buddy

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] TypeScript compilation (no errors)
- [x] All components render correctly
- [x] Responsive design tested
- [x] Dark/Light mode working
- [x] No console errors
- [x] Environment variables documented

### ✅ Database Setup
- [ ] Create Supabase project
- [ ] Run database_schema.sql in SQL Editor
- [ ] Verify all tables created
- [ ] Check RLS policies are active
- [ ] Test profile creation trigger

### ✅ API Keys
- [ ] Get Groq API key from console.groq.com
- [ ] Get Google Gemini API key from makersuite.google.com
- [ ] Get Supabase project URL and keys
- [ ] Store keys securely (never commit .env.local)

### ✅ Authentication
- [ ] Enable Email/Password auth in Supabase
- [ ] Enable Google OAuth in Supabase
- [ ] Configure OAuth redirect URLs
- [ ] Test user registration flow
- [ ] Test login flow
- [ ] Test logout functionality

## Local Testing Checklist

### Functionality Tests
- [ ] Landing page loads correctly
- [ ] Sign up creates new user
- [ ] Login authenticates successfully
- [ ] Dashboard displays user info
- [ ] AI chatbot responds to messages
- [ ] Chat history saves to database
- [ ] Navigation between pages works
- [ ] Protected routes redirect to login
- [ ] Theme toggle works
- [ ] Mobile menu works

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Fast API responses

## Vercel Deployment Steps

### Step 1: Prepare Repository
```bash
# Commit all changes
git add .
git commit -m "Initial commit - Campus Buddy v1.0"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the root directory
5. Framework preset: Next.js (auto-detected)

### Step 3: Configure Build Settings
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Development Command**: `npm run dev` (default)

### Step 4: Add Environment Variables
Add these in Vercel > Project Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your-key
GOOGLE_GEMINI_API_KEY=your-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Campus Buddy
```

**Important**: Set for all environments (Production, Preview, Development)

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Check deployment logs for errors
4. Visit your deployed URL

### Step 6: Post-Deployment Testing
- [ ] Landing page loads
- [ ] Can sign up new account
- [ ] Can log in successfully
- [ ] AI chatbot works
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] No 404 errors
- [ ] HTTPS enabled (automatic)

## Supabase Configuration

### Auth Settings
1. Go to Authentication > Providers
2. Enable Email provider
3. Enable Google provider:
   - Get Google OAuth credentials from Google Cloud Console
   - Add Client ID and Secret
   - Set authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Storage Setup (Optional - for future use)
1. Create buckets for:
   - `avatars` - Profile pictures
   - `attachments` - Assignment files
   - `resources` - Study materials
2. Set RLS policies for each bucket

### Realtime Setup (Optional - for future use)
1. Enable Realtime for tables:
   - notifications
   - hostel_requests
   - bookings
2. Configure broadcast settings

## Domain Configuration (Optional)

### Custom Domain
1. Buy domain from registrar
2. Go to Vercel > Project Settings > Domains
3. Add your domain
4. Update DNS records:
   - Type: A or CNAME
   - Value: Provided by Vercel
5. Wait for DNS propagation (up to 48 hours)

## Monitoring & Analytics

### Recommended Tools
1. **Vercel Analytics** (built-in)
   - Page views
   - Performance metrics
   - Core Web Vitals

2. **Supabase Dashboard**
   - Database usage
   - Auth statistics
   - API calls

3. **Error Tracking** (optional)
   - Sentry.io (free tier)
   - LogRocket (free tier)

## Security Checklist

### Production Security
- [x] Environment variables not committed
- [x] HTTPS enabled (automatic on Vercel)
- [x] RLS policies active on all tables
- [x] Service role key kept secret
- [x] CORS configured correctly
- [x] Rate limiting considered (API routes)

### Data Protection
- [x] User data encrypted at rest (Supabase)
- [x] Secure transmission (HTTPS)
- [x] Input validation on forms
- [x] XSS protection (React built-in)
- [x] SQL injection prevention (parameterized queries)

## Performance Optimization

### Already Implemented
- ✅ Next.js automatic code splitting
- ✅ Image optimization ready
- ✅ Font optimization (Geist)
- ✅ CSS purging (Tailwind)
- ✅ Server-side rendering where needed

### Future Optimizations
- Add image lazy loading
- Implement React Suspense
- Add service worker for offline
- Enable compression
- Use CDN for static assets

## Backup Strategy

### Database Backups
1. Supabase automatic backups (Pro plan)
2. Manual exports via SQL Editor
3. Schedule weekly backups

### Code Backups
1. GitHub repository (version control)
2. Regular commits
3. Branch protection rules

## Scaling Considerations

### When to Upgrade
Monitor these metrics:
- **Database size**: Current limit 500 MB
- **Bandwidth**: Current limit 2 GB/month
- **API calls**: Track usage in Supabase dashboard
- **Concurrent users**: Monitor performance

### Upgrade Path
1. Supabase Pro ($25/month)
   - 8 GB database
   - 50 GB bandwidth
   - Daily backups

2. Vercel Pro ($20/month)
   - Unlimited bandwidth
   - Advanced analytics
   - Priority support

## Troubleshooting Deployment Issues

### Common Problems

**Build Fails:**
```bash
# Check locally first
npm run build

# Fix any TypeScript errors
# Ensure all dependencies installed
```

**Environment Variables Not Working:**
- Verify variable names match exactly
- Check they're set for correct environment
- Redeploy after adding variables

**Authentication Issues:**
- Verify redirect URLs in Supabase
- Check OAuth provider configuration
- Ensure cookies are enabled

**AI Chatbot Not Responding:**
- Verify API keys are correct
- Check API rate limits
- Review browser console for errors

**Database Connection Errors:**
- Verify Supabase URL is correct
- Check network connectivity
- Review RLS policies

## Post-Launch Tasks

### Week 1
- [ ] Monitor error logs daily
- [ ] Check database growth
- [ ] Gather user feedback
- [ ] Fix critical bugs

### Month 1
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Add requested features
- [ ] Update documentation

### Ongoing
- [ ] Regular security audits
- [ ] Performance monitoring
- [ ] Feature updates
- [ ] User support

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Groq Docs**: https://console.groq.com/docs
- **Gemini Docs**: https://ai.google.dev/docs

## Success Metrics

Track these KPIs:
- User registrations per day
- Active users (DAU/MAU)
- AI chatbot usage
- Average session duration
- Feature adoption rates
- Error rate (< 1%)
- Page load time (< 3s)

---

## Final Verification

Before going live, ensure:
1. ✅ All features tested locally
2. ✅ Database schema applied
3. ✅ Environment variables set
4. ✅ Authentication working
5. ✅ AI chatbot responding
6. ✅ Mobile responsive
7. ✅ No console errors
8. ✅ HTTPS enabled
9. ✅ Custom domain (optional)
10. ✅ Monitoring setup

**You're ready to launch! 🚀**

Remember: Start with a soft launch to a small group, gather feedback, then scale up.

Good luck with Campus Buddy!
