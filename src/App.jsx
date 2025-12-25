import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Heart, Utensils, Moon, Sun, RotateCcw, Play, Trophy, Zap, Activity, AlertTriangle } from 'lucide-react';

/**
 * PixelCavapoo Component
 * Visualizes the state of the pet including exhaustion and health.
 */
const PixelCavapoo = ({ animation, isDead, stats, isSleeping }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 2);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const colorBody = "#D2B48C";
  const colorEars = "#A0522D";
  const colorFace = "#000000";
  const colorWhite = "#FFFFFF";

  const isExhausted = stats.energy <= 0;
  const isCritical = stats.health < 30 || stats.hunger < 20;

  const jumpY = (animation === 'playing') ? (frame === 0 ? -6 : 0) : 0;
  const breatheY = (animation === 'idle' && frame === 1) ? -1 : 0;
  const finalY = jumpY + breatheY;

  if (isDead) {
    return (
      <svg viewBox="0 0 40 40" className="w-full h-full opacity-40 grayscale">
        <text x="20" y="20" dominantBaseline="middle" textAnchor="middle" fontSize="16">💀</text>
        <rect x="14" y="28" width="12" height="2" fill="#333" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <rect x="12" y="34" width="16" height="2" fill="black" opacity="0.1" />

      <g transform={`translate(0, ${finalY})`}>
        {/* Tail */}
        <rect x={frame === 0 ? 6 : 4} y="22" width="4" height="4" fill={colorBody} />

        {/* Body */}
        <rect x="10" y="20" width="20" height="12" fill={colorBody} />

        {/* Legs */}
        <rect x="12" y="32" width="4" height="4" fill={colorEars} />
        <rect x="24" y="32" width="4" height="4" fill={colorEars} />

        {/* Head */}
        <rect x="14" y="10" width="12" height="12" fill={colorBody} />
        <rect x="10" y="12" width="4" height="10" fill={colorEars} />
        <rect x="26" y="12" width="4" height="10" fill={colorEars} />
        <rect x="16" y="8" width="8" height="2" fill={colorBody} />

        {/* Facial Features */}
        {isSleeping || isExhausted ? (
          <g>
            <rect x="16" y="16" width="2" height="1" fill={colorFace} opacity="0.6" />
            <rect x="22" y="16" width="2" height="1" fill={colorFace} opacity="0.6" />
          </g>
        ) : isCritical ? (
          <g>
            <rect x="15" y="14" width="3" height="1" fill={colorFace} />
            <rect x="22" y="14" width="3" height="1" fill={colorFace} />
            <rect x="19" y="18" width="2" height="1" fill="#f43f5e" />
          </g>
        ) : (
          <g>
            <rect x="16" y="15" width="2" height="2" fill={colorFace} />
            <rect x="22" y="15" width="2" height="2" fill={colorFace} />
            <rect x="19" y="18" width="2" height="1" fill={colorFace} />
          </g>
        )}

        <rect x="18" y="19" width="4" height="2" fill={colorWhite} opacity="0.3" />

        {animation === 'eating' && frame === 1 && (
           <rect x="18" y="24" width="4" height="2" fill="#8B4513" />
        )}
      </g>

      {isExhausted && !isSleeping && !isDead && (
        <text x="32" y="12" fontSize="6" fill="#f43f5e" fontWeight="bold">!</text>
      )}
    </svg>
  );
};

// Initial state for the pet
const initialState = {
  hunger: 80,
  happiness: 80,
  energy: 100,
  health: 100,
  age: 0,
  ticks: 0,
  lastPlayTime: 0,
  lastFeedTime: 0,
  isSleeping: false,
  isDead: false,
  status: 'idle'
};

// Helper to clamp values between 0 and 100
const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, val));

