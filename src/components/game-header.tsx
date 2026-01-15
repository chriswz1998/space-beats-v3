import React from 'react'

const GameHeader = () => {
  return (
    <div className="flex flex-col gap-2 relative">
      {/* Title background decorations */}
      <div className="absolute -left-4 -top-2 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl -z-10" />
      <div className="absolute -right-4 -bottom-2 w-28 h-28 bg-pink-500/20 rounded-full blur-2xl -z-10" />

      <h1 className="text-5xl font-black tracking-tight relative">
        <span className="absolute -left-2 -top-1 text-yellow-400 blur-sm opacity-50">
          Space Beats
        </span>
        <span className="relative bg-gradient-to-r from-yellow-400 via-pink-500 via-blue-500 to-green-400 bg-clip-text text-transparent">
          SPACE BEATS
        </span>
      </h1>
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 bg-gradient-to-r from-yellow-400 to-pink-500" />
        <p className="text-black/80 text-sm font-bold uppercase tracking-wider">
          Rhythm Game
        </p>
        <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-green-400" />
      </div>
    </div>
  )
}
export default GameHeader
