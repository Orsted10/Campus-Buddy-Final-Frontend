export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Brand watermark */}
      <div className="absolute top-6 left-8 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-background font-black text-xs">CB</span>
        </div>
        <span className="font-black text-sm text-gradient">Campus Buddy</span>
      </div>

      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  )
}

