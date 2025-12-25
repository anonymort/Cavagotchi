import React, { useState, useEffect, useRef } from 'react';
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

const App = () => {
  const [hunger, setHunger] = useState(80);
  const [happiness, setHappiness] = useState(80);
  const [energy, setEnergy] = useState(100);
  const [health, setHealth] = useState(100);
  const [age, setAge] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [status, setStatus] = useState('idle');
  const [ticks, setTicks] = useState(0);

  const statusTimer = useRef(null);

  // Use refs to track current values for cross-state calculations
  const statsRef = useRef({ hunger, happiness, energy, health, age });
  const sleepingRef = useRef(isSleeping);

  // Keep refs in sync with state
  useEffect(() => {
    statsRef.current = { hunger, happiness, energy, health, age };
  }, [hunger, happiness, energy, health, age]);

  useEffect(() => {
    sleepingRef.current = isSleeping;
  }, [isSleeping]);

  // Cleanup status timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  // Core Simulation Loop - only depends on isDead
  useEffect(() => {
    if (isDead) return;

    const interval = setInterval(() => {
      const sleeping = sleepingRef.current;
      const stats = statsRef.current;

      setTicks(t => {
        const next = t + 1;
        if (next % 60 === 0) setAge(a => a + 1);
        return next;
      });

      // Difficulty Multiplier based on Age (min 1, max 2)
      const ageMult = 1 + (Math.min(stats.age, 10) / 10);

      setEnergy(e => {
        if (sleeping) return Math.min(100, e + 3);
        return Math.max(0, e - 0.25);
      });

      setHunger(h => {
        let decay = sleeping ? 0.1 : 0.4;
        if (stats.energy <= 0) decay *= 1.5; // Exhaustion burns hunger faster
        return Math.max(0, h - (decay * ageMult));
      });

      setHappiness(hap => {
        let decay = 0.3;
        if (stats.hunger < 20) decay += 0.5;
        if (stats.energy <= 0) decay += 0.5;
        return Math.max(0, hap - (decay * ageMult));
      });

      setHealth(hlt => {
        let change = 0;
        // Natural recovery if very happy and full
        if (stats.hunger > 80 && stats.happiness > 80 && stats.energy > 50) change = 0.2;

        // Damage conditions
        if (stats.hunger <= 0) change -= 1.5;
        if (stats.energy <= 0 && !sleeping) change -= 0.5;
        if (stats.happiness <= 0) change -= 0.3;

        return Math.min(100, Math.max(0, hlt + change));
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isDead]);

  // Death Logic
  useEffect(() => {
    if (health <= 0) {
      setIsDead(true);
      setStatus('dead');
    }
  }, [health]);

  const setPetStatus = (newStatus, duration = 2000) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatus(newStatus);
    statusTimer.current = setTimeout(() => {
      setStatus(sleepingRef.current ? 'sleeping' : 'idle');
    }, duration);
  };

  const handleAction = (type) => {
    if (isDead) {
      if (type === 'reset') {
        setHunger(80); setHappiness(80); setEnergy(100); setHealth(100); setAge(0);
        setIsDead(false); setIsSleeping(false); setStatus('idle'); setTicks(0);
      }
      return;
    }

    if (isSleeping && type !== 'sleep') return;

    switch (type) {
      case 'feed':
        setHunger(h => Math.min(100, h + 25));
        setHealth(h => Math.min(100, h + 2)); // Feeding slightly helps health
        setPetStatus('eating');
        break;
      case 'play':
        // Use ref for current energy value
        if (statsRef.current.energy < 15) {
          setPetStatus('idle'); // Too tired to play
          return;
        }
        setHappiness(h => Math.min(100, h + 20));
        setEnergy(e => Math.max(0, e - 15));
        setPetStatus('playing');
        break;
      case 'sleep':
        setIsSleeping(!isSleeping);
        setStatus(!isSleeping ? 'sleeping' : 'idle');
        break;
      case 'reset':
        setHunger(80); setHappiness(80); setEnergy(100); setHealth(100); setAge(0);
        setIsDead(false); setIsSleeping(false); setStatus('idle'); setTicks(0);
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
          Zero Energy (NRG) causes exhaustion, doubling Hunger and Happiness decay.
          If Hunger hits zero, Health (HLT) starts to drain. Restore Health by keeping all stats above 80%.
        </p>
      </div>
    </div>
  );
};

export default App;
