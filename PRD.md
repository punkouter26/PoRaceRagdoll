# Product Requirements Document (PRD)
## PoRaceRagdoll - 3D Ragdoll Racing Betting Game

---

## 1. Executive Summary

### 1.1 Product Overview
PoRaceRagdoll is a web-based 3D physics simulation betting game where players wager virtual currency on ragdoll creatures racing down an obstacle-filled ramp. The game combines realistic physics simulation using Babylon.js and Havok Physics with an engaging betting mechanic inspired by traditional sports gambling.

### 1.2 Product Vision
Create an addictive, visually stunning, and physics-based entertainment experience that blends the excitement of betting with the unpredictability of ragdoll physics simulation. The game should feel like a hybrid between a physics sandbox, a betting simulator, and an arcade racing game.

### 1.3 Target Audience
- **Primary**: Casual gamers aged 18-35 who enjoy physics-based games and simulation entertainment
- **Secondary**: Gambling simulation enthusiasts looking for risk-free betting experiences
- **Tertiary**: 3D graphics and physics simulation enthusiasts

### 1.4 Core Value Proposition
- **Unpredictable Entertainment**: Every race is unique due to ragdoll physics and procedurally placed obstacles
- **Risk-Free Betting**: Experience gambling mechanics without financial risk
- **Visual Spectacle**: High-quality 3D graphics with modern rendering techniques
- **Quick Sessions**: Rounds last 30-60 seconds, perfect for short breaks

---

## 2. Product Goals & Success Metrics

### 2.1 Business Goals
1. Achieve 100,000+ unique players in first 6 months
2. Maintain average session length of 10+ minutes (2-3 rounds)
3. Achieve 40%+ day-1 retention rate
4. Generate viral social sharing through entertaining race outcomes

### 2.2 User Goals
1. Experience entertaining, unpredictable ragdoll physics
2. Feel the thrill of betting without real financial consequences
3. Learn and master the odds system to improve betting strategy
4. Enjoy visually impressive 3D graphics and animations

### 2.3 Key Performance Indicators (KPIs)
- **Engagement**: Average races per session, total play time
- **Retention**: D1, D7, D30 retention rates
- **Technical**: Average FPS, page load time, crash rate
- **Virality**: Social shares, embedded plays

---

## 3. Core Features & Functionality

### 3.1 Game Modes

#### 3.1.1 Standard Race Mode (MVP)
**Description**: Complete a 5-round tournament with starting balance of $1,000

**User Flow**:
1. **BETTING Phase**
   - View 8 ragdoll creatures in individual 3D viewports
   - Each creature displays: Name, Species, Mass, Odds
   - Select one creature to bet on
   - Place fixed $100 bet
   - Transition to race with countdown

2. **RACING Phase**
   - 3-second countdown (3... 2... 1... GO!)
   - Creatures tumble down angled ramp
   - Camera follows race leader
   - First creature to cross finish line wins
   - Automatic transition to results

3. **RESULTS Phase**
   - Display winner name
   - Show WIN/LOSS for player
   - Update balance based on odds payout
   - Option to continue to next round or restart

4. **END Game**
   - After 5 rounds, display final balance
   - Reset to round 1 with fresh $1,000 balance

---

### 3.2 Racer System

#### 3.2.1 Creature Types (8 Total)
Each creature has unique ragdoll physics properties:

| Species | Mass (kg) | Visual Design | Physics Behavior |
|---------|-----------|---------------|------------------|
| **Human** | 70 | Humanoid torso, head, 4 limbs | Standard bipedal ragdoll, balanced |
| **Spider** | 40 | Sphere body, 8 radial legs | Low center of gravity, wide stance |
| **Dog** | 50 | Box body, head, 4 legs | Quadrupedal, stable |
| **Snake** | 30 | 6 connected spheres | Flexible segmented body, rolls easily |
| **Crab** | 45 | Wide box body, 6 legs | Sideways-oriented, wide base |
| **Dino** | 120 | Large body, head, tail, 2 legs | Heavy, high momentum, unstable |
| **Penguin** | 35 | Vertical capsule body, 2 flippers | Top-heavy, tumbles easily |
| **Alien** | 60 | Large sphere head, 3 legs | Tripod stance, unusual balance |

#### 3.2.2 Ragdoll Physics Implementation

**Body Part Hierarchy**:
- **Main Body**: Largest mass (40-70% of total)
- **Head**: 10% of total mass
- **Limbs/Appendages**: Remaining mass distributed

**Physics Constraints**:
- 6DoF (6 Degrees of Freedom) joints between body parts
- Linear constraints: Locked (0 translation)
- Angular constraints: Species-specific rotation limits
- Collision disabled between connected parts

