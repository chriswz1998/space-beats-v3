import React from 'react'

const GlobalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen text-white bg-[radial-gradient(circle_at_top,#1a2940_0%,#050814_55%,#020308_100%)] pop-art-dots relative overflow-hidden">
      {/* Pop art background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large colorful circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full opacity-20 blur-3xl pop-rotate" />
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-pink-500 rounded-full opacity-25 blur-3xl pop-pulse" />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-500 rounded-full opacity-20 blur-3xl pop-rotate"
          style={{ animationDirection: 'reverse' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-400 rounded-full opacity-25 blur-3xl pop-pulse"
          style={{ animationDelay: '1s' }}
        />

        {/* Stripe decorations */}
        <div className="absolute top-0 left-0 w-full h-40 pop-art-stripes opacity-30" />
        <div
          className="absolute bottom-0 left-0 w-full h-40 pop-art-stripes opacity-30"
          style={{ transform: 'rotate(180deg)' }}
        />

        {/* Color block decorations */}
        <div className="absolute top-1/3 right-20 w-32 h-32 bg-red-500 opacity-30 rotate-45 pop-bounce" />
        <div
          className="absolute bottom-1/3 left-20 w-28 h-28 bg-purple-500 opacity-30 rotate-12 pop-bounce"
          style={{ animationDelay: '0.5s' }}
        />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large colorful circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-400 rounded-full opacity-20 blur-2xl pop-rotate" />
        <div className="absolute top-20 right-20 w-48 h-48 bg-pink-500 rounded-full opacity-25 blur-2xl pop-pulse" />
        <div
          className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 blur-2xl pop-rotate"
          style={{ animationDirection: 'reverse' }}
        />
        <div
          className="absolute bottom-20 right-0 w-56 h-56 bg-green-400 rounded-full opacity-25 blur-2xl pop-pulse"
          style={{ animationDelay: '1s' }}
        />

        {/* Stripe decorations */}
        <div className="absolute top-0 left-0 w-full h-32 pop-art-stripes opacity-30" />
        <div
          className="absolute bottom-0 left-0 w-full h-32 pop-art-stripes opacity-30"
          style={{ transform: 'rotate(180deg)' }}
        />

        {/* Color block decorations */}
        <div className="absolute top-1/4 right-10 w-24 h-24 bg-red-500 opacity-30 rotate-45 pop-bounce" />
        <div
          className="absolute bottom-1/3 left-10 w-20 h-20 bg-purple-500 opacity-30 rotate-12 pop-bounce"
          style={{ animationDelay: '0.5s' }}
        />
      </div>
      {children}
    </div>
  )
}

export default GlobalLayout
