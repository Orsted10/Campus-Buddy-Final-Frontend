'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Search, 
  Filter, 
  Building2, 
  Coffee, 
  BookOpen, 
  ShieldCheck, 
  Sparkles,
  Navigation2,
  ChevronRight,
  Info,
  Clock,
  Layers
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CAMPUS_POI } from '@/lib/constants'
import { cn } from '@/lib/utils'

const categories = [
  { name: 'All', icon: Sparkles },
  { name: 'Administrative', icon: ShieldCheck },
  { name: 'Academics', icon: BookOpen },
  { name: 'Food & Drinks', icon: Coffee },
  { name: 'Services & Life', icon: Building2 },
]

const floors = ['All', 'Ground', '1st', '2nd', '3rd', '4th', '5th']

export default function NavigationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeFloor, setActiveFloor] = useState('All')

  const filteredPOIs = useMemo(() => {
    return CAMPUS_POI.filter(poi => {
      const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          poi.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'All' || poi.category === activeCategory
      const matchesFloor = activeFloor === 'All' || poi.floor === activeFloor
      return matchesSearch && matchesCategory && matchesFloor
    })
  }, [searchQuery, activeCategory, activeFloor])

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary mb-2"
          >
            <Navigation2 className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Campus Buddy Maps</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Digital <span className="text-gradient">Navigator</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2 max-w-lg"
          >
            Find your way across Block E and the surrounding facilities with real-time floor awareness.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group w-full md:w-96"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all rounded-3xl -z-10 opacity-50" />
          <div className="relative glass-panel rounded-2xl flex items-center px-4 py-3 border-white/10 group-focus-within:border-primary/50 transition-all">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search canteen, library, exam cell..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm font-medium placeholder:text-muted-foreground/50"
            />
          </div>
        </motion.div>
      </div>

      {/* Hologram Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group cursor-pointer"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30 backdrop-blur-xl animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">3D Hologram View</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Conceptualizing a futuristic 3D building projection for your campus. Building the foundational POI grid first.
          </p>
          <div className="mt-6 px-6 py-2 rounded-full border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest bg-primary/5 backdrop-blur-sm">
            Coming Soon in v2.0
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </motion.div>

      {/* Filters Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-muted-foreground mr-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
          </div>
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.name
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all whitespace-nowrap shrink-0 border text-sm font-bold",
                  isActive 
                    ? "bg-primary text-background border-primary glow-olive-sm scale-105" 
                    : "glass border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-white/5 text-muted-foreground mr-2 shrink-0">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Floors</span>
          </div>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={cn(
                "px-6 py-2 rounded-xl transition-all text-sm font-bold border shrink-0",
                activeFloor === floor
                  ? "bg-white text-black border-white"
                  : "glass border-white/5 text-muted-foreground hover:border-white/10"
              )}
            >
              {floor === 'All' ? 'All Floors' : `${floor} Floor`}
            </button>
          ))}
        </div>
      </div>

      {/* POI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPOIs.map((poi, idx) => (
            <motion.div
              layout
              key={poi.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Card className="glass h-full group hover:bg-white/[0.03] transition-colors border-white/5 overflow-hidden">
                <CardContent className="p-6 relative">
                  {/* Decorative Floor Badge */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    <div className="px-3 py-1 rounded-lg bg-surface-3 border border-white/10 text-[10px] font-black uppercase text-primary tracking-tighter">
                      {poi.floor} Floor
                    </div>
                    {poi.side !== 'N/A' && (
                      <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase text-muted-foreground">
                        {poi.side}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                      <MapPin className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors truncate">
                        {poi.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground/80 uppercase">
                          {poi.block}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-snug">
                        {poi.description}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-2 text-xs font-bold text-primary self-start group/btn"
                    >
                      GET DIRECTIONS
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {poi.keywords.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-muted-foreground/40 font-medium">#{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredPOIs.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mx-auto border border-white/5">
            <Search className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-xl font-bold text-white">No locations found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search keywords.</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveFloor('All'); }}
            className="text-primary font-bold hover:underline"
          >
            Clear all filters
          </button>
        </motion.div>
      )}

      {/* Floating Action Button (Quick Info) */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl glow-white"
        >
          <Clock className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  )
}
