import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Shield, Salad, Droplet, Terminal, Zap, Wind, Activity, Car, Plane, Sliders } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const postNUI = async (action: string, data: any = {}) => {
  try {
    await fetch(`https://${(window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'njoy-hud-ecg'}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Ignore fetch errors in browser
  }
};

const isBrowser = !(window as any).GetParentResourceName;

const MiniSkewedBar: React.FC<{ value: number, color: string }> = ({ value, color }) => {
  return (
    <div className="relative w-[34px] h-[7px] bg-black/55 border border-white/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.5)]" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%)' }}>
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 5px ${color}80`,
        }}
      />
    </div>
  );
};

const RPGNeedIcon = ({ value, color, icon, threshold, mode, showAlways = false }: { value: number, color: string, icon: React.ReactNode, threshold: number, mode: 'always' | 'dynamic', showAlways?: boolean }) => {
  if (!showAlways && value > threshold) return null;

  return (
    <div className="relative w-[28px] h-[28px] flex items-center justify-center shrink-0">
      {/* Background Diamond */}
      <div
        className="absolute inset-0 bg-black/60 border border-white/20 rotate-45 shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300"
        style={{
          borderColor: value <= 20 ? '#ef4444' : 'rgba(255,255,255,0.2)',
          boxShadow: value <= 20 ? '0 0 6px rgba(239,68,68,0.5)' : 'none'
        }}
      />
      {/* Dynamic Fill level using linear gradient on a rotated background */}
      <div
        className="absolute inset-[1.5px] rotate-45 overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        }}
      >
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{
            background: `linear-gradient(to top, ${color} 0%, ${color} ${value}%, transparent ${value}%, transparent 100%)`
          }}
        />
      </div>
      {/* Icon (Unrotated) */}
      <div className="relative z-10 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] scale-90 select-none pointer-events-none">
        {icon}
      </div>
    </div>
  );
};

interface SquircleHUDProps {
  id: string;
  icon: LucideIcon;
  color: string;
  value: number;
  threshold?: number;
  isAnimated?: boolean;
  iconColor?: string;
  forceHide?: boolean;
}

const SquircleHUD: React.FC<SquircleHUDProps> = ({ id, icon: Icon, color, value, threshold = 100, isAnimated = false, iconColor = "white", forceHide = false }) => {
  const isVisible = !forceHide && (value <= threshold);
  const liquidTranslateY = value <= 0 ? 70 : 45 - (value * 0.6);

  // Ghost reduction tracking
  const [prevValue, setPrevValue] = useState(value);
  const [ghostValue, setGhostValue] = useState(value);
  const [ghostOpacity, setGhostOpacity] = useState(0);

  useEffect(() => {
    if (value < prevValue) {
      // Value decreased!
      setGhostValue(prevValue);
      setGhostOpacity(0.85);

      const timer = setTimeout(() => {
        setGhostValue(value);
        setGhostOpacity(0);
      }, 300);

      setPrevValue(value);
      return () => clearTimeout(timer);
    } else {
      setPrevValue(value);
      setGhostValue(value);
      setGhostOpacity(0);
    }
  }, [value, prevValue]);

  const ghostTranslateY = ghostValue <= 0 ? 70 : 45 - (ghostValue * 0.6);

  return (
    <div
      className={`squircle-item ${!isAnimated ? 'static-waves' : ''} ${!isVisible ? 'hidden-item' : ''}`}
      id={id}
      style={{
        '--accent-color': color,
      } as React.CSSProperties}
    >
      <div className="halo-border"></div>

      <div className="content-box">
        <div className="squircle-bg"></div>
        <div className="tinted-bg"></div>

        {/* Ghost Liquid Wrapper (displays when value decreases) */}
        {ghostOpacity > 0 && (
          <div
            className="liquid-wrapper-ghost"
            style={{
              transform: `translateY(${ghostTranslateY}%)`,
              opacity: ghostOpacity,
              transition: 'transform 1.8s cubic-bezier(0.23, 1, 0.32, 1), opacity 1.5s ease-out'
            }}
          >
            <div className="wave-ghost"></div>
          </div>
        )}

        <div
          className="liquid-wrapper"
          style={{ transform: `translateY(${liquidTranslateY}%)` }}
        >
          <div className="wave wave-back"></div>
          <div className="wave wave-mid"></div>
          <div className="wave wave-front"></div>
        </div>

        <div className="squircle-overlay"></div>
        <div className="full-glow"></div>

        <div className="icon-wrapper">
          <Icon size={20} color={iconColor} strokeWidth={2.5} />
        </div>

        {id === 'health' && value < 20 && isAnimated && (
          <div
            className="critical-pulse"
            style={{ background: `color-mix(in srgb, ${color}, transparent 70%)` }}
          ></div>
        )}
      </div>
    </div>
  );
};




const MovingCompassTape = ({ headingAngle, street, zone, waypointAngle }: { headingAngle: number, street: string, zone: string, waypointAngle?: number | null }) => {
  const degreeWidth = 2.4; // pixels per degree

  // Manage cumulative heading to prevent jumps in CSS transitions when wrapping
  const [prevAngle, setPrevAngle] = useState(headingAngle);
  const [cumulativeHeading, setCumulativeHeading] = useState(headingAngle);

  useEffect(() => {
    let diff = headingAngle - prevAngle;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    setCumulativeHeading(prev => prev + diff);
    setPrevAngle(headingAngle);
  }, [headingAngle, prevAngle]);

  const tapeHeading = cumulativeHeading;
  const offset = -(tapeHeading * degreeWidth);

  const markerPoints = [
    { label: 'N', deg: 0 },
    { label: 'NE', deg: 45 },
    { label: 'E', deg: 90 },
    { label: 'SE', deg: 135 },
    { label: 'S', deg: 180 },
    { label: 'SW', deg: 225 },
    { label: 'W', deg: 270 },
    { label: 'NW', deg: 315 },
  ];

  // Dynamic center heading letter/number text calculation
  const getCenterHeading = (angle: number) => {
    const normAngle = (angle % 360 + 360) % 360;
    for (const dir of markerPoints) {
      let diff = Math.abs(normAngle - dir.deg);
      if (dir.label === 'N') {
        diff = Math.min(diff, Math.abs(normAngle - 360));
      }
      if (diff <= 8) {
        return dir.label;
      }
    }
    return Math.round(normAngle).toString();
  };

  const centerHeading = getCenterHeading(headingAngle);

  // Generate ticks at intervals of 5 degrees
  const tickPoints: { deg: number; type: 'major' | 'medium' | 'minor'; label?: string }[] = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const isMajor = deg % 45 === 0;
    const isMedium = deg % 15 === 0 && !isMajor;
    const type = isMajor ? 'major' : isMedium ? 'medium' : 'minor';

    let label = undefined;
    if (isMajor) {
      const match = markerPoints.find(p => p.deg === deg);
      if (match) label = match.label;
    }

    tickPoints.push({ deg, type, label });
  }

  const fadeMask = {
    maskImage: 'linear-gradient(to right, transparent, rgba(255,255,255,1) 5%, rgba(255,255,255,1) 95%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(255,255,255,1) 5%, rgba(255,255,255,1) 95%, transparent)'
  };

  // Calculate waypoint relative offset
  let relativeAngle = 0;
  let showWaypoint = false;
  if (waypointAngle !== undefined && waypointAngle !== null) {
    const tapeWaypoint = (360 - waypointAngle) % 360;
    // Calculate relative to the normalized heading
    const normalizedHeading = (cumulativeHeading % 360 + 360) % 360;
    relativeAngle = tapeWaypoint - (360 - normalizedHeading) % 360;
    while (relativeAngle < -180) relativeAngle += 360;
    while (relativeAngle > 180) relativeAngle -= 360;
    showWaypoint = true;
  }

  // Dynamic loops centered around current position
  const currentLoop = Math.floor(cumulativeHeading / 360);
  const loops = [currentLoop - 1, currentLoop, currentLoop + 1, currentLoop + 2];

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[800px] flex flex-col items-center select-none pointer-events-none compass-bg-shadow py-2"
      style={fadeMask}
    >
      {/* Tape container */}
      <div
        className="relative w-full h-[55px] overflow-hidden flex items-end"
      >
        {/* Tape offset container */}
        <div
          className="absolute flex items-end h-full transition-transform duration-100 ease-out pb-[15px] w-full"
          style={{
            transform: `translateX(calc(400px + ${offset}px))`,
          }}
        >
          {loops.map((loop) => (
            <div
              key={loop}
              className="absolute bottom-0 flex items-end h-full"
              style={{
                left: `${loop * 360 * degreeWidth}px`,
                width: `${360 * degreeWidth}px`,
                flexShrink: 0
              }}
            >
              {tickPoints.map((tick) => {
                const leftPos = tick.deg * degreeWidth;
                const absoluteLeft = 400 + offset + loop * 360 * degreeWidth + leftPos;

                // Hide ticks passing directly behind the center heading numbers
                if (absoluteLeft >= 374 && absoluteLeft <= 426) {
                  return null;
                }

                if (tick.type === 'major') {
                  return (
                    <div
                      key={`${loop}-${tick.deg}`}
                      className="absolute flex flex-col items-center -translate-x-1/2 bottom-[15px]"
                      style={{ left: `${leftPos}px` }}
                    >
                      <span
                        className="text-[13px] font-bold text-white tracking-wide select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] mb-[3px]"
                        style={{ fontFamily: 'Quantico, sans-serif' }}
                      >
                        {tick.label}
                      </span>
                      <div className="w-[1.5px] h-[8px] bg-white/70 shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]" />
                    </div>
                  );
                } else if (tick.type === 'medium') {
                  return (
                    <div
                      key={`${loop}-${tick.deg}`}
                      className="absolute -translate-x-1/2 bottom-[15px]"
                      style={{ left: `${leftPos}px` }}
                    >
                      <div className="w-[1px] h-[6px] bg-white/50" />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`${loop}-${tick.deg}`}
                      className="absolute -translate-x-1/2 bottom-[15px]"
                      style={{ left: `${leftPos}px` }}
                    >
                      <div className="w-[1px] h-[3.5px] bg-white/30" />
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>

        {/* Waypoint Marker on the Tape (Only in normal mode) */}
        {showWaypoint && (
          <div
            className="absolute bottom-[15px] -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
            style={{
              left: `calc(50% + ${relativeAngle * degreeWidth}px)`,
              transition: 'left 100ms ease-out'
            }}
          >
            <div className="w-2.5 h-2.5 bg-red-600 rotate-45 border border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.95)]" />
          </div>
        )}
      </div>

      {/* Static Dipped Baseline & Center Text */}
      <div className="relative w-full h-[20px] -mt-[15px] z-10">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 20" fill="none">
          <defs>
            <linearGradient id="baselineGrad" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="0.08" stopColor="rgba(255, 255, 255, 0.6)" />
              <stop offset="0.5" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="0.92" stopColor="rgba(255, 255, 255, 0.6)" />
              <stop offset="1" stopColor="rgba(255, 255, 255, 0.2)" />
            </linearGradient>
            <linearGradient id="slopeGrad" x1="0" y1="5" x2="0" y2="17" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
            </linearGradient>
          </defs>
          {/* Horizontal lines */}
          <path
            d="M 0 5 L 363 5 M 437 5 L 800 5"
            stroke="url(#baselineGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Sloping lines that fade downward */}
          <path
            d="M 363 5 L 375 17 M 437 5 L 425 17"
            stroke="url(#slopeGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Heading Indicator */}
        <div
          className="absolute -top-[5px] left-1/2 -translate-x-1/2 z-20 text-[20px] font-normal tracking-wide leading-none"
          style={{
            color: '#ebdfddff',
            fontFamily: 'Archivo, sans-serif',
            textShadow: '0 0 5px rgba(245, 225, 224, 0.4), 0 1.5px 3px rgba(0, 0, 0, 0.95)'
          }}
        >
          {centerHeading}
        </div>
      </div>

      {/* Street & Zone info (Split Left and Right) */}
      <div className="w-full flex select-none -mt-2" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Left Column (Street): Anchored right before the dip, expands to the left */}
        <div className="flex-1 flex justify-end" style={{ paddingRight: '54px' }}>
          <span
            className="text-[13px] font-medium uppercase drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] tracking-widest whitespace-nowrap"
            style={{
              color: '#ebdfddff',
              fontFamily: 'Archivo, sans-serif',
              textShadow: '0 0 5px rgba(245, 225, 224, 0.4), 0 1.5px 3px rgba(0, 0, 0, 0.45)'
            }}
          >
            {street}
          </span>
        </div>
        {/* Right Column (Zone): Anchored right after the dip, expands to the right */}
        <div className="flex-1 flex justify-start" style={{ paddingLeft: '54px' }}>
          <span
            className="text-[13px] font-medium uppercase drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] tracking-widest whitespace-nowrap"
            style={{
              color: '#ebdfddff',
              fontFamily: 'Archivo, sans-serif',
              textShadow: '0 0 5px rgba(245, 225, 224, 0.4), 0 1.5px 3px rgba(0, 0, 0, 0.45)'
            }}
          >
            {zone}
          </span>
        </div>
      </div>
    </div>
  );
};

const HealthHUD = ({ health, isGlowEnabled, hasTwoBars }: { health: number, isGlowEnabled?: boolean, hasTwoBars?: boolean }) => {
  let color = '#97da37'; // green-400
  if (health <= 30) {
    color = '#da3737ff'; // red-400
  } else if (health <= 60) {
    color = '#dabc37ff'; // yellow-400
  } else if (health > 100) {
    color = '#facc15'; // yellow color for extra health
  }

  const clipPathStyle = hasTwoBars
    ? 'polygon(0 0, 100% 0, 100% 100%, 14px 100%)'
    : 'none';

  return (
    <div className="relative w-[360px] h-[11px] bg-black/55 border border-white/[0.05] shadow-[0_1.5px_3px_rgba(0,0,0,0.55)]" style={{ clipPath: clipPathStyle }}>
      {/* Main Health Bar */}
      <motion.div
        className="absolute inset-y-0 left-0"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, health)}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        style={{
          backgroundColor: health > 100 ? '#97da37' : color,
          boxShadow: isGlowEnabled && health <= 100 ? `0 0 8px ${color}` : 'none',
        }}
      />
      {/* Extra Health Yellow Bar on Top */}
      {health > 100 && (
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, health - 100)}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          style={{
            backgroundColor: '#facc15',
            boxShadow: isGlowEnabled ? `0 0 8px #facc15` : 'none',
          }}
        />
      )}
      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none z-10">
        <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" style={{ fontFamily: 'Archivo, sans-serif' }}>
          {health} HP
        </span>
      </div>
    </div>
  );
};