// Reducer handles all state transitions with full access to current state
function petReducer(state, action) {
  if (state.isDead && action.type !== 'RESET') {
    return state;
  }

  switch (action.type) {
    case 'TICK': {
      const { hunger, happiness, energy, health, age, ticks, lastPlayTime, isSleeping } = state;
      const nextTick = ticks + 1;
      const newAge = nextTick % 60 === 0 ? age + 1 : age;

      // Age difficulty multiplier (1.0 to 2.0)
      const ageMult = 1 + (Math.min(age, 10) / 10);

      // Boredom factor: happiness decays faster without interaction
      const ticksSincePlay = nextTick - lastPlayTime;
      const boredomFactor = Math.min(2, 1 + (ticksSincePlay / 120)); // Max 2x after 2 mins

      // === ENERGY ===
      let newEnergy = energy;
      if (isSleeping) {
        // Sleep quality affected by hunger
        const sleepQuality = hunger > 30 ? 1 : 0.5;
        newEnergy += 2.5 * sleepQuality;
      } else {
        // Base drain + hunger affects energy
        let drain = 0.3;
        if (hunger < 40) drain += 0.2; // Low fuel = tired faster
        if (happiness > 70) drain += 0.1; // Happy pets are more active
        newEnergy -= drain;
      }
      newEnergy = clamp(newEnergy);

      // === HUNGER ===
      let hungerDecay = isSleeping ? 0.15 : 0.35;
      // Metabolism effects
      if (energy > 70) hungerDecay += 0.1; // High energy = faster metabolism
      if (energy <= 0) hungerDecay *= 1.3; // Exhaustion burns reserves
      if (happiness > 60 && !isSleeping) hungerDecay += 0.05; // Active happy pet
      const newHunger = clamp(hunger - (hungerDecay * ageMult));

      // === HAPPINESS ===
      let happinessChange = 0;
      // Boredom is the baseline decay
      happinessChange -= 0.2 * boredomFactor;
      // Hunger affects mood
      if (hunger < 20) {
        happinessChange -= 0.4; // Hungry = unhappy
      } else if (hunger > 70) {
        happinessChange += 0.15; // Well-fed = content
      }
      // Energy affects mood
      if (energy <= 0) {
        happinessChange -= 0.4; // Exhausted = miserable
      } else if (energy > 60 && !isSleeping) {
        happinessChange += 0.1; // Energetic = happier
      }
      // Sleeping too long makes pet bored
      if (isSleeping && energy > 80) {
        happinessChange -= 0.15;
      }
      // Poor health makes pet sad
      if (health < 50) {
        happinessChange -= 0.2;
      }
      // Age multiplier on negative changes only
      if (happinessChange < 0) {
        happinessChange *= ageMult;
      }
      const newHappiness = clamp(happiness + happinessChange);

      // === HEALTH ===
      // Overall wellbeing score determines health trajectory
      const wellbeing = (hunger + happiness + energy) / 3;
      let healthChange = 0;

      // Gradual response to care quality
      if (wellbeing > 70) {
        healthChange = 0.15; // Good care
      } else if (wellbeing > 50) {
        healthChange = 0.05; // Adequate
      } else if (wellbeing > 30) {
        healthChange = -0.1; // Poor care
      } else {
        healthChange = -0.3; // Neglect
      }

      // Critical conditions
      if (hunger <= 0) healthChange -= 1.2; // Starving
      if (energy <= 0 && !isSleeping) healthChange -= 0.4; // Exhausted
      if (happiness <= 0) healthChange -= 0.25; // Depressed

      // Thriving bonus
      if (hunger > 85 && happiness > 85 && energy > 70) {
        healthChange += 0.2;
      }

      const newHealth = clamp(health + healthChange);
      const newIsDead = newHealth <= 0;

      return {
        ...state,
        hunger: newHunger,
        happiness: newHappiness,
        energy: newEnergy,
        health: newHealth,
        age: newAge,
        ticks: nextTick,
        isDead: newIsDead,
        status: newIsDead ? 'dead' : state.status
      };
    }

    case 'FEED':
      if (state.isSleeping) return state;
      return {
        ...state,
        hunger: clamp(state.hunger + 25),
        health: clamp(state.health + 2),
        happiness: clamp(state.happiness + 3), // Small mood boost from being fed
        lastFeedTime: state.ticks,
        status: 'eating'
      };

    case 'PLAY':
      if (state.isSleeping || state.energy < 15) return state;
      return {
        ...state,
        happiness: clamp(state.happiness + 20),
        energy: clamp(state.energy - 15),
        hunger: clamp(state.hunger - 5), // Playing burns calories
        lastPlayTime: state.ticks,
        status: 'playing'
      };

    case 'TOGGLE_SLEEP':
      return {
        ...state,
        isSleeping: !state.isSleeping,
        status: !state.isSleeping ? 'sleeping' : 'idle'
      };

    case 'SET_STATUS':
      return { ...state, status: action.status };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

const App = () => {
  const [state, dispatch] = useReducer(petReducer, initialState);
  const { hunger, happiness, energy, health, age, isDead, isSleeping, status } = state;

  const statusTimer = useRef(null);

  // Cleanup status timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  // Core Simulation Loop
  useEffect(() => {
    if (isDead) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDead]);

  const setPetStatus = (newStatus, duration = 2000) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    dispatch({ type: 'SET_STATUS', status: newStatus });
    statusTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_STATUS', status: isSleeping ? 'sleeping' : 'idle' });
    }, duration);
  };

  const handleAction = (type) => {
    if (isDead) {
      if (type === 'reset') {
        dispatch({ type: 'RESET' });
      }
      return;
    }

    if (isSleeping && type !== 'sleep') return;

    switch (type) {
      case 'feed':
        dispatch({ type: 'FEED' });
        setPetStatus('eating');
        break;
      case 'play':
        if (energy < 15) return;
        dispatch({ type: 'PLAY' });
        setPetStatus('playing');
        break;
      case 'sleep':
        dispatch({ type: 'TOGGLE_SLEEP' });
        break;
      case 'reset':
        dispatch({ type: 'RESET' });
        break;
    }
  };

  const getBarColor = (val, crit = 25) => {
    if (val > 50) return 'bg-emerald-400';
    if (val > crit) return 'bg-amber-400';
    return 'bg-rose-500 animate-pulse';
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 font-mono select-none">

      {/* Handheld Body */}
      <div className="relative w-80 h-[600px] bg-indigo-600 rounded-[60px] shadow-2xl border-b-[12px] border-indigo-900 p-8 flex flex-col items-center">

        <div className="flex items-center gap-2 mb-4">
          <Activity size={12} className="text-indigo-300 animate-pulse" />
          <span className="text-indigo-200 text-[10px] font-black tracking-widest uppercase">Cava-OS v2.5</span>
        </div>

        {/* Screen Bezel */}
        <div className="w-full h-[280px] bg-zinc-900 rounded-[32px] p-5 shadow-inner flex flex-col relative overflow-hidden">

          {/* LCD Screen */}
          <div className={`w-full h-full rounded-xl relative overflow-hidden flex flex-col transition-colors duration-1000 ${isSleeping ? 'bg-indigo-950' : 'bg-[#a7c957]'}`}>

            {/* Retro Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]"></div>

            {/* Top UI Overlay */}
            <div className={`p-2 flex justify-between items-start text-[8px] font-bold ${isSleeping ? 'text-indigo-400' : 'text-zinc-900'}`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 bg-black/10 px-1.5 py-0.5 rounded">
                  <Trophy size={8} /> AGE {age}
                </div>
                <div className="flex items-center gap-1 bg-black/10 px-1.5 py-0.5 rounded">
                  <Activity size={8} /> HLT
                  <div className="w-10 h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${getBarColor(health, 30)}`} style={{ width: `${health}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1 justify-end">
                  <span>HGR</span>
                  <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5">
                    <div className={`h-full transition-all duration-500 ${getBarColor(hunger)}`} style={{ width: `${hunger}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span>HAP</span>
                  <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5">
                    <div className={`h-full transition-all duration-500 ${getBarColor(happiness)}`} style={{ width: `${happiness}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span>NRG</span>
                  <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5">
                    <div className={`h-full transition-all duration-500 ${getBarColor(energy, 10)}`} style={{ width: `${energy}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pet Viewport */}
            <div className="flex-1 flex items-center justify-center relative">
              {(hunger < 20 || health < 30 || energy <= 0) && !isDead && !isSleeping && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 animate-bounce">
                  <AlertTriangle size={16} className="text-rose-600" />
                </div>
              )}
              <div className="w-32 h-32">
                <PixelCavapoo animation={status} isDead={isDead} stats={{ hunger, happiness, energy, health }} isSleeping={isSleeping} />
              </div>
            </div>

            {/* Status Ticker */}
            <div className={`text-center pb-2 text-[7px] font-black uppercase tracking-[0.3em] ${isSleeping ? 'text-indigo-500' : 'text-zinc-800/40'}`}>
              {isDead ? "System Offline" : energy <= 0 ? "Exhausted!" : isSleeping ? "Deep Sleep" : "Unit Operational"}
            </div>
          </div>
        </div>

        {/* Tactical Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full relative z-10">
          <button
            onMouseDown={() => handleAction('feed')}
            disabled={isDead || isSleeping}
            className="flex flex-col items-center justify-center p-3 bg-rose-500 rounded-2xl border-b-8 border-rose-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-20 shadow-xl"
          >
            <Utensils className="text-white" size={24} />
            <span className="text-[9px] text-white mt-1 font-black">FEED</span>
          </button>

          <button
            onMouseDown={() => handleAction('play')}
            disabled={isDead || isSleeping || energy < 15}
            className="flex flex-col items-center justify-center p-3 bg-emerald-500 rounded-2xl border-b-8 border-emerald-800 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-20 shadow-xl"
          >
            <Play className="text-white" size={24} />
            <span className="text-[9px] text-white mt-1 font-black">PLAY</span>
          </button>

          <button
            onMouseDown={() => handleAction('sleep')}
            disabled={isDead}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all shadow-xl ${isSleeping ? 'bg-amber-400 border-amber-600' : 'bg-blue-500 border-blue-800'}`}
          >
            {isSleeping ? <Sun className="text-white" size={24} /> : <Moon className="text-white" size={24} />}
            <span className="text-[9px] text-white mt-1 font-black">{isSleeping ? 'WAKE' : 'SLEEP'}</span>
          </button>

          <button
            onMouseDown={() => handleAction('reset')}
            className="flex flex-col items-center justify-center p-3 bg-zinc-500 rounded-2xl border-b-8 border-zinc-700 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
          >
            <RotateCcw className="text-white" size={24} />
            <span className="text-[9px] text-white mt-1 font-black">{isDead ? 'REVIVE' : 'RESET'}</span>
          </button>
        </div>

        {/* Aesthetics */}
        <div className="mt-8 flex gap-2 opacity-20">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-indigo-900 rounded-full"></div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-1">
        <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Care Guide</div>
        <p className="text-zinc-400 text-[9px] max-w-[280px] text-center leading-relaxed">
          Stats are interconnected: Hunger affects Energy, Energy affects Happiness, and overall wellbeing determines Health.
          Play regularly to prevent boredom. Don't over-sleep - your pet wants activity! Keep all stats balanced for a thriving pet.
        </p>
      </div>
    </div>
  );
};

export default App;
