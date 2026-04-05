import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Building, BookOpen, MapPin, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chatbot',
      description: '24/7 intelligent assistant for all your campus queries',
    },
    {
      icon: Building,
      title: 'Hostel Management',
      description: 'Maintenance requests, mess menu, visitor passes & more',
    },
    {
      icon: BookOpen,
      title: 'Academic Tools',
      description: 'Track assignments, view timetables, access study resources',
    },
    {
      icon: MapPin,
      title: 'Campus Navigation',
      description: 'Interactive maps and turn-by-turn directions',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Role-based access control and data encryption',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Instant notifications for important events and deadlines',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Campus Buddy
          </h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Your AI-Powered Campus Companion
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Everything you need for hostel life, academics, and campus navigation - all in one place.
            Powered by advanced AI to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Today
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Everything You Need</h3>
          <p className="text-muted-foreground text-lg">
            Comprehensive tools designed specifically for college students
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-card p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <Icon className="w-12 h-12 text-primary mb-4" />
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary text-primary-foreground rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students already using Campus Buddy
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 Campus Buddy. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  )
}