const LowHealthVignette = ({ health }: { health: number }) => {
  if (health > 30) return null;

  const intensity = (30 - health) / 30; // 0 to 1

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] animate-vignette"
      style={{
        boxShadow: `inset 0 0 ${100 + intensity * 150}px rgba(225, 29, 72, ${0.1 + intensity * 0.4})`,
        border: `${intensity * 10}px solid rgba(225, 29, 72, ${intensity * 0.2})`
      }}
    />
  );
};


const INITIAL_SETTINGS = {
  healthThreshold: 100,
  armorThreshold: 100,
  hungerThreshold: 80,
  waterThreshold: 80,
  staminaThreshold: 99,
  oxygenThreshold: 99,
  healthGlow: true,
  rpmStyle: 'circular' as 'circular' | 'linear',
  armorMode: 'dynamic' as 'always' | 'dynamic',
  staminaMode: 'dynamic' as 'always' | 'dynamic',
  oxygenMode: 'dynamic' as 'always' | 'dynamic',
  navigationStyle: 'style2' as 'style1' | 'style2',
  speedometerFps: 45,
  compassFps: 20,
};

const ArmorHUD = ({ armor, hasTwoBars }: { armor: number, hasTwoBars?: boolean }) => {
  if (armor <= 0) return null;
  const color = '#3faed8';

  const clipPathStyle = hasTwoBars
    ? 'polygon(14px 0, 100% 0, 100% 100%, 0 100%)'
    : 'none';

  return (
    <div className="relative w-[360px] h-[11px] bg-black/55 border border-white/[0.05] shadow-[0_1.5px_3px_rgba(0,0,0,0.55)]" style={{ clipPath: clipPathStyle }}>
      <motion.div
        className="absolute inset-y-0 left-0"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, armor)}%` }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}bf`,
        }}
      />
      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none z-10">
        <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" style={{ fontFamily: 'Archivo, sans-serif' }}>
          {armor} AP
        </span>
      </div>
    </div>
  );
};



