# Space Beats Game Engine Architecture

## 📁 Directory Structure

```
src/app/play/
├── _components/          # React components (UI layer)
│   ├── game-engine.tsx   # React wrapper for the game engine
│   └── game-hud.tsx      # Game HUD (score, HP, stats, etc.)
├── _lib/                 # Game logic and behavior (core layer)
│   ├── types.ts          # Type definitions
│   ├── game-config.ts    # Game configuration constants
│   ├── game-logic.ts     # Game logic class (no rendering)
│   ├── game-behavior.ts  # Game behavior (rendering, input, animation)
│   └── game-scene.ts     # Phaser scene (ties logic + behavior)
└── [playId]/
    └── page.tsx          # Game page
```

## 🏗️ Architecture Design

### 1. Separation of Logic and Behavior

#### `GameLogic` (Game Logic)
**Responsibilities**:
- ✅ Game state management
- ✅ Judgment calculation (Perfect/Good/Miss)
- ✅ Score tracking
- ✅ Gem data management
- ✅ Event dispatching

**Does not handle**:
- ❌ Rendering
- ❌ Input handling
- ❌ Animation

#### `GameBehavior` (Game Behavior)
**Responsibilities**:
- ✅ Rendering (gems, lanes, judgment line, etc.)
- ✅ Input handling (Q/W/E keys)
- ✅ Visual effects (judgment effects, particles, etc.)
- ✅ Animation

**Does not handle**:
- ❌ Game rules
- ❌ Judgment calculation
- ❌ Stats tracking

#### `GameScene` (Phaser Scene)
**Responsibilities**:
- ✅ Integrate logic and behavior
- ✅ Game loop management
- ✅ Resource loading
- ✅ Lifecycle management

### 2. Data Flow

```
User Input → GameBehavior → GameLogic.judgeHit()
                              ↓
                      Judgment + Update Stats
                              ↓
                           Emit Events
                              ↓
                     GameScene listens
                              ↓
                   GameBehavior shows effects
```

### 3. Component Hierarchy

```
PlayPage (page)
  └─ GameEngine (React component)
       ├─ Phaser.Game (game instance)
       │    └─ GameScene (scene)
       │         ├─ GameLogic (logic)
       │         └─ GameBehavior (behavior)
       └─ GameHUD (UI overlay)
```

## 🎮 Core Features

### Implemented ✅

1. **Game engine foundation**
   - Phaser 3 integration
   - Scene management system
   - Logic/behavior separation

2. **Game logic**
   - State management (WAITING, PLAYING, PAUSED, GAMEOVER)
   - Judgment system (Perfect/Good/Miss)
   - Score calculation
   - HP system (Resonance Integrity)
   - Combo tracking
   - Accuracy calculation

3. **Game behavior**
   - Basic rendering (lanes, judgment line, gems)
   - Key input (Q/W/E)
   - Judgment effects
   - Key highlight feedback

4. **UI system**
   - Game HUD (score, HP, stats)
   - Full-screen layout

### To Improve ⚠️

1. **Audio system**
   - [ ] Audio loading and playback
   - [ ] Audio time synchronization
   - [ ] Audio progress tracking

2. **Gem system**
   - [ ] Gem sprite textures
   - [ ] Precise gem spawn timing
   - [ ] Gem removal optimization

3. **Visual effects**
   - [ ] Particle effects system
   - [ ] Screen shake/flash
   - [ ] Dynamic background color changes
   - [ ] Better judgment effects

4. **Game flow**
   - [ ] Countdown animation
   - [ ] Pause menu
   - [ ] Result page
   - [ ] Game over handling

5. **Performance**
   - [ ] Gem object pool
   - [ ] Rendering optimization
   - [ ] Memory management

## 🔧 Usage

### 1. Use in a page

```tsx
import { GameEngine } from '../_components/game-engine'

export default function PlayPage() {
  const [songData, setSongData] = useState(null)

  return (
    <GameEngine
      songData={songData}
      onGameOver={(stats) => {
        // Handle game over
      }}
    />
  )
}
```

### 2. Configure game parameters

Update `game-config.ts`:

```typescript
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  judgmentLineY: 800,
  gemFallSpeed: 500, // px/s
  perfectThreshold: 50, // pixels
  goodThreshold: 120, // pixels
  laneCount: 3,
  initialHP: 100
}
```

### 3. Chart data format

```typescript
interface GemData {
  id: string
  time: number // Music timestamp (seconds)
  lane: number // 0, 1, 2
  type: 'score'
}
```

## 📝 Notes

1. **Time sync**: Currently uses scene time; should use real audio time.
2. **Gem spawning**: Needs precise timing based on fall speed.
3. **Performance**: Consider object pooling for large charts.
4. **Error handling**: Add more edge cases and error handling.

## 🚀 Next Steps

1. Implement the audio system with real audio time
2. Add gem textures/sprites
3. Build particle effects system
4. Add a game result page
5. Optimize performance and add tests
