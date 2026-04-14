'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Save, Trash2, Calendar, Utensils, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getApiUrl } from '@/lib/api-config'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'menu'>('calendar')
  const [rawText, setRawText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleParse = async () => {
    if (!rawText.trim()) return
    setIsParsing(true)
    try {
      const res = await fetch(getApiUrl('/api/admin/config/parse'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, type: activeTab })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsedData(data.data)
      toast.success('AI successfully parsed your data!')
    } catch (err: any) {
      toast.error(err.message || 'AI failed to parse text')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSave = async () => {
    if (!parsedData) return
    setIsSaving(true)
    const supabase = createClient()
    
    try {
      // 1. Fetch current config to merge
      const { data: existing } = await supabase
        .from('app_config')
        .select('config')
        .eq('key', 'global_v1')
        .maybeSingle()
      
      const newConfig = {
        ...(existing?.config || {}),
        [activeTab === 'calendar' ? 'academicCalendar' : 'messMenu']: parsedData
      }

      // 2. Upsert
      const { error } = await supabase
        .from('app_config')
        .upsert({ 
          key: 'global_v1', 
          config: newConfig,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Live Config updated for all users!')
      setParsedData(null)
      setRawText('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save to cloud')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">AI Admin Engine</h1>
          <p className="text-muted-foreground text-sm">Magic updates for Calendar & Mess Menu</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* INPUT SIDE */}
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-muted rounded-2xl w-fit">
            <button 
              onClick={() => { setActiveTab('calendar'); setParsedData(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              <Calendar className="w-3 h-3" /> Calendar
            </button>
            <button 
              onClick={() => { setActiveTab('menu'); setParsedData(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'menu' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
            >
              <Utensils className="w-3 h-3" /> Mess Menu
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paste Raw Text / Data Snippet</label>
            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={activeTab === 'calendar' ? "Paste dates like 'May 1st Holi, May 5th Exam...'" : "Paste menu like 'Mon Breakfast: Idli, Lunch: Rajma...'"}
              className="w-full h-80 glass-panel bg-background/50 border-black/5 dark:border-white/5 rounded-3xl p-6 text-sm outline-none focus:border-primary/50 transition-all font-mono"
            />
          </div>

          <button 
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="w-full py-4 bg-primary text-background font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40"
          >
            {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            PARSE WITH AI MAGIC
          </button>
        </div>

        {/* PREVIEW SIDE */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl min-h-[450px] border-black/5 dark:border-white/5 relative overflow-hidden">
            {!parsedData ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <AlertCircle className="w-12 h-12" />
                <p className="font-bold">No data processed yet.<br/><span className="text-xs">The AI output will appear here for verification.</span></p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI Preview</h3>
                  <button onClick={() => setParsedData(null)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
                
                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl overflow-auto max-h-[400px]">
                  <pre className="text-[10px] font-mono whitespace-pre-wrap">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 text-xs text-muted-foreground flex items-center gap-2 italic">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  AI has structured the data. Review before saving live.
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  PUBLISH LIVE CHANGE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
