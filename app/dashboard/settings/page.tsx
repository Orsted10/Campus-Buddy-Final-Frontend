'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { getApiUrl } from '@/lib/api-config'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, Shield, Bell, Moon, Sun, Trash2, 
  ChevronRight, AlertTriangle, ShieldAlert,
  Loader2, LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={onChange}
    className={`w-10 h-6 flex items-center rounded-full px-1 transition-colors ${checked ? 'bg-primary' : 'bg-black/20 dark:bg-white/20'}`}
  >
    <motion.div 
      layout
      className="w-4 h-4 bg-white rounded-full shadow-md"
      animate={{ x: checked ? 16 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </button>
)

const ThemeToggle = ({ theme, active, onClick, icon: Icon }: { theme: string, active: boolean, onClick: () => void, icon: any }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
      active 
        ? 'glass-strong border-primary/50 text-foreground shadow-lg shadow-primary/20 bg-primary/5' 
        : 'glass border-black/5 dark:border-white/5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
    }`}
  >
    <Icon className={`w-6 h-6 ${active ? 'text-primary' : ''}`} />
    <span className="text-xs font-bold">{theme}</span>
  </button>
)

export default function SettingsPage() {
  const user = useAuthStore((state: any) => state.user)
  const clearUser = useAuthStore((state: any) => state.clearUser)
  const router = useRouter()
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Password Update State
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const supabase = createClient()

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully!')
      setNewPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(getApiUrl('/api/user/delete'), { method: 'DELETE' })
      if (!res.ok) throw new Error('Deletion failed')
      
      toast.success('Account deleted successfully. Goodbye!')
      clearUser()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to wipe account data. Try again later.')
      setIsDeleting(false)
    }
  }

  const [toggles, setToggles] = useState({
    push: true,
    email: false,
    aiStrict: false,
    autoSync: true
  })
  
  const [activeTab, setActiveTab] = useState('General')
  const [activeTheme, setActiveTheme] = useState('System')

  interface Item {
    label: string;
    value: string;
    isBadge?: boolean;
    type?: string;
    status?: string;
  }

  const sections: { id: string; title: string; icon: any; items: Item[] }[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      items: [
        { label: 'Full Name', value: user?.full_name || 'N/A' },
        { label: 'Student ID', value: user?.student_id || 'N/A' },
        { label: 'Email', value: user?.email || 'N/A' },
        { label: 'Role', value: user?.role || 'student', isBadge: true },
      ]
    },
    {
      id: 'app',
      title: 'App Preferences',
      icon: Shield,
      items: [
        { label: 'Portal Auto-Sync', value: 'autoSync', type: 'toggle' },
        { label: 'Data Refresh Rate', value: 'Every 5 mins', status: 'Optimal' },
        { label: 'Strict Elite Persona (AI)', value: 'aiStrict', type: 'toggle' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', value: 'push', type: 'toggle' },
        { label: 'Email Alerts (Daily)', value: 'email', type: 'toggle' },
      ]
    }
  ]
  
  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success(`${key} preference updated`)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Settings</h1>
        <p className="text-muted-foreground mt-2 font-medium">Manage your Elite account and app preferences.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar-like selection */}
        <div className="space-y-2">
            {['General', 'Security', 'Data', 'Notifications'].map((t, i) => (
                <button 
                   key={t}
                   className={`w-full text-left p-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all ${i === 0 ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-black/5 dark:bg-white/5'}`}
                >
                    {t}
                    {i === 0 && <ChevronRight className="w-4 h-4" />}
                </button>
            ))}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
            {sections.map((section, idx) => (
                <Card key={section.id} className="glass-panel border-black/5 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CardHeader className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/2 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <section.icon className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black">{section.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {section.items.map((item, i) => (
                            <div key={item.label} className={`p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:bg-white/2 transition-colors ${i === section.items.length - 1 ? 'border-none' : ''}`}>
                                <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
                                {item.type === 'toggle' ? (
                                    <Switch 
                                      checked={toggles[item.value as keyof typeof toggles]} 
                                      onChange={() => handleToggle(item.value as keyof typeof toggles)} 
                                    />
                                ) : item.isBadge ? (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase text-[10px] tracking-widest">{item.value}</Badge>
                                ) : (
                                    <span className="text-sm font-black text-foreground">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* THEME SELECTOR */}
            <Card className="glass-panel border-black/5 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `0.3s` }}>
                <CardHeader className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/2 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sun className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-black">Appearance</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5 flex gap-4">
                    <ThemeToggle theme="Light" icon={Sun} active={activeTheme === 'Light'} onClick={() => { setActiveTheme('Light'); document.documentElement.classList.remove('dark') }} />
                    <ThemeToggle theme="Dark" icon={Moon} active={activeTheme === 'Dark'} onClick={() => { setActiveTheme('Dark'); document.documentElement.classList.add('dark') }} />
                    <ThemeToggle theme="System" icon={Shield} active={activeTheme === 'System'} onClick={() => setActiveTheme('System')} />
                </CardContent>
            </Card>

            {/* SECURITY & PASSWORD */}
            <Card className="glass-panel border-black/5 dark:border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `0.3s` }}>
                <CardHeader className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/2 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-orange-500" />
                        </div>
                        <CardTitle className="text-xl font-black">Security</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Update Password</label>
                        <div className="flex gap-3">
                            <Input 
                                type="password" 
                                placeholder="New ultra-secure password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-black/5 dark:bg-white/5 border-white/10 rounded-xl"
                            />
                            <Button 
                                onClick={handleUpdatePassword} 
                                disabled={isUpdatingPassword || !newPassword}
                                className="rounded-xl font-black px-6"
                            >
                                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">Changing this will update your Campus Buddy login, not your university portal password.</p>
                    </div>
                </CardContent>
            </Card>


            {/* DANGER ZONE */}
            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="bg-destructive/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-foreground">Danger Zone</CardTitle>
                            <CardDescription className="text-destructive font-bold text-xs uppercase tracking-tight">Irreversible actions</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Deleting your account will permanently wipe your profile, portal sync data, notification history, and active sessions. Data cannot be recovered.
                    </p>
                    
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full h-11 font-black rounded-xl gap-2 shadow-lg shadow-destructive/20">
                                <Trash2 className="w-4 h-4" /> Delete My Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-panel border-destructive/30 bg-background/95">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                                    <AlertTriangle className="text-destructive w-6 h-6" /> Permanent Deletion
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground mt-4 leading-relaxed">
                                    This action will wipe your entire database footprint from Campus Buddy Elite. 
                                    Attendance history, stored marks, and chat history will be lost forever.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-3">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Type <span className="text-destructive">DELETE</span> to confirm</label>
                                <input 
                                    type="text"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-black/5 dark:bg-white/5 border border-destructive/20 rounded-xl px-4 py-3 font-black tracking-widest text-destructive outline-none focus:border-destructive/50 transition-all text-center"
                                />
                            </div>
                            <DialogFooter className="gap-3">
                                <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting} className="rounded-xl font-bold">Cancel</Button>
                                <Button 
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirm !== 'DELETE' || isDeleting}
                                    variant="destructive"
                                    className="rounded-xl font-black flex-1 h-11"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Confirm Wiping Data
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