const MicIndicator = ({ active, talking, isRadio, level, isHeliHudActive }: { active: boolean, talking: boolean, isRadio: boolean, level: number, isHeliHudActive?: boolean }) => {
  const voiceRange = level === 1 ? 'whisper' : level === 3 ? 'shout' : 'normal';

  // Determine the active color based on state
  const getActiveStateConfig = () => {
    if (!active) return { color: 'rgba(255, 255, 255, 0.3)', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.4)' };

    if (isRadio) return { color: 'rgba(56, 189, 248, 0.6)', bg: 'rgba(56, 189, 248, 0.4)', border: 'rgba(56, 189, 248, 0.8)' }; // Light Blue

    switch (voiceRange) {
      case 'whisper': return { color: 'rgba(250, 204, 21, 0.6)', bg: 'rgba(250, 204, 21, 0.4)', border: 'rgba(250, 204, 21, 0.8)' }; // Yellow
      case 'shout': return { color: 'rgba(248, 113, 113, 0.6)', bg: 'rgba(248, 113, 113, 0.4)', border: 'rgba(248, 113, 113, 0.8)' }; // Red
      case 'normal':
      default: return { color: 'rgba(74, 222, 128, 0.6)', bg: 'rgba(74, 222, 128, 0.4)', border: 'rgba(74, 222, 128, 0.8)' }; // Green
    }
  };

  const getVoiceSize = () => {
    switch (voiceRange) {
      case 'whisper': return '2rem';
      case 'normal': return '3.2rem';
      case 'shout': return '4.5rem';
      default: return '3.2rem';
    }
  };

  const config = getActiveStateConfig();
  const currentSize = getVoiceSize();

  // Blob animation variants for the "slime" effect
  const blobVariants = {
    idle: {
      borderRadius: '50%',
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    talking: {
      borderRadius: [
        '50% 50% 50% 50% / 50% 50% 50% 50%',
        '38% 62% 63% 37% / 41% 44% 56% 59%',
        '64% 36% 50% 50% / 37% 55% 45% 63%',
        '42% 58% 30% 70% / 60% 33% 67% 40%',
        '55% 45% 62% 38% / 45% 58% 42% 55%',
        '50% 50% 50% 50% / 50% 50% 50% 50%'
      ],
      scale: [1, 1.06, 0.95, 1.08, 0.94, 1],
      x: 0,
      y: 0,
      rotate: [0, 10, -8, 12, -10, 0],
      transition: {
        duration: 1.6, // slightly faster and more responsive wobble
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className={`absolute transition-all duration-500 flex items-center justify-center z-10 min-w-[5.5rem] min-h-[5.5rem] ${isHeliHudActive ? 'bottom-8 right-12' : 'bottom-8 right-8'}`}>
      <motion.div
        className="relative z-10 backdrop-blur-sm border-[2.5px] will-change-transform"
        animate={talking ? "talking" : "idle"}
        variants={blobVariants}
        initial="idle"
        style={{
          width: currentSize,
          height: currentSize,
          backgroundColor: config.bg,
          borderColor: config.border,
          boxShadow: active ? `0 0 25px ${config.color}, inset 0 0 15px ${config.color}` : '0 0 10px rgba(0,0,0,0.5)',
          transition: 'width 0.3s ease-out, height 0.3s ease-out, background-color 0.2s, border-color 0.2s, box-shadow 0.2s'
        }}
      />
    </div>
  );
};

const BulletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/70 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
    <path d="M4 9C4 7 5.5 5 5.5 5S7 7 7 9V19C7 19.6 6.6 20 6 20H5C4.4 20 4 19.6 4 19V9Z" />
    <path d="M10 9C10 7 11.5 5 11.5 5S13 7 13 9V19C13 19.6 12.6 20 12 20H11C10.4 20 10 19.6 10 19V9Z" />
    <path d="M16 9C16 7 17.5 5 17.5 5S19 7 19 9V19C19 19.6 18.4 20 17.8 20H16.8C16.2 20 15.8 19.6 15.8 19V9Z" />
  </svg>
);

const WeaponHUD = ({ visible, clip, ammo, hasClip }: { visible: boolean; clip: number; ammo: number; hasClip: boolean }) => {
  if (!visible) return null;

  return (
    <div className="flex items-end gap-2 select-none pointer-events-none font-monda loku-perspective-right pb-8">
      <div className="flex items-center justify-center">
        <BulletIcon />
      </div>
      <div className="flex flex-col items-start leading-[0.8]">
        {hasClip ? (
          <>
            <span
              className="text-[32px] font-black tracking-normal"
              style={{
                color: '#8be87d',
                textShadow: '0 0 10px rgba(139, 232, 125, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8)',
                fontFamily: 'Quantico, sans-serif'
              }}
            >
              {clip}
            </span>
            <span
              className="text-[18px] font-bold text-white/95 mt-[2.5px]"
              style={{
                textShadow: '0 1.5px 2px rgba(0, 0, 0, 0.9)',
                fontFamily: 'Quantico, sans-serif'
              }}
            >
              {ammo}
            </span>
          </>
        ) : (
          <span
            className="text-[28px] font-black text-white/95"
            style={{
              textShadow: '0 1.5px 2px rgba(0, 0, 0, 0.9)',
              fontFamily: 'Quantico, sans-serif'
            }}
          >
            {ammo}
          </span>
        )}
      </div>
    </div>
  );
};

// SystemMonitor component removed as requested


const VerticalTape = ({ value, label, range = 40, step = 10, side = 'left' }: { value: number, label: string, range?: number, step?: number, side?: 'left' | 'right' }) => {
  const points = [];
  const minorStep = step / 5;
  const start = Math.floor((value - range) / step) * step;
  const end = Math.ceil((value + range) / step) * step;

  for (let i = start; i <= end; i += minorStep) {
    points.push(i);
  }

  const height = 210; // Balanced height

  return (
    <div className="relative flex flex-col items-center">
      {/* Label outside at the top */}
      <span className="text-[9px] font-black tracking-widest text-white/40 mb-1 pointer-events-none uppercase">{label}</span>

      {/* Tape Container */}
      <div className="relative w-16 h-[210px] bg-black/70 rounded border border-white/5 overflow-hidden flex flex-col items-center">
        {/* Scale */}
        <div className="absolute w-full h-full">
          {points.map((p) => {
            const isMajor = p % step === 0;
            const relativePos = (value - p);
            const opacity = Math.max(0, 1 - Math.abs(relativePos) / (range * 0.8));

            if (opacity <= 0) return null;

            return (
              <motion.div
                key={p}
                className={`absolute w-full flex items-center ${side === 'left' ? 'justify-end pr-1' : 'justify-start pl-1'}`}
                style={{
                  top: `calc(50% + ${relativePos * (height / (range * 2))}px)`,
                  opacity: opacity
                }}
                animate={{
                  top: `calc(50% + ${relativePos * (height / (range * 2))}px)`,
                  opacity: opacity
                }}
                transition={{ duration: 0.1, ease: "linear" }}
              >
                {isMajor && side === 'left' && (
                  <span className="text-[12px] font-bold text-white/90 mr-2 tabular-nums">
                    {Math.round(p)}
                  </span>
                )}
                <div
                  className={`bg-white/60 ${isMajor ? 'w-4 h-[1.5px]' : 'w-2 h-[1px] opacity-40'}`}
                />
                {isMajor && side === 'right' && (
                  <span className="text-[12px] font-bold text-white/90 ml-2 tabular-nums">
                    {Math.round(p)}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Active Indicator (Box & Line) */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none h-8 flex items-center ${side === 'right' ? 'flex-row-reverse' : ''}`}>
          {/* Active Value Box */}
          <div className={`w-8 h-7 bg-black/90 border border-[#00b7e5]/30 flex items-center justify-center shadow-lg ${side === 'left' ? 'ml-0.5' : 'mr-0.5'}`}>
            <span className="text-sm font-bold text-[#00b7e5] tabular-nums">
              {Math.round(value)}
            </span>
          </div>

          {/* Horizontal Indicator Line */}
          <div className="flex-1 h-[1px] bg-[#00b7e5]/40 shadow-[0_0_8px_rgba(0,63,255,0.4)]"></div>

          {/* Small Tick on the far opposite side */}
          <div className="w-1 h-3 bg-[#00b7e5]/30"></div>
        </div>

        {/* Subtle Vertical Line for ticks Alignment */}
        <div className={`absolute top-0 bottom-0 w-[1px] bg-white/10 ${side === 'left' ? 'right-0' : 'left-0'}`}></div>
      </div>
    </div>
  );
};

const AttitudeIndicator = ({ pitch, roll }: { pitch: number, roll: number }) => {
  return (
    <div className="relative w-52 h-52 rounded-full border-2 border-white/10 bg-black/70 overflow-hidden shadow-2xl backdrop-blur-[2px]">
      {/* Sky/Ground Sphere */}
      <motion.div
        className="absolute inset-[-150%] transition-transform"
        animate={{
          rotate: roll,
          y: pitch * 1.8 // Adjusted scale for balanced movement
        }}
        transition={{ duration: 0.1, ease: "linear" }}
      >
        {/* Sky */}
        <div className="absolute top-0 w-full h-1/2 bg-[#00b7e5]/20 border-b border-white/20"></div>
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-1/2 bg-black/30"></div>

        {/* Optimized Pitch Lines for Minimal size */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8 w-full">
          {[-30, -20, -10, 0, 10, 20, 30].map(p => (
            <div key={p} className="flex items-center gap-2">
              {p !== 0 && <span className="text-[9px] font-bold text-white/40">{Math.abs(p)}</span>}
              <div className={`h-[1px] bg-white/40 ${p === 0 ? 'w-32 shadow-[0_0_4px_white]' : 'w-16 opacity-30'}`}></div>
              {p !== 0 && <span className="text-[9px] font-bold text-white/40">{Math.abs(p)}</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fixed Reference Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">


        {/* Roll Gradient Arc */}
        <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="2 10"
          />
        </svg>
      </div>

      {/* Chevron Pointer */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
        animate={{ rotate: roll }}
      >
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-[#00b7e5]/70 drop-shadow-[0_0_6px_rgba(0,63,53,0.8)]"></div>
      </motion.div>
    </div>
  );
};

const HelicopterHUD = ({ data }: { data: any }) => {
  return (
    <div className="flex items-center gap-6 p-4">
      {/* Airspeed */}
      <VerticalTape value={data.speed} label="AIRSPEED" />

      {/* Attitude Indicator */}
      <div className="flex flex-col items-center gap-1">
        <AttitudeIndicator pitch={data.pitch || 0} roll={data.roll || 0} />
        <div className="flex gap-6 mt-1 scale-90">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-white/30 uppercase">GEAR</span>
            <span className={`text-[10px] font-black ${data.gear ? 'text-[#00b7e5]' : 'text-rose-500'}`}>
              {data.gear ? 'DOWN' : 'UP'}
            </span>
          </div>

          <div className="flex flex-col items-center -mt-2">
            <div className="bg-black/70 px-3 py-0.5 rounded-t border-x border-t border-white/5">
              <span className="text-[9px] font-black tracking-widest text-white/30 uppercase pointer-events-none">AGL</span>
            </div>
            <div className="bg-black/70 px-3 py-1 rounded-b border border-white/5 min-w-[48px] flex justify-center shadow-lg">
              <span className="text-base font-bold text-[#00b7e5] drop-shadow-[0_0_6px_rgba(0,102,255,0.5)] tabular-nums pointer-events-none">
                {Math.round(data.agl || 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-white/30 uppercase">ENG</span>
            <span className={`text-[10px] font-black ${data.engine > 20 ? 'text-[#00b7e5]' : 'text-rose-500'}`}>
              {data.engine > 20 ? 'NORM' : 'FAIL'}
            </span>
          </div>
        </div>
      </div>

      {/* Altitude */}
      <div className="flex items-end">
        <VerticalTape value={data.altitude} label="ALT" range={150} step={50} side="right" />
      </div>
    </div>
  );
};

const VehicleHUD = ({
  speed,
  rpm,
  gear,
  fuel,
  engine,
  seatbelt,
  style = 'circular',
  indicators = { leftTurn: false, rightTurn: false, hazards: false, lowBeam: false, highBeam: false, handbrake: false }
}: {
  speed: number,
  rpm: number,
  gear: number | string,
  fuel: number,
  engine: number,
  seatbelt: boolean,
  style?: 'circular' | 'linear',
  indicators?: { leftTurn: boolean, rightTurn: boolean, hazards: boolean, lowBeam: boolean, highBeam: boolean, handbrake: boolean }
}) => {
  const activeGear = gear === 'R' ? 'R' : (gear === 'N' || speed === 0) ? 'N' : String(gear);
  const isLowFuel = fuel < 20;
  const isLowEngine = engine < 400; // FiveM engine health is 0-1000

  const getStatusColor = (pct: number): React.CSSProperties => {
    if (pct <= 15) return { color: '#f43f5e', filter: 'drop-shadow(0 0 5px rgba(244,63,94,0.7))' };
    if (pct <= 50) return { color: '#fbbf24' };
    return { color: 'rgba(255, 255, 255, 0.85)' };
  };

  const getSeatbeltColor = (isBuckled: boolean): React.CSSProperties => {
    return isBuckled
      ? { color: 'rgba(255, 255, 255, 0.85)' }
      : { color: '#f43f5e', filter: 'drop-shadow(0 0 5px rgba(244,63,94,0.7))' };
  };

  const fuelPct = Math.min(100, Math.max(0, fuel));
  const enginePct = Math.min(100, Math.max(0, engine > 100 ? engine / 10 : engine));
  const rawRpm = Math.min(1.0, Math.max(0.0, rpm));
  const rpmValue = rawRpm <= 0.2 ? 0.0 : (rawRpm - 0.2) / 0.8;
  const isRedline = rawRpm > 0.85;

  // Speed formatting: "056" -> "0" (low opacity) + "56" (white)
  const speedStr = String(Math.round(speed));
  const leadingZeros = '0'.repeat(Math.max(0, 3 - speedStr.length));

  // Circular gauge math: r=76, sweep is 270 degrees
  const circ = 2 * Math.PI * 76;
  const arcLength = circ * (270 / 360);
  const strokeDashoffset = arcLength - (rpmValue * arcLength);

  // Math for needle rotation: starts at 135 deg, sweeps 270 deg
  const needleRotation = 135 + rpmValue * 270;

  // Math for 0-10 tick labels and tick marks (radial lines crossing the r=76 track)
  const maxRpmVal = 10;
  const sweepAngle = 270;
  const startAngle = 135;
  const angleStep = sweepAngle / maxRpmVal;

  const tickLines = [];
  const ticks = [];

  for (let i = 0; i <= maxRpmVal; i++) {
    const angle = startAngle + i * angleStep;
    const rad = (angle * Math.PI) / 180;

    // Major tick line (goes from radius 72 to 80, crossing the 76 track)
    const x1 = 100 + 72 * Math.cos(rad);
    const y1 = 100 + 72 * Math.sin(rad);
    const x2 = 100 + 80 * Math.cos(rad);
    const y2 = 100 + 80 * Math.sin(rad);
    tickLines.push({ x1, y1, x2, y2, isMajor: true, key: `maj-${i}` });

    // Numbers positioned further inside (r=56)
    const nx = 100 + 56 * Math.cos(rad);
    const ny = 100 + 56 * Math.sin(rad);
    ticks.push({ value: i, x: nx, y: ny });

    // Add intermediate minor tick at the halfway point (except after the final number 10)
    if (i < maxRpmVal) {
      const halfAngle = angle + angleStep / 2;
      const halfRad = (halfAngle * Math.PI) / 180;
      const hx1 = 100 + 74 * Math.cos(halfRad);
      const hy1 = 100 + 74 * Math.sin(halfRad);
      const hx2 = 100 + 78 * Math.cos(halfRad);
      const hy2 = 100 + 78 * Math.sin(halfRad);
      tickLines.push({ x1: hx1, y1: hy1, x2: hx2, y2: hy2, isMajor: false, key: `min-${i}` });
    }
  }

  return (
    <div className="relative w-[410px] h-[220px] select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] flex items-center justify-between">

      {/* LEFT SIDE: Speed & Vertical MPH */}
      <div className="flex items-center gap-1 pl-1 shrink-0 relative w-[185px]">


        {/* Vertical KMH label to the left of the speed */}
        <div className="flex flex-col text-[11px] font-medium text-white/40 tracking-[0.25em] uppercase leading-tight pr-3 mr-1 select-none" style={{ fontFamily: 'Barlow, sans-serif' }}>
          <span>K</span>
          <span>M</span>
          <span>H</span>
        </div>

        {/* Speed Number with Alumni Sans for tall & thin numbers */}
        <div className="flex items-baseline select-none" style={{ fontFamily: "'Barlow', sans-serif" }}>
          <span className="text-[100px] font-extralight text-white/15 select-none leading-none tracking-tighter">
            {leadingZeros}
          </span>
          <span className="text-[100px] font-light text-white select-none leading-none tracking-tighter">
            {speedStr}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Circular Tachometer (Needle + Ticks + ABS/TCS/FUEL) */}
      <div className="relative w-[220px] h-[220px] flex flex-col items-center justify-center shrink-0 pr-2 mt-2">

        {/* Tachometer SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
          <defs>
            <filter id="needleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer thin decorative blue arc (r=86) */}
          <circle
            cx="100" cy="100" r="86"
            fill="none"
            stroke="rgba(26, 25, 25, 0.32)"
            strokeWidth="1.2"
            strokeDasharray={`${arcLength + 35} ${circ + 100}`}
            transform="rotate(135 100 100)"
          />

          {/* Background track circle (r=76) */}
          <circle
            cx="100" cy="100" r="76"
            fill="none"
            stroke="rgba(26, 25, 25, 0.72)"
            strokeWidth="1.8"
            strokeDasharray={`${arcLength} ${circ}`}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
          />

          {/* Filled RPM track */}
          <circle
            cx="100" cy="100" r="76"
            fill="none"
            stroke={isRedline ? '#f43f5e' : 'rgba(255, 255, 255, 0.85)'}
            strokeWidth="2.2"
            strokeDasharray={`${arcLength} ${circ}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            style={{
              transition: 'stroke-dashoffset 0.08s ease-out'
            }}
          />

          {/* Tick lines (major and minor radial markers crossing the circle) */}
          {tickLines.map(tick => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isMajor ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.25)"}
              strokeWidth={tick.isMajor ? "1.5" : "1"}
            />
          ))}

          {/* RPM numbers (0-10) */}
          {ticks.map(tick => (
            <text
              key={tick.value}
              x={tick.x}
              y={tick.y + 3.5}
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="9"
              fontWeight="600"
              fontFamily="Archivo, sans-serif"
              textAnchor="middle"
            >
              {tick.value}
            </text>
          ))}

          {/* RPM X1000 Label */}
          <text
            x="100"
            y="76"
            fill="rgba(255, 255, 255, 0.25)"
            fontSize="7"
            fontWeight="bold"
            fontFamily="Archivo, sans-serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            RPM
          </text>
          <text
            x="100"
            y="84"
            fill="rgba(255, 255, 255, 0.15)"
            fontSize="6"
            fontWeight="bold"
            fontFamily="Archivo, sans-serif"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            X1000
          </text>

          {/* Needle group rotated from the center (Bright Red Glow) */}
          <g
            style={{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: '100px 100px',
              transition: 'transform 0.08s ease-out'
            }}
          >
            <line
              x1="100"
              y1="100"
              x2="170"
              y2="100"
              stroke="#ecebebd3"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(221, 214, 214, 0.8))'
              }}
            />
            <circle cx="100" cy="100" r="8" fill="#daceceff" opacity="0.3" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 51, 51, 0.8))' }} />
          </g>

          {/* Center Cap pivot pin */}
          <circle cx="100" cy="100" r="5" fill="#151515f8" stroke="#ffffff" strokeWidth="1.5" />
        </svg>

        {/* Central Gear Indicator (moved down and centered slightly to the right) */}
        <div className="absolute top-[132px] left-[50.5%] -translate-x-1/2 flex flex-col items-center justify-center" style={{ fontFamily: "'Alumni Sans', sans-serif" }}>
          <span className="text-[46px] font-light text-white/95 leading-none select-none tracking-normal">
            {activeGear}
          </span>
        </div>

        {/* Bottom Elements (ENGINE/FUEL/SEATBELT Pill) */}
        <div className="absolute bottom-1.5 flex flex-col items-center w-full">

          {/* ENGINE & FUEL & SEATBELT Indicators in a single harmonized pill shape */}
          <div className="flex gap-3 items-center justify-center border border-white/10 bg-black/45 px-4.5 py-1.5 rounded-full select-none font-sans">
            {/* ENGINE */}
            <div className="flex items-center gap-1.5">
              <span style={getStatusColor(enginePct)} className={enginePct <= 15 ? "animate-pulse" : ""}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 6V4h4v2" />
                  <path d="M18 10h2V8h-2" />
                  <path d="M10 12h4" />
                  <path d="M12 10v4" />
                </svg>
              </span>
              <span className="text-[10px] font-black text-white/95 tabular-nums">{Math.round(enginePct)}%</span>
            </div>
            <span className="w-[1px] h-[10px] bg-white/10" />

            {/* FUEL */}
            <div className="flex items-center gap-1.5">
              <span style={getStatusColor(fuelPct)} className={fuelPct <= 15 ? "animate-pulse" : ""}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 22V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v20" />
                  <path d="M7 2h6v4H7z" />
                  <path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3" />
                </svg>
              </span>
              <span className="text-[10px] font-black text-white/95 tabular-nums">{Math.round(fuelPct)}%</span>
            </div>
            <span className="w-[1px] h-[10px] bg-white/10" />

            {/* SEATBELT */}
            <div className="flex items-center gap-1.5">
              <span style={getSeatbeltColor(seatbelt)} className={!seatbelt ? "animate-pulse" : ""}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3a2 2 0 0 0-2 2v6a8 8 0 0 0 8 8h2a2 2 0 0 0 2-2v-2" />
                  <path d="M19 21a2 2 0 0 0 2-2v-6a8 8 0 0 0-8-8h-2a2 2 0 0 0-2 2v2" />
                  <path d="M8 11h8" />
                </svg>
              </span>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const NeedBar = ({ icon, value, color, maxValue = 100, widthClass = "w-full", heightClass = "h-[12px]" }: { icon: React.ReactNode; value: number; color: string; maxValue?: number; widthClass?: string; heightClass?: string }) => {
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={`flex items-center gap-2 shrink-0 ${widthClass}`}>
      {/* Icon on the left */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {icon}
      </div>

      {/* Sharp Flat Skewed Bar on the right */}
      <div className={`relative flex-1 ${heightClass} flex items-center`}>
        {/* Background Track (thin, centered vertically) */}
        <div className="absolute left-0 right-0 h-[4px] bg-black/60 border border-white/[0.08]" />

        {/* Ghost bar (slower catch-up animation) */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-none opacity-25"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 20, damping: 11, delay: 0.05 }}
          style={{
            backgroundColor: color,
          }}
        />

        {/* Main active bar (faster animation, color-to-white gradient) */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-none"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{
            background: `linear-gradient(90deg, ${color} 0%, ${color} 75%, rgba(255, 255, 255, 0.85) 100%)`,
          }}
        />

        {/* White tick indicator line at the current value end */}
        {value > 0 && (
          <motion.div
            className="absolute top-0 bottom-0 w-[1.5px] bg-white z-10"
            initial={{ left: 0 }}
            animate={{ left: `calc(${percent}% - 1px)` }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          />
        )}
      </div>
    </div>
  );
};

const SegmentedArmorBar = ({ value, color, widthClass = "w-[360px]", heightClass = "h-[12px]" }: { value: number; color: string; widthClass?: string; heightClass?: string }) => {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${widthClass}`}>
      {/* Icon on the left */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-green-400">
          <path d="M6 17L11 12L6 7 M13 17L18 12L13 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 4 segments on the right */}
      <div className={`flex-1 flex items-center gap-1.5 ${heightClass}`}>
        {[0, 1, 2, 3].map((index) => {
          const minVal = index * 25;
          const fillPercent = Math.min(100, Math.max(0, ((value - minVal) / 25) * 100));

          return (
            <div
              key={index}
              className={`relative flex-1 h-full flex items-center`}
            >
              {/* Background Track (thin, centered vertically) */}
              <div className="absolute left-0 right-0 h-[4px] bg-black/60 border border-white/[0.08]" />

              {/* Ghost animation */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-none opacity-25"
                initial={{ width: 0 }}
                animate={{ width: `${fillPercent}%` }}
                transition={{ type: 'spring', stiffness: 20, damping: 11, delay: 0.05 }}
                style={{
                  backgroundColor: color,
                }}
              />

              {/* Main active bar with gradient */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-none"
                initial={{ width: 0 }}
                animate={{ width: `${fillPercent}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                style={{
                  background: `linear-gradient(90deg, ${color} 0%, ${color} 75%, rgba(255, 255, 255, 0.85) 100%)`,
                }}
              />

              {/* White tick indicator line at the current value end */}
              {fillPercent > 0 && (
                <motion.div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-white z-10"
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${fillPercent}% - 1px)` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TacticalColumn = ({ value, color, icon }: { value: number; color: string; icon: React.ReactNode }) => {
  const valStr = String(Math.round(value)).padStart(3, '0');

  return (
    <div className="flex flex-col items-start font-sans select-none flex-1">
      {/* Top Accent line */}
      <div className="w-[30px] h-[3px] mb-1.5 opacity-90 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }} />

      {/* Value and Icon */}
      <div className="flex items-end gap-1 leading-none">
        <span className="text-[28px] font-semibold leading-none tracking-tight font-mono tabular-nums" style={{ color: color, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {valStr}
        </span>
        <div className="flex flex-col items-center justify-center -mb-0.5">
          <div className="opacity-95 scale-[0.85]" style={{ color: color }}>
            {icon}
          </div>
          <span className="text-[8px] font-bold text-white/50 leading-none mt-0.5 font-mono">
            {Math.round(value)}
          </span>
        </div>
      </div>
    </div>
  );
};

const LongNeedBar = ({ value, color, maxValue = 100 }: { value: number; color: string; maxValue?: number }) => {
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* Ghost bar */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-none opacity-25"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 20, damping: 11, delay: 0.05 }}
        style={{
          backgroundColor: color,
        }}
      />
      {/* Main active bar with gradient */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-none"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} 65%, rgba(255, 255, 255, 0.3) 100%)`,
        }}
      />
      {/* White tick indicator line at the current value end */}
      {value > 0 && (
        <motion.div
          className="absolute top-0 bottom-0 w-[1.5px] bg-white z-10"
          initial={{ left: 0 }}
          animate={{ left: `calc(${percent}% - 1px)` }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        />
      )}
    </div>
  );
};

export default function App() {
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [water, setWater] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [oxygen, setOxygen] = useState(100);
  const [cinematicSize, setCinematicSize] = useState(10);

  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(2);
  const [isRadioTalking, setIsRadioTalking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getActiveStateConfig = () => {
    const active = micActive || isRadioTalking || isMicDebug;
    const voiceRange = micLevel === 1 ? 'whisper' : micLevel === 3 ? 'shout' : 'normal';
    const dynamicSize = voiceRange === 'whisper' ? '34px' : voiceRange === 'shout' ? '62px' : '48px';

    if (!active) {
      return {
        color: 'rgba(255, 255, 255, 0.3)',
        bg: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.4)',
        size: dynamicSize
      };
    }
    if (isRadioTalking) {
      return {
        color: 'rgba(56, 189, 248, 0.6)',
        bg: 'rgba(56, 189, 248, 0.4)',
        border: 'rgba(56, 189, 248, 0.8)',
        size: '48px'
      };
    }
    switch (voiceRange) {
      case 'whisper':
        return {
          color: 'rgba(250, 204, 21, 0.6)',
          bg: 'rgba(250, 204, 21, 0.4)',
          border: 'rgba(250, 204, 21, 0.8)',
          size: '34px'
        };
      case 'shout':
        return {
          color: 'rgba(248, 113, 113, 0.6)',
          bg: 'rgba(248, 113, 113, 0.4)',
          border: 'rgba(248, 113, 113, 0.8)',
          size: '62px'
        };
      case 'normal':
      default:
        return {
          color: 'rgba(74, 222, 128, 0.6)',
          bg: 'rgba(74, 222, 128, 0.4)',
          border: 'rgba(74, 222, 128, 0.8)',
          size: '48px'
        };
    }
  };

  const blobVariants = {
    idle: {
      borderRadius: '50%',
      scale: 1,
      rotate: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    talking: {
      borderRadius: [
        '50% 50% 50% 50% / 50% 50% 50% 50%',
        '38% 62% 63% 37% / 41% 44% 56% 59%',
        '64% 36% 50% 50% / 37% 55% 45% 63%',
        '42% 58% 30% 70% / 60% 33% 67% 40%',
        '55% 45% 62% 38% / 45% 58% 42% 55%',
        '50% 50% 50% 50% / 50% 50% 50% 50%'
      ],
      scale: [1, 1.08, 0.94, 1.1, 0.93, 1],
      rotate: [0, 10, -8, 12, -10, 0],
      transition: {
        duration: 1.6,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const [hudLocation, setHudLocation] = useState({
    street: 'Strawberry Ave',
    zone: 'Vinewood Hills',
    heading: 'N',
    headingAngle: 0,
    distance: -1,
    waypointAngle: null as number | null
  });

  const [visible, setVisible] = useState(true);
  const [isInVehicle, setIsInVehicle] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [isCinematic, setIsCinematic] = useState(() => {
    const saved = localStorage.getItem('isCinematic');
    return saved ? JSON.parse(saved) : false;
  });
  const [showOnlyMic, setShowOnlyMic] = useState(() => {
    const saved = localStorage.getItem('showOnlyMic');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugCollapsed, setIsDebugCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [minimapType, setMinimapType] = useState(() => {
    const saved = localStorage.getItem('minimapType');
    return saved ? JSON.parse(saved) : 'square';
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showHeliHud, setShowHeliHud] = useState(() => {
    const saved = localStorage.getItem('showHeliHud');
    return saved ? JSON.parse(saved) : true;
  });
  const [showVehicleHud, setShowVehicleHud] = useState(() => {
    const saved = localStorage.getItem('showVehicleHud');
    return saved ? JSON.parse(saved) : true;
  });
  const [rpmDebug, setRpmDebug] = useState(0);
  const [speedDebug, setSpeedDebug] = useState(0);
  const [isMicDebug, setIsMicDebug] = useState(false);
  const [isWebDebugCollapsed, setIsWebDebugCollapsed] = useState(false);
  const [isHeadingSimulated, setIsHeadingSimulated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [vehicleData, setVehicleData] = useState({
    speed: 0,
    rpm: 0,
    gear: 1,
    fuel: 100,
    engine: 100,
    locked: false,
    altitude: 0,
    pitch: 0,
    roll: 0,
    agl: 0,
    vehicleClass: 0,
    seatbelt: false,
    indicators: { leftTurn: false, rightTurn: false, hazards: false, lowBeam: false, highBeam: false, handbrake: false }
  });
  const [isAnimatedECG, setIsAnimatedECG] = useState(false);
  const [weaponData, setWeaponData] = useState({
    visible: false,
    clip: 0,
    ammo: 0,
    hasClip: true
  });



  const [speedBomb, setSpeedBomb] = useState({
    visible: false,
    timer: 120,
    maxTimer: 120,
    graceTimer: 7,
    maxGrace: 7,
    showGrace: false
  });

  const [hudSettings, setHudSettings] = useState(() => {
    const saved = localStorage.getItem('hud_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_SETTINGS, ...parsed };
      } catch (e) {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });
  const [phoneState, setPhoneState] = useState({ isOpen: false, isNotification: false });

  // Settings LocalStorage Auto-Persistence
  useEffect(() => {
    localStorage.setItem('hud_settings', JSON.stringify(hudSettings));
  }, [hudSettings]);

  useEffect(() => {
    localStorage.setItem('isCinematic', JSON.stringify(isCinematic));
  }, [isCinematic]);

  useEffect(() => {
    localStorage.setItem('showOnlyMic', JSON.stringify(showOnlyMic));
  }, [showOnlyMic]);

  useEffect(() => {
    localStorage.setItem('minimapType', JSON.stringify(minimapType));
  }, [minimapType]);

  useEffect(() => {
    localStorage.setItem('showHeliHud', JSON.stringify(showHeliHud));
  }, [showHeliHud]);

  useEffect(() => {
    localStorage.setItem('showVehicleHud', JSON.stringify(showVehicleHud));
  }, [showVehicleHud]);

  const handleRestoreDefaults = () => {
    setHudSettings(INITIAL_SETTINGS);
  };


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      /* console.log("HUD NUI Msg Received:", JSON.stringify(event.data));*/
      const { action, payload, value, visible: isVisible } = event.data;

      switch (action) {

        case 'showSpeedBomb':
          setSpeedBomb(prev => ({ ...prev, visible: true }));
          break;
        case 'hideSpeedBomb':
          setSpeedBomb(prev => ({ ...prev, visible: false }));
          break;
        case 'updateSpeedBomb':
          setSpeedBomb({
            visible: true,
            timer: event.data.timer ?? 120,
            maxTimer: event.data.maxTimer ?? 120,
            graceTimer: event.data.graceTimer ?? 7,
            maxGrace: event.data.maxGrace ?? 7,
            showGrace: event.data.showGrace ?? false
          });
          break;

        case 'phoneStateChanged':
          setPhoneState({
            isOpen: payload?.isOpen || false,
            isNotification: payload?.isNotification || false
          });
          break;
        case 'updatePlayer':
          setHealth(payload.health);
          setArmor(payload.armor);
          setHunger(payload.hunger);
          setWater(payload.thirst);
          setStamina(payload.stamina);
          setOxygen(payload.oxygen);
          if (payload.isInVehicle !== undefined) setIsInVehicle(payload.isInVehicle);
          break;
        case 'updateLocation':
          setHudLocation({
            street: payload.street,
            zone: payload.zone,
            heading: payload.heading,
            headingAngle: payload.headingAngle || 0,
            distance: payload.waypointDistance,
            waypointAngle: payload.waypointAngle !== undefined ? payload.waypointAngle : null
          });
          break;
        case 'updateVehicle':
          setIsInVehicle(payload.inVehicle);
          if (payload.inVehicle) {
            setVehicleData(prev => ({ ...prev, ...payload }));
          }
          break;
        case 'updateVoice':
          if (payload.active !== undefined) setMicActive(payload.active);
          if (payload.talking !== undefined) setIsSpeaking(payload.talking);
          if (payload.range !== undefined) setMicLevel(payload.range);
          if (payload.isRadioTalking !== undefined) setIsRadioTalking(payload.isRadioTalking);
          break;
        case 'updateWeapon':
          if (payload) {
            setWeaponData({
              visible: payload.visible,
              clip: payload.clip,
              ammo: payload.ammo,
              hasClip: payload.hasClip
            });
          }
          break;
        case 'toggleHud':
          setVisible(isVisible);
          break;
        case 'toggleCinematic':
          setIsCinematic(prev => !prev);
          break;
        case 'setDevMode':
          setIsDevMode(value);
          break;
        case 'openHudSettings':
          setIsSettingsOpen(true);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  useEffect(() => {
    postNUI('setNuiFocus', { focus: isSettingsOpen, cursor: isSettingsOpen });
  }, [isSettingsOpen]);

  useEffect(() => {
    postNUI('toggleCinematicRadar', { state: isCinematic });
  }, [isCinematic]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isBrowser || !isHeadingSimulated) return;
    const interval = setInterval(() => {
      setHudLocation(prev => {
        const nextAngle = (prev.headingAngle + 2) % 360;
        const headingsList = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const hIndex = Math.floor(((nextAngle + 22.5) % 360) / 45);
        const dir = headingsList[hIndex] || "N";
        return {
          ...prev,
          headingAngle: nextAngle,
          heading: dir
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isHeadingSimulated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
      //  if (e.key === "f11" || e.key === "F11") {
      //     e.preventDefault();
      //      setVisible(prev => !prev);
      //      postNUI('saveSettings', { visible: !visible });
      //    }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, visible]);

  useEffect(() => {
    // Only post if it's not the initial mount to save overhead
    postNUI('saveSettings', {
      hudSettings,
      minimapType,
      showVehicleHud,
      showHeliHud,
      isCinematic,
      showOnlyMic,
      visible
    });
  }, [hudSettings, minimapType, showVehicleHud, showHeliHud, isCinematic, showOnlyMic, visible]);


  const shouldShow = (value: number, threshold: number, mode: 'always' | 'dynamic' = 'dynamic', componentName?: string) => {
    if (showOnlyMic) return componentName === 'mic';
    if (isCinematic) return false;
    if (mode === 'always') return true;
    return value <= threshold;
  };

  const updateVehData = (key: string, value: any) => {
    setVehicleData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateIndicator = (key: string, value: boolean) => {
    setVehicleData(prev => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [key]: value
      }
    }));
  };

  const isCarHudActive = showVehicleHud && isInVehicle && vehicleData.vehicleClass !== 15 && vehicleData.vehicleClass !== 16 && !isCinematic && !showOnlyMic;

  const micY = phoneState.isNotification
    ? -140
    : isCarHudActive
      ? -185
      : 0;

  const micX = phoneState.isOpen
    ? -340
    : 0;

  const carHudTransform = phoneState.isOpen
    ? "translate(-300px, 0px)"
    : phoneState.isNotification
      ? "translate(0px, -140px)"
      : "translate(0px, 0px)";

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden ">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Alumni+Sans:ital,wght@0,100..900;1,100..900&family=Geist:wght@100..900&family=Iosevka+Charon+Mono:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Manrope:wght@200..800&family=Monda:wght@400..700&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Oswald:wght@200..700&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Rock+3D&family=Syne:wght@400..800&family=Unbounded:wght@200..900&display=swap');
        @keyframes flash-red {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(225, 29, 72, 0.8)); }
          50% { opacity: 0.2; filter: drop-shadow(0 0 2px rgba(225, 29, 72, 0.2)); }
        }
        .animate-flash-red {
          animation: flash-red 1s infinite ease-in-out;
        }
      `}</style>

      {/* Screen Effects */}
      {hudSettings.healthGlow && <LowHealthVignette health={health} />}




      {/* Cinematic Bars */}
      <div
        className="fixed inset-x-0 top-0 bg-black z-50 transition-all duration-500 pointer-events-none"
        style={{ height: isCinematic ? `${cinematicSize}vh` : '0px' }}
      />
      <div
        className="fixed inset-x-0 bottom-0 bg-black z-50 transition-all duration-500 pointer-events-none"
        style={{ height: isCinematic ? `${cinematicSize}vh` : '0px' }}
      />



      {/* Development Watermark Removed */}

      {/* Main HUD Container */}
      <div className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {(!isCinematic && !showOnlyMic && isInVehicle && (vehicleData.vehicleClass !== 15 && vehicleData.vehicleClass !== 16)) && (
          <MovingCompassTape
            headingAngle={hudLocation.headingAngle || 0}
            street={hudLocation.street}
            zone={hudLocation.zone}
            waypointAngle={hudLocation.distance > 0 ? hudLocation.waypointAngle : null}
          />
        )}

        {/* Helicopter HUD (Centered Bottom) */}
        <AnimatePresence>
          {(isInVehicle && (vehicleData.vehicleClass === 15 || vehicleData.vehicleClass === 16) && showHeliHud && !isCinematic && !showOnlyMic) && (
            <motion.div
              initial={{ y: 200, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              exit={{ y: 200, opacity: 0, x: '-50%' }}
              className="absolute bottom-2 left-1/2 z-40 scale-75 xl:scale-100"
            >
              <HelicopterHUD data={vehicleData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Developer Overlays Removed */}
        {/* DebugDashboard removed */}





        {/* Graphical Car HUD (Bottom Right) */}
        <AnimatePresence>
          {showVehicleHud && isInVehicle && vehicleData.vehicleClass !== 15 && vehicleData.vehicleClass !== 16 && !isCinematic && !showOnlyMic && (
            <motion.div
              key="graphical-car-hud-v2"
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              className="fixed bottom-4 right-8 z-[700] font-monda select-none pointer-events-none transition-all duration-500 loku-perspective-right"
              style={{ transform: carHudTransform }}
            >
              <VehicleHUD
                speed={vehicleData.speed || speedDebug || 0}
                rpm={(vehicleData.rpm || 0) + (rpmDebug || 0)}
                gear={vehicleData.gear || 1}
                fuel={vehicleData.fuel || 100}
                engine={vehicleData.engine || 100}
                seatbelt={vehicleData.seatbelt}
                style={hudSettings.rpmStyle}
                indicators={vehicleData.indicators}
              />
            </motion.div>
          )}
        </AnimatePresence>





        {/* Speed Bomb UI */}
        <AnimatePresence>
          {speedBomb.visible && !isCinematic && !showOnlyMic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              className="fixed left-8 top-[58%] -translate-y-1/2 z-40 w-[340px] font-monda pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex flex-col gap-1.5"
            >
              <div className="relative overflow-visible">
                {/* Red warning backlight */}
                <div className="absolute -inset-[3px] bg-red-600/[0.1] blur-[15px] rounded-lg pointer-events-none animate-pulse" />
                <div
                  className="relative bg-black/45 border border-red-500/20 flex flex-col p-4 overflow-hidden"
                  style={{
                    clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'
                  }}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between text-white font-[700] uppercase tracking-wider text-[12px]">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <svg className="w-4 h-4 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      HIZ BOMBASI
                    </span>
                    <span className="text-[14px] font-black tracking-widest tabular-nums text-red-500">
                      {speedBomb.timer} SN
                    </span>
                  </div>

                  {/* Main Bomb Progress Bar */}
                  <div className="relative w-full h-[6px] bg-black/50 border border-white/[0.04] overflow-hidden mt-3 rounded-full">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(speedBomb.timer / speedBomb.maxTimer) * 100}%` }}
                      transition={{ duration: 1, ease: 'linear' }}
                      style={{
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)'
                      }}
                    />
                  </div>

                  {/* Grace countdown bar (appears below speed limit) */}
                  <AnimatePresence>
                    {speedBomb.showGrace && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-[#ff3333] font-[900] tracking-wider text-[11px]">
                          <span className="animate-pulse">🚨 YAVAŞLADINIZ! HIZLANIN!</span>
                          <span className="tabular-nums text-[13px]">{speedBomb.graceTimer}S</span>
                        </div>
                        <div className="relative w-full h-[5px] bg-black/50 border border-[#ff3333]/10 overflow-hidden mt-2 rounded-full">
                          <motion.div
                            className="h-full bg-red-600"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(speedBomb.graceTimer / speedBomb.maxGrace) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                            style={{
                              boxShadow: '0 0 6px rgba(255, 51, 51, 0.8)'
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row - Always anchored to bottom-left */}
        <div className={`fixed bottom-6 left-7 z-[700] transition-all loku-perspective-new duration-500 ${isCinematic || showOnlyMic ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
          {(() => {
            const getActiveStateConfig = () => {
              const active = micActive || isRadioTalking || isMicDebug;
              if (!active) {
                return {
                  color: 'rgba(255, 255, 255, 0.3)',
                  bg: 'rgba(255, 255, 255, 0.1)',
                  border: 'rgba(255, 255, 255, 0.4)',
                  size: '42px'
                };
              }
              if (isRadioTalking) {
                return {
                  color: 'rgba(56, 189, 248, 0.6)',
                  bg: 'rgba(56, 189, 248, 0.4)',
                  border: 'rgba(56, 189, 248, 0.8)',
                  size: '48px'
                };
              }
              const voiceRange = micLevel === 1 ? 'whisper' : micLevel === 3 ? 'shout' : 'normal';
              switch (voiceRange) {
                case 'whisper':
                  return {
                    color: 'rgba(250, 204, 21, 0.6)',
                    bg: 'rgba(250, 204, 21, 0.4)',
                    border: 'rgba(250, 204, 21, 0.8)',
                    size: '34px'
                  };
                case 'shout':
                  return {
                    color: 'rgba(248, 113, 113, 0.6)',
                    bg: 'rgba(248, 113, 113, 0.4)',
                    border: 'rgba(248, 113, 113, 0.8)',
                    size: '62px'
                  };
                case 'normal':
                default:
                  return {
                    color: 'rgba(74, 222, 128, 0.6)',
                    bg: 'rgba(74, 222, 128, 0.4)',
                    border: 'rgba(74, 222, 128, 0.8)',
                    size: '48px'
                  };
              }
            };

            const blobVariants = {
              idle: {
                borderRadius: '50%',
                scale: 1,
                rotate: 0,
                transition: { duration: 0.5, ease: 'easeOut' }
              },
              talking: {
                borderRadius: [
                  '50% 50% 50% 50% / 50% 50% 50% 50%',
                  '38% 62% 63% 37% / 41% 44% 56% 59%',
                  '64% 36% 50% 50% / 37% 55% 45% 63%',
                  '42% 58% 30% 70% / 60% 33% 67% 40%',
                  '55% 45% 62% 38% / 45% 58% 42% 55%',
                  '50% 50% 50% 50% / 50% 50% 50% 50%'
                ],
                scale: [1, 1.08, 0.94, 1.1, 0.93, 1],
                rotate: [0, 10, -8, 12, -10, 0],
                transition: {
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }
            };

            const showArmor = shouldShow(armor, hudSettings.armorThreshold, hudSettings.armorMode) && armor > 0;
            const showHealth = (health > 100 || shouldShow(health, hudSettings.healthThreshold, 'dynamic'));
            const showHunger = shouldShow(hunger, hudSettings.hungerThreshold, 'dynamic');
            const showWater = shouldShow(water, hudSettings.waterThreshold, 'dynamic');
            const showStamina = shouldShow(stamina, hudSettings.staminaThreshold, hudSettings.staminaMode);
            const showOxygen = shouldShow(oxygen, hudSettings.oxygenThreshold, hudSettings.oxygenMode) && oxygen < 95;

            // Dynamic health bar color: green normal, yellow medium, red low (out of 100 max)
            let healthColor = "#7ee954ff"; // Greenish
            if (health <= 30) {
              healthColor = "#f43f5e"; // Red
            } else if (health <= 60) {
              healthColor = "#e9c761ff"; // Yellow
            }

            const armorVal = Math.round(armor);
            const hungerVal = Math.round(hunger);
            const waterVal = Math.round(water);

            const formatValue = (val: number) => {
              const str = String(val);
              if (str.length === 1) {
                return (
                  <>
                    <span className="opacity-20 font-bold">00</span>
                    <span>{str}</span>
                  </>
                );
              } else if (str.length === 2) {
                return (
                  <>
                    <span className="opacity-20 font-bold">0</span>
                    <span>{str}</span>
                  </>
                );
              }
              return <span>{str}</span>;
            };

            const col1ValPercent = Math.min(100, Math.max(0, armorVal > 0 ? armorVal : stamina));

            const displayHealth = Math.min(100, health > 100 ? (health - 100) : health);

            let dynamicHealthColor = "#3ac251ff";
            if (displayHealth <= 15) {
              dynamicHealthColor = "#ef4444";
            } else if (displayHealth <= 50) {
              dynamicHealthColor = "#eab308";
            }

            return (
              <div className="flex flex-col gap-2.5 items-start select-none">
                {/* Horizontal row of modern status boxes */}
                <div className="flex items-center justify-start">
                  <SquircleHUD id="health" icon={Activity} color={dynamicHealthColor} value={displayHealth} forceHide={!showHealth} />
                  <SquircleHUD id="armor" icon={Shield} color="#3b82f6" value={armor} forceHide={!showArmor} />
                  <SquircleHUD id="hunger" icon={Salad} color="#e09035ff" value={hunger} forceHide={!showHunger} />
                  <SquircleHUD id="water" icon={Droplet} color="#2796d6ff" value={water} forceHide={!showWater} />
                  <SquircleHUD id="stamina" icon={Zap} color="#eab308" value={stamina} forceHide={!showStamina} />
                  <SquircleHUD id="oxygen" icon={Wind} color="#64748b" value={oxygen} forceHide={!showOxygen} />
                  <SquircleHUD id="devmode" icon={Terminal} color="#202020ff" value={isDevMode ? 100 : 0} forceHide={!isDevMode} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Wobble Blob Microphone widget & Weapon HUD (to the left of it) */}
        <AnimatePresence>
          {!isCinematic && !showOnlyMic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: micX, y: micY }}
              transition={{ type: 'spring', stiffness: 220, damping: 25 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-10 right-11 z-50 flex items-center gap-5"
            >
              {/* Text-only Weapon HUD (to the left of the microphone) */}
              <AnimatePresence>
                {weaponData.visible && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-end font-mono select-none pointer-events-none mr-1"
                    style={{ fontFamily: "'Barlow', sans-serif" }}
                  >
                    {weaponData.hasClip ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[38px] font-medium leading-none text-[#e8847d]" style={{ textShadow: '0 0 10px rgba(232, 132, 125, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8)' }}>{weaponData.clip}</span>
                        <span className="text-[20px] text-white/30 font-light">/</span>
                        <span className="text-[26px] text-white/95 font-medium leading-none" style={{ textShadow: '0 1.5px 2px rgba(0, 0, 0, 0.9)' }}>{weaponData.ammo}</span>
                      </div>
                    ) : (
                      <span className="text-[34px] font-medium text-white leading-none" style={{ textShadow: '0 1.5px 2px rgba(0, 0, 0, 0.9)' }}>{weaponData.ammo}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Microphone Widget */}
              {(() => {
                const config = getActiveStateConfig();
                return (
                  <div className="relative w-[65px] h-[65px] flex items-center justify-center shrink-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    <motion.div
                      className="relative z-10 backdrop-blur-sm border-[2.5px] will-change-transform"
                      animate={(isSpeaking || isMicDebug) ? "talking" : "idle"}
                      variants={blobVariants}
                      initial="idle"
                      style={{
                        width: config.size,
                        height: config.size,
                        backgroundColor: config.bg,
                        borderColor: config.border,
                        boxShadow: (micActive || isRadioTalking || isMicDebug) ? `0 0 20px ${config.color}, inset 0 0 12px ${config.color}` : '0 0 8px rgba(0,0,0,0.4)',
                        transition: 'width 0.3s ease-out, height 0.3s ease-out, background-color 0.2s, border-color 0.2s, box-shadow 0.2s'
                      }}
                    />
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="w-[880px] h-[630px] p-3 bg-black/90 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col select-none font-sans"
            >
              {/* Header with Bright Save Button */}
              <div className="h-14 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between px-5">
                <span className="text-[12px] font-black tracking-widest text-[#00b7e5] uppercase">HUD CONFIGURATION</span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4.5 py-1.5 bg-[#00b7e5] text-black font-semibold text-[10.5px] uppercase tracking-wider rounded transition-all hover:bg-[#00c2cb] active:scale-95 cursor-pointer shadow-[0_0_8px_rgba(0,183,229,0.4)]"
                >
                  SAVE
                </button>
              </div>

              {/* Vertical Scrollable Settings Content Area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-transparent space-y-5">

                {/* General Config Section */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] text-[#00b7e5] font-black tracking-widest uppercase border-b border-white/[0.04] pb-1.5">GENERAL CONFIG</h4>

                  {/* Cinematic Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Cinematic Mode</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Black bars overlay</span>
                    </div>
                    <CustomSwitch active={isCinematic} onClick={() => setIsCinematic(!isCinematic)} />
                  </div>

                  {/* Black Bar Size */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Black Bar Size</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Screen coverage percent</span>
                    </div>
                    <div className="flex items-center bg-zinc-950/90 border border-white/5 rounded px-2 py-0.5 w-16">
                      <input
                        type="number"
                        min="10"
                        max="25"
                        value={cinematicSize}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 10) val = 10;
                          if (val > 25) val = 25;
                          setCinematicSize(val);
                        }}
                        className="w-full bg-transparent border-none text-white text-[10px] font-bold text-center focus:outline-none tabular-nums"
                      />
                      <span className="text-[8px] text-zinc-500 font-bold ml-0.5">%</span>
                    </div>
                  </div>

                  {/* Hide All HUD */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Hide All HUD</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Turn off visual widgets</span>
                    </div>
                    <CustomSwitch active={showOnlyMic} onClick={() => setShowOnlyMic(!showOnlyMic)} />
                  </div>
                </div>

                {/* Performance Section */}
                <div className="space-y-3.5 pt-1">
                  <h4 className="text-[10px] text-[#00b7e5] font-black tracking-widest uppercase border-b border-white/[0.04] pb-1.5">PERFORMANCE SETTINGS</h4>

                  {/* Speedometer FPS */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Speedometer FPS</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Telemetry update rate</span>
                    </div>
                    <CustomDropdown
                      value={hudSettings.speedometerFps || 45}
                      options={[20, 30, 45, 60]}
                      onChange={(val) => setHudSettings({ ...hudSettings, speedometerFps: val })}
                    />
                  </div>

                  {/* Compass FPS */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Compass FPS</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Heading update rate</span>
                    </div>
                    <CustomDropdown
                      value={hudSettings.compassFps || 20}
                      options={[10, 20, 30, 45]}
                      onChange={(val) => setHudSettings({ ...hudSettings, compassFps: val })}
                    />
                  </div>
                </div>

                {/* Thresholds Section */}
                <div className="space-y-3.5 pt-1">
                  <h4 className="text-[10px] text-[#00b7e5] font-black tracking-widest uppercase border-b border-white/[0.04] pb-1.5">VISIBILITY THRESHOLDS</h4>

                  <div className="space-y-3.5">
                    {[
                      { label: 'Armor', key: 'armorThreshold', modeKey: 'armorMode', isToggle: true },
                      { label: 'Stamina', key: 'staminaThreshold', modeKey: 'staminaMode', isToggle: true },
                      { label: 'Oxygen', key: 'oxygenThreshold', modeKey: 'oxygenMode', isToggle: true },
                      { label: 'Health', key: 'healthThreshold' },
                      { label: 'Hunger', key: 'hungerThreshold' },
                      { label: 'Water', key: 'waterThreshold' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">{item.label} Visibility</span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                            {item.isToggle ? 'Set behavior / hide %' : 'Hide above value'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          {item.isToggle && (
                            <div className="flex gap-[1px] bg-zinc-950 p-[2px] rounded border border-white/5">
                              {['always', 'dynamic'].map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setHudSettings({ ...hudSettings, [item.modeKey!]: m as any })}
                                  className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-[2px] cursor-pointer transition-all ${hudSettings[item.modeKey as keyof typeof hudSettings] === m ? 'bg-white text-black font-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                  {m === 'dynamic' ? 'dyn' : 'alw'}
                                </button>
                              ))}
                            </div>
                          )}
                          <NumberInput
                            value={hudSettings[item.key as keyof typeof hudSettings]}
                            onChange={(val) => setHudSettings({ ...hudSettings, [item.key]: val })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset Section */}
                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Restore Defaults</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 font-sans">Reset config values</span>
                  </div>
                  <button
                    onClick={handleRestoreDefaults}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all rounded-[3px] cursor-pointer"
                  >
                    Restore
                  </button>
                </div>

              </div>

              {/* Close Overlay */}
              <div
                className="absolute inset-0 z-[-1] cursor-pointer"
                onClick={() => setIsSettingsOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Web Debugger - Only visible in browser */}
      {isBrowser && (
        <div className="fixed top-4 left-4 z-[9999] pointer-events-auto select-none ">
          {isWebDebugCollapsed ? (
            <button
              onClick={() => setIsWebDebugCollapsed(false)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 rounded-md shadow-lg text-xs font-bold text-[#00b7e5] cursor-pointer hover:border-[#00b7e5]/50 transition-all duration-300"
            >
              <Terminal size={14} />
              <span>DEBUG MENU</span>
            </button>
          ) : (
            <div className="w-80 bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-[#00b7e5]" />
                  <span className="text-xs font-black text-white tracking-wider">HUD WEB DEBUGGER</span>
                </div>
                <button
                  onClick={() => setIsWebDebugCollapsed(true)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  Hide
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-[11px] text-zinc-400">

                {/* Section: Mode Presets */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Quick Presets</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        setIsInVehicle(false);
                      }}
                      className={`py-1 rounded text-center font-bold border cursor-pointer transition-all ${!isInVehicle
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                      On Foot
                    </button>
                    <button
                      onClick={() => {
                        setIsInVehicle(true);
                        setVehicleData(prev => ({ ...prev, vehicleClass: 0 }));
                      }}
                      className={`py-1 rounded text-center font-bold border cursor-pointer transition-all flex items-center justify-center gap-1 ${isInVehicle && vehicleData.vehicleClass !== 15 && vehicleData.vehicleClass !== 16
                        ? 'bg-[#00b7e5]/20 border-[#00b7e5] text-[#00b7e5]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                      <Car size={11} />
                      Car Mode
                    </button>
                    <button
                      onClick={() => {
                        setIsInVehicle(true);
                        setVehicleData(prev => ({ ...prev, vehicleClass: 15, altitude: 250, agl: 150, pitch: 5, roll: -10 }));
                      }}
                      className={`py-1 rounded text-center font-bold border cursor-pointer transition-all flex items-center justify-center gap-1 ${isInVehicle && (vehicleData.vehicleClass === 15 || vehicleData.vehicleClass === 16)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                    >
                      <Plane size={11} />
                      Heli Mode
                    </button>
                  </div>
                </div>

                {/* Section: Basic Controls */}
                <div className="space-y-2 border-t border-zinc-900 pt-3">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Global Settings</div>
                  <div className="flex items-center justify-between">
                    <span>Show HUD (Visible State)</span>
                    <button
                      onClick={() => setVisible(p => !p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${visible ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                    >
                      {visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Settings Overlay</span>
                    <button
                      onClick={() => setIsSettingsOpen(p => !p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${isSettingsOpen ? 'bg-[#00b7e5]/20 text-[#00b7e5] border border-[#00b7e5]/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                    >
                      {isSettingsOpen ? 'Open' : 'Closed'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dev Mode State</span>
                    <button
                      onClick={() => setIsDevMode(p => !p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${isDevMode ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                    >
                      {isDevMode ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                </div>

                {/* Section: Player HUD Toggles / Sliders */}
                <div className="space-y-2.5 border-t border-zinc-900 pt-3">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Player Needs</div>

                  {/* Health Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Health</span>
                      <span className="text-zinc-200 font-bold">{Math.min(100, health > 100 ? (health - 100) : health)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={health > 100 ? (health - 100) : health}
                      onChange={(e) => setHealth(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Armor Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Armor</span>
                      <span className="text-zinc-200 font-bold">{armor}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={armor}
                      onChange={(e) => setArmor(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Hunger Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Hunger</span>
                      <span className="text-zinc-200 font-bold">{hunger}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={hunger}
                      onChange={(e) => setHunger(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Thirst/Water Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Thirst</span>
                      <span className="text-zinc-200 font-bold">{water}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={water}
                      onChange={(e) => setWater(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>

                  {/* Stamina Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Stamina</span>
                      <span className="text-zinc-200 font-bold">{stamina}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={stamina}
                      onChange={(e) => setStamina(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-lime-500"
                    />
                  </div>

                  {/* Oxygen Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Oxygen</span>
                      <span className="text-zinc-200 font-bold">{oxygen}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" value={oxygen}
                      onChange={(e) => setOxygen(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-slate-500"
                    />
                  </div>
                </div>

                {/* Section: Vehicle Telemetry */}
                {isInVehicle && (
                  <div className="space-y-2.5 border-t border-zinc-900 pt-3">
                    <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                      Vehicle Telemetry ({vehicleData.vehicleClass === 15 || vehicleData.vehicleClass === 16 ? 'Heli' : 'Car'})
                    </div>

                    {/* Speed */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>Speed (km/h)</span>
                        <span className="text-zinc-200 font-bold">{vehicleData.speed}</span>
                      </div>
                      <input
                        type="range" min="0" max="320" value={vehicleData.speed}
                        onChange={(e) => updateVehData('speed', Number(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                      />
                    </div>

                    {/* RPM */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>RPM</span>
                        <span className="text-zinc-200 font-bold">{Math.round(vehicleData.rpm * 100)}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={vehicleData.rpm * 100}
                        onChange={(e) => updateVehData('rpm', Number(e.target.value) / 100)}
                        className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                      />
                    </div>

                    {/* Gear Selection */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span>Gear</span>
                      <div className="flex gap-1">
                        {['R', 'N', 1, 2, 3, 4, 5, 6].map(g => (
                          <button
                            key={g}
                            onClick={() => updateVehData('gear', g)}
                            className={`w-5 py-0.5 rounded text-center text-[9px] font-black cursor-pointer ${vehicleData.gear === g
                              ? 'bg-[#00b7e5] text-black'
                              : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                              }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fuel & Engine */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px]">
                          <span>Fuel</span>
                          <span className="font-bold text-zinc-300">{vehicleData.fuel}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={vehicleData.fuel}
                          onChange={(e) => updateVehData('fuel', Number(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px]">
                          <span>Engine</span>
                          <span className="font-bold text-zinc-300">{vehicleData.engine}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={vehicleData.engine}
                          onChange={(e) => updateVehData('engine', Number(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Seatbelt Toggle */}
                    <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2">
                      <span>Seatbelt Enabled</span>
                      <button
                        onClick={() => updateVehData('seatbelt', !vehicleData.seatbelt)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${vehicleData.seatbelt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                      >
                        {vehicleData.seatbelt ? 'Belted' : 'No Belt'}
                      </button>
                    </div>

                    {/* Helicopter exclusive controls */}
                    {(vehicleData.vehicleClass === 15 || vehicleData.vehicleClass === 16) && (
                      <div className="space-y-2.5 border-t border-zinc-900/50 pt-2.5 bg-zinc-900/20 p-2 rounded border border-zinc-900">
                        <div className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1">
                          <Plane size={10} />
                          <span>Heli Avionics</span>
                        </div>

                        {/* Altitude */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span>Altitude (ASL)</span>
                            <span className="text-zinc-200 font-bold">{vehicleData.altitude} ft</span>
                          </div>
                          <input
                            type="range" min="0" max="1500" value={vehicleData.altitude}
                            onChange={(e) => updateVehData('altitude', Number(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                          />
                        </div>

                        {/* AGL */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span>AGL (Height)</span>
                            <span className="text-zinc-200 font-bold">{vehicleData.agl} ft</span>
                          </div>
                          <input
                            type="range" min="0" max="800" value={vehicleData.agl}
                            onChange={(e) => updateVehData('agl', Number(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                          />
                        </div>

                        {/* Pitch & Roll */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px]">
                              <span>Pitch</span>
                              <span className="font-bold text-zinc-300">{vehicleData.pitch}°</span>
                            </div>
                            <input
                              type="range" min="-45" max="45" value={vehicleData.pitch}
                              onChange={(e) => updateVehData('pitch', Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px]">
                              <span>Roll</span>
                              <span className="font-bold text-zinc-300">{vehicleData.roll}°</span>
                            </div>
                            <input
                              type="range" min="-45" max="45" value={vehicleData.roll}
                              onChange={(e) => updateVehData('roll', Number(e.target.value))}
                              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Section: Compass Simulator */}
                <div className="space-y-2 border-t border-zinc-900 pt-3">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex justify-between">
                    <span>Compass & Location</span>
                    <button
                      onClick={() => setIsHeadingSimulated(p => !p)}
                      className={`text-[8px] font-bold px-1.5 rounded cursor-pointer ${isHeadingSimulated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-500'
                        }`}
                    >
                      {isHeadingSimulated ? 'Auto-Spinning' : 'Manual'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Heading Angle</span>
                      <span className="text-zinc-200 font-bold">{Math.round(hudLocation.headingAngle)}° ({hudLocation.heading})</span>
                    </div>
                    <input
                      type="range" min="0" max="360" value={hudLocation.headingAngle}
                      disabled={isHeadingSimulated}
                      onChange={(e) => {
                        const deg = Number(e.target.value);
                        const headingsList = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
                        const hIndex = Math.floor(((deg + 22.5) % 360) / 45);
                        setHudLocation(prev => ({
                          ...prev,
                          headingAngle: deg,
                          heading: headingsList[hIndex] || "N"
                        }));
                      }}
                      className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5] disabled:opacity-30"
                    />
                  </div>

                  {/* Waypoint Simulator inside Compass */}
                  <div className="space-y-2.5 bg-zinc-900/20 p-2 rounded border border-zinc-900 mt-2">
                    <div className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase flex items-center justify-between">
                      <span>Waypoint Simulation</span>
                      <button
                        onClick={() => {
                          const isActive = hudLocation.distance <= 0;
                          setHudLocation(prev => ({
                            ...prev,
                            distance: isActive ? 1.5 : -1,
                            waypointAngle: isActive ? 120 : null
                          }));
                        }}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${hudLocation.distance > 0 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                      >
                        {hudLocation.distance > 0 ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {hudLocation.distance > 0 && (
                      <>
                        {/* Waypoint Angle */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px]">
                            <span>Waypoint Angle</span>
                            <span className="text-zinc-200 font-bold">{hudLocation.waypointAngle}°</span>
                          </div>
                          <input
                            type="range" min="0" max="360" value={hudLocation.waypointAngle || 0}
                            onChange={(e) => {
                              const angle = Number(e.target.value);
                              setHudLocation(prev => ({
                                ...prev,
                                waypointAngle: angle
                              }));
                            }}
                            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
                          />
                        </div>

                        {/* Waypoint Distance */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px]">
                            <span>Waypoint Distance</span>
                            <span className="text-zinc-200 font-bold">{hudLocation.distance} mi</span>
                          </div>
                          <input
                            type="range" min="0.1" max="10.0" step="0.1" value={hudLocation.distance}
                            onChange={(e) => {
                              const dist = Number(e.target.value);
                              setHudLocation(prev => ({
                                ...prev,
                                distance: dist
                              }));
                            }}
                            className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-purple-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section: Voice indicator */}
                <div className="space-y-2 border-t border-zinc-900 pt-3">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Voice (Mic)</div>
                  <div className="flex items-center justify-between">
                    <span>Talking (Active)</span>
                    <button
                      onClick={() => setMicActive(p => !p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${micActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                    >
                      {micActive ? 'Speaking' : 'Silent'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Radio Active</span>
                    <button
                      onClick={() => setIsRadioTalking(p => !p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${isRadioTalking ? 'bg-[#00b7e5]/20 text-[#00b7e5] border border-[#00b7e5]/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                    >
                      {isRadioTalking ? 'Radio On' : 'Radio Off'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span>Voice Range</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setMicLevel(lvl)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${micLevel === lvl
                            ? 'bg-[#00b7e5] text-black font-black'
                            : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                            }`}
                        >
                          {lvl === 1 ? 'Whisper' : lvl === 2 ? 'Normal' : 'Shout'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Weapon HUD Simulator */}
                <div className="space-y-2 border-t border-zinc-900 pt-3">
                  <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase flex justify-between">
                    <span>Weapon HUD</span>
                    <button
                      onClick={() => setWeaponData(p => ({ ...p, visible: !p.visible }))}
                      className={`text-[8px] font-bold px-1.5 rounded cursor-pointer ${weaponData.visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}
                    >
                      {weaponData.visible ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  {weaponData.visible && (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Has Clip</span>
                        <button
                          onClick={() => setWeaponData(p => ({ ...p, hasClip: !p.hasClip }))}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer ${weaponData.hasClip ? 'bg-[#00b7e5]/20 text-[#00b7e5] border border-[#00b7e5]/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
                        >
                          {weaponData.hasClip ? 'Yes' : 'No'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>Clip Ammo</span>
                          <span className="text-zinc-200 font-bold">{weaponData.clip}</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={weaponData.clip}
                          onChange={(e) => setWeaponData(p => ({ ...p, clip: Number(e.target.value) }))}
                          className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-[#00b7e5]"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>Reserve Ammo</span>
                          <span className="text-zinc-200 font-bold">{weaponData.ammo}</span>
                        </div>
                        <input
                          type="range" min="0" max="999" value={weaponData.ammo}
                          onChange={(e) => setWeaponData(p => ({ ...p, ammo: Number(e.target.value) }))}
                          className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-zinc-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Section: Indicators */}
                {isInVehicle && (
                  <div className="space-y-2 border-t border-zinc-900 pt-3">
                    <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Indicators</div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => updateIndicator('leftTurn', !vehicleData.indicators.leftTurn)}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.leftTurn ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        Left Signal
                      </button>
                      <button
                        onClick={() => {
                          const state = !vehicleData.indicators.hazards;
                          setVehicleData(prev => ({
                            ...prev,
                            indicators: {
                              ...prev.indicators,
                              hazards: state,
                              leftTurn: state,
                              rightTurn: state
                            }
                          }));
                        }}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.hazards ? 'bg-amber-600/30 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        Hazards
                      </button>
                      <button
                        onClick={() => updateIndicator('rightTurn', !vehicleData.indicators.rightTurn)}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.rightTurn ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        Right Signal
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => updateIndicator('lowBeam', !vehicleData.indicators.lowBeam)}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.lowBeam ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        Low Beam
                      </button>
                      <button
                        onClick={() => updateIndicator('highBeam', !vehicleData.indicators.highBeam)}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.highBeam ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        High Beam
                      </button>
                      <button
                        onClick={() => updateIndicator('handbrake', !vehicleData.indicators.handbrake)}
                        className={`py-0.5 text-[9px] font-bold rounded border cursor-pointer ${vehicleData.indicators.handbrake ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        Handbrake
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components for Settings
const CustomSwitch = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative w-8 h-4 rounded-full transition-colors duration-300 cursor-pointer outline-none ${active ? 'bg-[#00b7e5]' : 'bg-zinc-800'}`}
  >
    <div
      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

const NumberInput = ({ value, onChange, min = 0, max = 100 }: { value: number; onChange: (val: number) => void; min?: number; max?: number }) => (
  <div className="flex items-center bg-zinc-950/90 border border-white/5 rounded px-2 py-0.5 w-16">
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        let val = Number(e.target.value);
        if (val < min) val = min;
        if (val > max) val = max;
        onChange(val);
      }}
      className="w-full bg-transparent border-none text-white text-[10px] font-bold text-center focus:outline-none tabular-nums"
    />
    <span className="text-[8px] text-zinc-500 font-bold ml-0.5">%</span>
  </div>
);

const CustomDropdown = ({ value, options, onChange }: { value: number; options: number[]; onChange: (val: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative w-[85px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950/90 border border-white/5 rounded px-2.5 py-1 text-[10px] font-bold text-white flex items-center justify-between cursor-pointer focus:outline-none select-none text-left"
      >
        <span>{value} FPS</span>
        <span className="text-[7px] opacity-60 ml-1">▼</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-full bg-zinc-950 border border-white/10 rounded shadow-2xl z-[1001] overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 text-[10px] font-bold hover:bg-white/5 cursor-pointer block transition-colors ${value === opt ? 'text-[#00b7e5] bg-white/[0.02]' : 'text-zinc-400'}`}
              >
                {opt} FPS
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
