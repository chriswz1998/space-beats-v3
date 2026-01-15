import { IconMusic } from '@tabler/icons-react'

export const SongListHeader = () => {
  return (
    <div className="flex items-center gap-4 mb-8 relative">
      {/* Background decorations */}
      <div className="absolute -left-6 -top-4 w-24 h-24 bg-yellow-400/30 rounded-full blur-xl -z-10" />
      <div className="absolute -right-6 -bottom-4 w-20 h-20 bg-pink-500/30 rounded-full blur-xl -z-10" />

      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 via-pink-500 to-blue-500 border-4 border-white shadow-[0_0_0_2px_black] relative overflow-hidden">
        <div className="absolute inset-0 pop-art-dots opacity-30" />
        <IconMusic className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
      </div>
      <div className="flex-1">
        <h2 className="text-3xl font-black text-white mb-1 drop-shadow-lg">
          <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Song List
          </span>
          <span className="ml-2 text-yellow-400">♪</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-yellow-400" />
          <p className="text-sm text-black/90 font-semibold uppercase tracking-wide">
            Choose a song to start the game
          </p>
          <div className="h-1 w-8 bg-pink-500" />
        </div>
      </div>
    </div>
  )
}
