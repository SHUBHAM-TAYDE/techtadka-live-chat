import { Hash } from 'lucide-react'

const Welcome = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-base">
    {/* Animated icon */}
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <Hash size={28} className="text-accent" />
      </div>
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-online rounded-full border-2 border-base animate-pulse" />
    </div>

    <div>
      <h2 className="text-lg font-semibold text-ink-1 mb-1">Pick a room to start</h2>
      <p className="text-sm text-ink-3 max-w-xs leading-relaxed">
        Select a channel from the sidebar or create a new one to start chatting in real time.
      </p>
    </div>

    <div className="mt-2 flex flex-col gap-2 text-xs text-ink-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        Real-time messaging via WebSockets
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-online" />
        Online presence powered by Redis
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Message history from PostgreSQL
      </div>
    </div>
  </div>
)

export default Welcome