**Physics Properties**:
- **Linear Damping**: 0.8 (air resistance)
- **Angular Damping**: 2.0 (rotational resistance)
- **Restitution**: 0.1 (low bounciness)
- **Friction**: 0.3 (body friction coefficient)

#### 3.2.3 Racer Generation
- Each round generates 8 racers with randomized attributes:
  - Random species selection from pool
  - Mass variance: ±5kg from base species mass
  - Color: Species-specific color palette
  - Unique identifier: Species name + number (e.g., "Human 3")

---

### 3.3 Track & Obstacles

#### 3.3.1 Main Ramp
**Dimensions**:
- Length: 200 units
- Width: 20 units
- Slope: 15° angle
- Surface: Asphalt texture with bump mapping

**Physics Properties**:
- Static (mass: 0)
- Friction: 0.2 (low for speed)
- Restitution: 0.5 (moderate bounciness)

**Visual Design**:
- Dark asphalt material (PBR shader)
- Ground texture with 5x50 UV scaling
- Rock bump texture for surface detail
- Roughness: 0.7, Metallic: 0.0

#### 3.3.2 Side Walls
- **Height**: 10 units
- **Material**: Semi-transparent cyan glass
- **Properties**:
  - Alpha: 0.4 (40% transparent)
  - Emissive glow: Cyan (#0.1, 0.8, 0.9)
  - Subsurface refraction enabled
- **Function**: Prevent racers from falling off track

#### 3.3.3 Finish Line
- **Type**: Red emissive strip
- **Width**: Full track width (20 units)
- **Length**: 3 units
- **Position**: 1.5 units from ramp end
- **Visual**: Bright red with emissive glow (intensity: 2.0)

#### 3.3.4 Obstacle System

**Obstacle Density**: 20 obstacles randomly distributed along ramp

**Obstacle Types**:

1. **Static Obstacles (60% probability)**
   - **Cylinders**: 2-unit diameter, 4-unit height
   - **Boxes**: 3x2x3 units (W×H×D)
   - Randomly positioned across track width
   - Red metallic material (roughness: 0.2, metallic: 0.8)

2. **Spinning Hammers (20% probability)**
   - **Base**: 1-diameter cylinder pillar (2 units tall)
   - **Hammer**: 8-unit wide rotating bar
   - **Physics**: Dynamic mass (100kg) with hinge constraint
   - **Motor**: Angular velocity motor (5 rad/s) on Y-axis
   - **Behavior**: Continuous 360° rotation, knocks racers

3. **Sliding Walls (20% probability)**
   - **Dimensions**: 10-unit width, 3-unit height, 1-unit depth
   - **Motion**: Horizontal sliding across track width
   - **Physics**: Animated (kinematic) motion type
   - **Animation**: 120-frame cycle (4 seconds at 30 fps)
   - **Behavior**: Pushes racers but cannot be pushed

**Obstacle Distribution**:
- Z-axis range: -80 to +80 units (160-unit span)
- Gaussian-weighted random distribution (centered)
- X-axis: Random within safe track bounds (±5 units from center)

---

### 3.4 Betting & Odds System

#### 3.4.1 Betting Mechanics
- **Starting Balance**: $1,000
- **Bet Amount**: Fixed $100 per race
- **Minimum Balance**: $100 (must have funds to bet)
- **Payout**: American odds-based calculation

#### 3.4.2 Odds Calculation Algorithm

**Formula**:
```javascript
Base Score = 50
Mass Factor = racer.mass × 2

if (slopeAngle > 20°) {
  Score += Mass Factor × 0.5
} else {
  Score += Mass Factor × 0.2
}

Score += Random(-10, +10)  // Variance

Probability = (Score + 50) / 200
Probability = clamp(0.05, 0.95)  // Floor/ceiling

if (Probability >= 0.5) {
  Odds = -(Probability / (1 - Probability)) × 100  // Favorite
} else {
  Odds = ((1 - Probability) / Probability) × 100   // Underdog
}
```

**Example Odds**:
- Dino (120kg): -150 (favorite, high mass advantage)
- Snake (30kg): +250 (underdog, low mass disadvantage)

#### 3.4.3 Payout Calculation

**American Odds Payout**:
```javascript
if (odds > 0) {  // Underdog
  profit = betAmount × (odds / 100)
} else {  // Favorite
  profit = betAmount × (100 / |odds|)
}

totalPayout = profit + betAmount  // Return stake + profit
```

**Examples**:
- Bet $100 on +250: Win = $250 profit + $100 stake = $350 total
- Bet $100 on -150: Win = $67 profit + $100 stake = $167 total
- Loss: $0 (stake already deducted when placing bet)

#### 3.4.4 Balance Management
- Balance updates after each race result
- Game ends if balance drops below $100
- After 5 rounds, game resets to round 1 with fresh $1,000

---

### 3.5 User Interface (UI)

#### 3.5.1 UI Architecture
**Framework**: React 19 with Tailwind CSS 4
**Design System**: Glassmorphism with cyberpunk aesthetics
**Layout**: Overlay HUD on 3D canvas

#### 3.5.2 Screen Layouts

**BETTING Screen**:
```
┌─────────────────────────────────────────────┐
│  [Balance: $XXX]  PORACE  [Round: X/5]     │  ← Top HUD
├─────────────────────────────────────────────┤
│                                             │
│  ┌────┬────┬────┬────┐                     │
│  │ R1 │ R2 │ R3 │ R4 │  ← 3D Viewports     │
│  ├────┼────┼────┼────┤     (4×2 Grid)      │
│  │ R5 │ R6 │ R7 │ R8 │                     │
│  └────┴────┴────┴────┘                     │
│                                             │
│  [Name] [Species] [Mass] [Odds]            │
│  Hover Cards over viewports                 │
│                                             │
├─────────────────────────────────────────────┤
│         [PLACE BET ($100)]                  │  ← Bottom Controls
└─────────────────────────────────────────────┘
```

**RACING Screen**:
```
┌─────────────────────────────────────────────┐
│  [Balance: $XXX]        [Round: X/5]       │
├─────────────────────────────────────────────┤
│                                             │
│           [3D Race View]                    │
│      Camera follows leader                  │
│      Countdown overlay (3,2,1,GO!)          │
│                                             │
├─────────────────────────────────────────────┤
│     ● Race in Progress                      │
└─────────────────────────────────────────────┘
```

**RESULTS Screen**:
```
┌─────────────────────────────────────────────┐
│              VICTORY / DEFEAT               │
│                                             │
│         Winner: [Racer Name]                │
│                                             │
│            [Next Round]                     │
└─────────────────────────────────────────────┘
```

#### 3.5.3 UI Components

**Glass Panel** (Reusable Component):
- Background: `rgba(255, 255, 255, 0.05)`
- Backdrop filter: `blur(12px)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Border radius: Variable (16-48px)

**Color Palette**:
- Primary: `#F72585` (Hot Pink) - Actions
- Secondary: `#4CC9F0` (Cyan) - Highlights
- Accent: `#7209B7` (Purple) - Selection
- Text: `#FFFFFF` (White) - Primary text
- Muted: `rgba(255, 255, 255, 0.4)` - Secondary text
- Background: `rgba(0, 0, 0, 0.4)` - Overlays

**Typography**:
- Font: System sans-serif
- Headings: Black weight (900), uppercase, wide tracking
- Body: Regular weight (400), normal case
- Numbers: Mono fallback for consistency

**Animations**:
- Transitions: 300ms ease-in-out
- Hover scale: 1.02×
- Active scale: 0.98×
- Pulse: For active states (selection, racing)
- Fade-in/Zoom-in: 300ms for modals

---

### 3.6 3D Graphics & Rendering

#### 3.6.1 Rendering Engine
- **Framework**: Babylon.js 8.38
- **Physics**: Havok Physics 1.3 (WebAssembly)
- **Anti-aliasing**: FXAA (4× samples)

#### 3.6.2 Lighting Setup

**Scene Lights**:
1. **Hemisphere Light**
   - Direction: (0, 1, 0) - Upward
   - Intensity: 0.5
   - Purpose: Ambient fill light

2. **Directional Light** (Main)
   - Direction: (-0.5, -1, -0.5)
   - Position: (50, 100, 50)
   - Intensity: 2.0
   - Shadows: Enabled
     - Map size: 2048×2048
     - Blur: Exponential blur (kernel: 32)
     - Transparent shadow support

**Environment**:
- **Skybox**: Procedural HDR environment
  - Source: `environment.env` (Babylon playground)
  - Size: 1000-unit radius
- **IBL**: Environment texture for reflections

#### 3.6.3 Post-Processing Pipeline

**Default Rendering Pipeline** (Next-Gen Graphics):

1. **HDR**: Enabled
2. **Tone Mapping**:
   - Type: ACES filmic
   - Exposure: 1.2
   - Contrast: 1.2

3. **Bloom** (Glow Effect):
   - Enabled: Yes
   - Threshold: 0.6 (only bright areas)
   - Weight: 0.4 (intensity)
   - Kernel: 64 (blur quality)
   - Scale: 0.5 (resolution)

4. **Depth of Field**: Disabled (too blurry for gameplay)

5. **Ambient Fog**:
   - Mode: Exponential² (EXP2)
   - Density: 0.002
   - Color: Dark blue-gray `(0.05, 0.05, 0.1)`

#### 3.6.4 Material System

**PBR (Physically Based Rendering)**:
All materials use PBR shader for realistic lighting

**Racer Materials**:
- Albedo: Species-specific color
- Roughness: 0.5 (semi-rough)
- Metallic: 0.1 (mostly dielectric)

**Track Material**:
- Albedo: Dark gray (0.2, 0.2, 0.2)
- Textures: 
  - Diffuse: `ground.jpg` (5×50 scale)
  - Bump: `rock.png` (10×50 scale, level 0.5)
- Roughness: 0.7
- Metallic: 0.0

**Obstacle Material**:
- Albedo: Red (0.8, 0.2, 0.2)
- Roughness: 0.2 (shiny)
- Metallic: 0.8 (very metallic)

#### 3.6.5 Camera System

**BETTING Phase** (Selection Screen):
- **Type**: Multiple ArcRotate cameras (8 total)
- **Layout**: 4×2 viewport grid
- **Per-Camera Settings**:
  - Distance: Species-adaptive (3.5-7 units)
  - Target: Racer center of mass
  - Rotation: Automatic Y-axis spin (0.01 rad/frame)

**RACING Phase**:
- **Type**: Single ArcRotate camera
- **Behavior**: Dynamic leader tracking
  - Target: Lerp to leader position (5% per frame)
  - Distance: 12 units
  - Angle: Behind and above (-90°, 45°)
  - Target Y offset: +1 unit above racer

**ATTRACT Mode** (Idle on betting screen):
- Slow circular orbit
- Sine-wave radius modulation
- Smooth target transitions

---

### 3.7 Audio System

#### 3.7.1 Audio Architecture
- **API**: Web Audio API
- **Manager**: Custom `AudioManager` class
- **Synthesis**: Procedural oscillator-based sounds

#### 3.7.2 Sound Effects

| Event | Sound Type | Frequency | Duration | Volume |
|-------|------------|-----------|----------|--------|
| **Racer Selection** | Coin | 1200Hz + 1600Hz | 0.1s + 0.2s | 0.1 |
| **Countdown (3,2,1)** | Beep | 400Hz | 0.1s | 0.1 |
| **GO Signal** | Sawtooth | 800Hz | 0.5s | 0.1 |
| **UI Hover** | Blip | 600Hz | 0.05s | 0.05 |

**Waveform Types**:
- **Sine**: Smooth, pure tone (coin pickup)
- **Square**: Sharp, digital (countdown beeps)
- **Sawtooth**: Bright, buzzy (race start)

---

### 3.8 Performance & Optimization

#### 3.8.1 Target Performance
- **Framerate**: 60 FPS minimum
- **Load Time**: <3 seconds initial load
- **Physics Update**: 60Hz fixed timestep
- **Memory**: <500MB RAM usage

#### 3.8.2 Physics Optimization

**Ragdoll Stability System**:
1. **Spawn Phase**:
   - Ragdolls start in ANIMATED (kinematic) mode
   - Zero velocity initialization
   - 50ms stabilization delay

2. **Race Start**:
   - Reset all velocities to zero
   - Switch to DYNAMIC mode after delay
   - Velocity monitoring (warn if >5 m/s)

3. **Constraint Configuration**:
   - Internal collision disabled
   - High damping (linear: 0.8, angular: 2.0)
   - Low restitution (0.1) to minimize bouncing

#### 3.8.3 Rendering Optimization
- **Shadow Map**: 2048×2048 (balanced quality)
- **FXAA**: Single-pass anti-aliasing (fast)
- **Bloom**: Downscaled 0.5× for performance
- **Viewport Culling**: Only render active viewports

---

## 4. Technical Architecture

### 4.1 Technology Stack

**Frontend Framework**:
- React 19.2
- React DOM 19.2

**Build Tool**:
- Vite 7.2.4
- Rollup bundler

**3D Graphics**:
- Babylon.js 8.38 (Core, GUI, Loaders)
- Havok Physics 1.3 (WASM)

**Styling**:
- Tailwind CSS 4.1
- PostCSS with Autoprefixer

**State Management**:
- Zustand 5.0.9 (lightweight store)

**Language**:
- JavaScript (ES2022+)
- JSX for React components

### 4.2 Project Structure

```
/PoRaceRagdoll
├── src/
│   ├── components/          # React UI components
│   │   ├── GameUI.jsx       # HUD overlay (balance, round, results)
│   │   ├── OddsBoard.jsx    # Betting screen with racer cards
│   │   ├── RaceCanvas.jsx   # Main 3D race scene
│   │   └── SelectionCanvas.jsx  # 3D racer preview viewports
│   │
│   ├── physics/             # Babylon.js physics modules
│   │   ├── ragdolls.js      # Ragdoll creation & species definitions
│   │   ├── track.js         # Ramp, walls, finish line
│   │   └── obstacles.js     # Hammers, walls, static obstacles
│   │
│   ├── store/               # State management
│   │   └── gameStore.js     # Zustand store (game state, betting, rounds)
│   │
│   ├── assets/              # Static assets (images, models)
│   ├── audio.js             # Web Audio manager
│   ├── config.js            # Game constants (species, balance, rounds)
│   ├── App.jsx              # Root React component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles + Tailwind
│
├── public/                  # Static files served directly
├── docs/                    # Documentation (C4 diagrams, workflows)
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS plugins
├── eslint.config.js         # Linter rules
└── package.json             # Dependencies & scripts
```

### 4.3 Data Flow Architecture

**Game State Machine** (Zustand Store):
```
BETTING → RACING → FINISHED → BETTING (next round)
   ↑                              ↓
   └──────────── (Round 5) ───────┘
              [Reset to Round 1]
```

**State Variables**:
```javascript
{
  balance: Number,          // Current player funds
  round: Number,            // Current round (1-5)
  maxRounds: Number,        // Total rounds (5)
  gameState: String,        // 'BETTING' | 'RACING' | 'FINISHED'
  racers: Array,            // [{ id, name, species, mass, odds }]
  selectedRacerId: Number,  // Selected racer ID or null
  betAmount: Number,        // Fixed $100
  winnerId: Number          // Winning racer ID or null
}
```

**State Actions**:
- `selectRacer(id)` - Mark racer as selected
- `placeBet()` - Deduct bet, start race
- `finishRace(winnerId)` - Calculate payout, show results
- `nextRound()` - Generate new racers, advance round

### 4.4 Component Communication

**Props Flow**:
```
App.jsx
  └─→ GameUI.jsx (gameState, balance, round)
  └─→ OddsBoard.jsx (gameState, racers)
       └─→ SelectionCanvas.jsx (racers)
  └─→ RaceCanvas.jsx (gameState, racers)
```

**Event Flow**:
```
User Click → selectRacer() → Store Update → UI Re-render
         ↓
   placeBet() → gameState = 'RACING' → RaceCanvas activates
         ↓
   Race Finish → finishRace(winner) → Payout calculation
         ↓
   User Click → nextRound() → New racers → gameState = 'BETTING'
```

### 4.5 Physics Simulation Pipeline

**Initialization**:
1. Fetch Havok WASM binary from CDN
2. Initialize Havok plugin in Babylon
3. Enable physics with gravity (0, -9.81, 0)

**Ragdoll Creation**:
1. Create mesh geometry for each body part
2. Create PhysicsAggregate for each mesh
3. Set collision membership/filtering
4. Connect parts with 6DoF constraints
5. Initialize in ANIMATED mode (kinematic)

**Race Execution**:
1. Countdown: 3-2-1-GO (Audio cues)
2. Physics activation:
   - Reset all velocities to zero
   - Wait 50ms for stabilization
   - Switch all bodies to DYNAMIC mode
3. Physics simulation runs at 60Hz
4. Check race completion each frame
5. Winner detection: First racer.z > finishZ

**Telemetry** (Development):
- Log racer positions every 10 frames
- Export race data to `window.RACE_DATA` (JSON)
- Console warnings for high initial velocities

---

## 5. User Experience (UX) Design

### 5.1 User Journey Map

**Session Flow**:
```
1. LANDING
   ↓
2. AUTO-START (No login required)
   ↓
3. BETTING SCREEN
   - View 8 racers in 3D
   - Select favorite
   - Review odds
   - Place bet
   ↓
4. RACE COUNTDOWN (3 seconds)
   ↓
5. RACE SIMULATION (30-60 seconds)
   - Watch physics unfold
   - Root for selected racer
   ↓
6. RESULTS SCREEN
   - See win/loss
   - View balance change
   - Emotional peak (joy/frustration)
   ↓
7. NEXT ROUND (or quit)
   ↓
[Repeat 3-6 for 5 rounds total]
   ↓
8. FINAL RESULTS
   - Total profit/loss
   - Option to restart
```

### 5.2 Interaction Design

#### 5.2.1 Input Methods
- **Mouse**: Primary interaction (click, hover)
- **Touch**: Mobile support (tap, swipe)
- **Keyboard**: Secondary (Space = Place Bet, Enter = Next Round)

#### 5.2.2 Feedback Systems

**Visual Feedback**:
- Hover: Border glow, scale 1.02×
- Selection: Gradient border, pulsing indicator
- Active state: Animated "Race in Progress" pill
- Disabled: Grayscale, reduced opacity

**Audio Feedback**:
- Every click: Coin sound
- Countdown: Beeps at 1-second intervals
- Race start: Bright sawtooth tone

**Haptic Feedback** (Mobile):
- Light tap on selection
- Medium buzz on bet placement

#### 5.2.3 Accessibility

**Visual Accessibility**:
- High contrast text (white on dark)
- Large touch targets (minimum 44×44px)
- Clear visual hierarchy (size, color, spacing)

**Screen Reader Support**:
- Semantic HTML (buttons, headings)
- ARIA labels for interactive elements
- Descriptive alt text for icons

**Keyboard Navigation**:
- Tab order follows visual flow
- Focus indicators visible
- All actions keyboard-accessible

### 5.3 Error Handling

**User Errors**:
| Error | Prevention | Recovery |
|-------|------------|----------|
| No racer selected | Disable "Place Bet" button | Show "Select Racer" prompt |
| Insufficient balance | Disable betting if balance < $100 | Auto-restart game |
| Physics explosion | Velocity monitoring + reset | Re-run race with stabilized physics |

**System Errors**:
| Error | Detection | Response |
|-------|-----------|----------|
| Havok load failure | Try-catch on WASM fetch | Display error message, retry |
| WebGL not supported | Feature detection | Fallback message |
| Low FPS (<30) | Frame time monitoring | Reduce visual quality settings |

---

## 6. Visual Design Specification

### 6.1 Design Language

**Style**: Cyberpunk Glassmorphism
- **Primary**: Transparent glass panels with backdrop blur
- **Accent**: Neon gradients (pink-cyan spectrum)
- **Contrast**: Dark backgrounds with bright text
- **Depth**: Multi-layered UI with z-index hierarchy

### 6.2 Color System

**Brand Colors**:
```css
--primary: #F72585;      /* Hot Pink */
--secondary: #4CC9F0;    /* Cyan */
--accent: #7209B7;       /* Purple */
--success: #00FF88;      /* Green */
--danger: #FF006E;       /* Magenta */
```

**UI Colors**:
```css
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.6);
--text-muted: rgba(255, 255, 255, 0.4);
--overlay-bg: rgba(0, 0, 0, 0.6);
```

**Gradients**:
```css
--gradient-primary: linear-gradient(90deg, #4CC9F0, #F72585);
--gradient-accent: linear-gradient(135deg, #7209B7, #F72585);
--gradient-success: linear-gradient(90deg, #4CC9F0, #4361EE);
--gradient-danger: linear-gradient(90deg, #FF006E, #8338EC);
```

### 6.3 Typography Scale

**Font Stack**: System UI Sans-Serif
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Type Scale**:
- **Display**: 96px, Black (900), -0.04em tracking
- **H1**: 72px, Black (900), -0.02em tracking
- **H2**: 48px, Bold (700), 0em tracking
- **H3**: 32px, Bold (700), 0.1em tracking
- **Body**: 16px, Regular (400), 0em tracking
- **Caption**: 12px, Bold (700), 0.2em tracking

**Text Transforms**:
- Headings: Uppercase
- Body: Normal case
- Captions: Uppercase

### 6.4 Spacing System (8px Grid)

```
4px  → 0.5 unit (tight)
8px  → 1 unit
16px → 2 units
24px → 3 units
32px → 4 units (comfortable)
48px → 6 units
64px → 8 units (spacious)
```

### 6.5 Animation Timing

**Durations**:
- Micro: 150ms (hover)
- Short: 300ms (transitions)
- Medium: 500ms (modals)
- Long: 1000ms (page transitions)

**Easing**:
- Default: `ease-in-out`
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- Smooth: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 7. Technical Specifications

### 7.1 Browser Support

**Target Browsers**:
- Chrome 120+ (Recommended)
- Firefox 120+
- Safari 17+
- Edge 120+

**Required Features**:
- WebGL 2.0
- WebAssembly
- ES2022 JavaScript
- Web Audio API

**Progressive Enhancement**:
- Graceful degradation for older browsers
- Detect WebGL support, show fallback message
- Audio optional (game playable without sound)

### 7.2 Performance Budgets

**Load Performance**:
- Initial JS bundle: <500KB (gzipped)
- Initial CSS: <50KB
- Havok WASM: ~1.5MB (CDN cached)
- Total page weight: <2MB
- Time to Interactive: <3 seconds

**Runtime Performance**:
- Target FPS: 60 FPS
- Physics simulation: 60Hz
- Input latency: <100ms
- Memory usage: <500MB

### 7.3 Dependencies

**Production Dependencies**:
```json
{
  "@babylonjs/core": "^8.38.0",
  "@babylonjs/gui": "^8.38.0",
  "@babylonjs/havok": "^1.3.10",
  "@babylonjs/loaders": "^8.38.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "zustand": "^5.0.9"
}
```

**Development Dependencies**:
```json
{
  "@vitejs/plugin-react": "^5.1.1",
  "autoprefixer": "^10.4.22",
  "eslint": "^9.39.1",
  "postcss": "^8.4.0",
  "tailwindcss": "^4.1.17",
  "vite": "^7.2.4"
}
```

### 7.4 Build Configuration

**Vite Settings**:
- Dev server port: 5173
- Build output: `/dist`
- Asset inlining threshold: 4KB
- Code splitting: Automatic by route
- Source maps: Enabled in dev, disabled in prod

**Environment Variables**:
```
VITE_HAVOK_CDN=https://cdn.babylonjs.com/havok/
VITE_TEXTURE_CDN=https://playground.babylonjs.com/textures/
```

---

## 8. Testing & Quality Assurance

### 8.1 Testing Strategy

**Unit Tests** (Future):
- Odds calculation logic
- Payout calculation
- State management actions

**Integration Tests**:
- Ragdoll creation pipeline
- Physics constraint setup
- Race completion detection

**Manual QA Checklist**:
- [ ] All 8 species render correctly
- [ ] Ragdolls don't explode at race start
- [ ] Winner detection is accurate
- [ ] Payout calculations are correct
- [ ] Game resets properly after 5 rounds
- [ ] No memory leaks over 10+ rounds
- [ ] 60 FPS maintained throughout race
- [ ] Mobile touch controls work
- [ ] Audio plays on all browsers

### 8.2 Physics Validation

**Stability Tests**:
1. **Explosion Test**: Run 100 races, count ragdoll explosions (<5% acceptable)
2. **Finish Test**: All races must have a winner within 2 minutes
3. **Constraint Test**: No joint separations during simulation

**Debug Tools**:
- Velocity monitoring (console warnings if >5 m/s at start)
- Race data export (JSON telemetry)
- Visual debug indicator (red banner when data ready)

### 8.3 Performance Testing

**Metrics**:
- FPS: Monitor via `engine.getFps()`
- Draw calls: Target <100 per frame
- Triangle count: Target <50K visible triangles
- Physics bodies: 8 ragdolls × ~8 parts = 64 bodies

**Benchmarking**:
- Test on low-end hardware (Intel HD Graphics)
- Test on high-end (RTX 3080)
- Mobile devices (iPhone 12, Pixel 6)

---

## 9. Deployment & DevOps

### 9.1 Deployment Targets

**Hosting Options**:
1. **Vercel** (Recommended)
   - Automatic builds from Git
   - Edge network CDN
   - Free tier sufficient

2. **Netlify**
   - Similar features to Vercel
   - Alternative option

3. **GitHub Pages**
   - Static hosting
   - Manual deployment

### 9.2 Build Pipeline

**Development**:
```bash
npm run dev          # Start dev server (port 5173)
npm run lint         # Run ESLint
```

**Production**:
```bash
npm run build        # Build optimized bundle
npm run preview      # Preview production build locally
```

**Deployment**:
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Manual
npm run build && rsync -av dist/ server:/var/www/
```

### 9.3 Monitoring

**Analytics** (Future):
- Google Analytics or Plausible
- Track: Sessions, round completions, average balance
- Events: Bet placed, race finished, game reset

**Error Tracking** (Future):
- Sentry for JavaScript errors
- Monitor physics explosions
- Track WebGL context losses

---

## 10. Future Enhancements (Post-MVP)

### 10.1 Gameplay Features

**Priority 1** (Next Version):
- [ ] **Multiplayer**: Spectate other players' races
- [ ] **Leaderboards**: High score tracking
- [ ] **Achievements**: Unlock rewards for milestones
- [ ] **Variable Bet Amounts**: $50/$100/$200 options

**Priority 2** (Long-term):
- [ ] **Custom Ragdolls**: User-created creatures
- [ ] **Track Editor**: Community-created courses
- [ ] **Power-ups**: Speed boosts, shields during race
- [ ] **Tournaments**: Bracket-style competitions

### 10.2 Technical Improvements

**Performance**:
- [ ] WebGPU support (when widely available)
- [ ] Optimized shadow rendering
- [ ] Level-of-detail (LOD) for distant ragdolls

**Features**:
- [ ] Replay system (save/share races)
- [ ] Slow-motion controls during playback
- [ ] VR support (WebXR)

### 10.3 Content Expansion

**New Species**:
- [ ] Octopus (8 tentacles)
- [ ] Centipede (20+ segments)
- [ ] Blob (soft-body physics)
- [ ] Mech (rigid, mechanical)

**New Obstacles**:
- [ ] Trampolines (high bounce)
- [ ] Conveyor belts (speed zones)
- [ ] Fans (air currents)
- [ ] Portals (teleportation)

### 10.4 Monetization (Optional)

**Cosmetic Purchases**:
- Ragdoll skins/colors
- Track themes (space, underwater, lava)
- Particle effects trails

**Ads**:
- Rewarded video ads (double winnings)
- Banner ads (non-intrusive)

---

## 11. Success Criteria

### 11.1 Launch Metrics (30 Days)

**Engagement**:
- [ ] 10,000+ unique players
- [ ] Average session: 5+ minutes
- [ ] Average rounds per session: 3+

**Technical**:
- [ ] 99%+ uptime
- [ ] <1% crash rate
- [ ] Average FPS: 55+ across devices

**User Feedback**:
- [ ] Net Promoter Score (NPS): >40
- [ ] Positive reviews: >80%
- [ ] Social shares: 500+

### 11.2 Six-Month Goals

**Growth**:
- [ ] 100,000+ total players
- [ ] 40%+ D1 retention
- [ ] 20%+ D7 retention

**Community**:
- [ ] Discord server: 1,000+ members
- [ ] YouTube gameplay videos: 50+
- [ ] Fan-created content (memes, art)

---

## 12. Risks & Mitigations

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Physics explosions** | Medium | High | Velocity clamping, stabilization delays, constraint tuning |
| **Low FPS on mobile** | High | Medium | Reduce visual quality settings, optional low-res mode |
| **Havok WASM load failure** | Low | High | Retry logic, fallback to simpler physics engine |
| **Browser compatibility** | Medium | Medium | Feature detection, graceful degradation, browser warnings |

### 12.2 User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Unfair odds** | Low | High | Balanced odds formula, variance testing |
| **Boring races** | Medium | High | Obstacle variety, random placement, visual effects |
| **Repetitive gameplay** | Medium | Medium | Species variety, round progression, achievements |
| **Confusing UI** | Low | Medium | User testing, tooltips, onboarding tutorial |

### 12.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low adoption** | Medium | High | Marketing campaign, influencer partnerships, viral features |
| **High hosting costs** | Low | Low | Static hosting, CDN caching, serverless architecture |
| **Copyright issues** | Very Low | High | Original assets only, avoid trademarked content |

---

## 13. Appendices

### 13.1 Glossary

- **Ragdoll**: Physics-based character model with articulated joints
- **PBR**: Physically Based Rendering (realistic material shading)
- **6DoF**: 6 Degrees of Freedom (3 translation axes + 3 rotation axes)
- **American Odds**: Betting format (positive = underdog payout, negative = favorite stake)
- **Glassmorphism**: UI design style using frosted glass transparency effects
- **Havok**: Commercial physics engine (WebAssembly version)
- **IBL**: Image-Based Lighting (environment reflections)
- **ACES**: Academy Color Encoding System (tone mapping standard)

### 13.2 References

**Technical Documentation**:
- Babylon.js Docs: https://doc.babylonjs.com/
- Havok Physics: https://www.havok.com/
- React Docs: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/

**Design Inspiration**:
- Glassmorphism: https://hype4.academy/tools/glassmorphism-generator
- Cyberpunk UI: https://www.behance.net/search/projects/cyberpunk%20ui

**Physics References**:
- Ragdoll Physics Tutorial: Babylon.js Playground examples
- Constraint Systems: Havok Physics documentation

### 13.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-09 | Initial PRD creation |

---

## 14. Approval & Sign-off

**Document Status**: Draft v1.0

**Prepared By**: GitHub Copilot (AI Assistant)  
**Date**: December 9, 2025

**Stakeholders**:
- [ ] Product Owner: _____________
- [ ] Lead Developer: _____________
- [ ] UX Designer: _____________
- [ ] QA Lead: _____________

---

*End of Product Requirements Document*
