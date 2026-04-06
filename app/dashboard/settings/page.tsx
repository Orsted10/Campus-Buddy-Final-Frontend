'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, Shield, Bell, Moon, Sun, Trash2, 
  ChevronRight, AlertTriangle, ShieldAlert,
  Loader2, LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const user = useAuthStore((state: any) => state.user)
  const clearUser = useAuthStore((state: any) => state.clearUser)
  const router = useRouter()
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Deletion failed')
      
      toast.success('Account deleted successfully. Goodbye!')
      clearUser()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to wipe account data. Try again later.')
      setIsDeleting(false)
    }
  }

  const sections = [
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
        { label: 'Notifications', value: 'Enabled', type: 'toggle' },
        { label: 'Smart Dashboard', value: 'Active', status: 'Optimal' },
        { label: 'Portal Sync', value: 'Auto-Refresh', status: 'Enabled' },
      ]
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter">Settings</h1>
        <p className="text-muted-foreground mt-2 font-medium">Manage your Elite account and app preferences.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar-like selection */}
        <div className="space-y-2">
            {['General', 'Security', 'Data', 'Notifications'].map((t, i) => (
                <button 
                   key={t}
                   className={`w-full text-left p-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all ${i === 0 ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                    {t}
                    {i === 0 && <ChevronRight className="w-4 h-4" />}
                </button>
            ))}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-8">
            {sections.map((section, idx) => (
                <Card key={section.id} className="glass-panel border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CardHeader className="border-b border-white/5 bg-white/2 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <section.icon className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black">{section.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {section.items.map((item, i) => (
                            <div key={item.label} className={`p-5 flex items-center justify-between border-b border-white/5 hover:bg-white/2 transition-colors ${i === section.items.length - 1 ? 'border-none' : ''}`}>
                                <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
                                {item.isBadge ? (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase text-[10px] tracking-widest">{item.value}</Badge>
                                ) : (
                                    <span className="text-sm font-black text-white">{item.value}</span>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* DANGER ZONE */}
            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="bg-destructive/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black text-white">Danger Zone</CardTitle>
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
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
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
                                    className="w-full bg-white/5 border border-destructive/20 rounded-xl px-4 py-3 font-black tracking-widest text-destructive outline-none focus:border-destructive/50 transition-all text-center"
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
