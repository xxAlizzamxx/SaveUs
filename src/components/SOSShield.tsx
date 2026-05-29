import { motion } from 'framer-motion';

interface SOSShieldProps {
  onClick: () => void;
  isActive?: boolean;
}

const SHIELD_PATH =
  'M50 2 L93 20 C95 21 96 23 96 25 L96 52 C96 72 80 90 50 98 C20 90 4 72 4 52 L4 25 C4 23 5 21 7 20 Z';

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  angle: (360 / 10) * i,
  delay: i * 0.18,
  size: 2 + (i % 3),
  radius: 105 + (i % 2) * 12,
}));

const WAVE_RINGS = [0, 1, 2, 3];

export function SOSShield({ onClick, isActive }: SOSShieldProps) {
  return (
    <motion.button
      className="sos-shield-btn"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
    >
      <div className="sos-shield-wrap">
        {/* Ondas de protección expansivas */}
        {WAVE_RINGS.map((i) => (
          <motion.div
            key={i}
            className="shield-wave"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: [0.8, 1.6], opacity: [0.5, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Resplandor de fondo */}
        <div className={`shield-glow ${isActive ? 'shield-glow--active' : ''}`} />

        {/* SVG del escudo principal */}
        <svg
          className="sos-shield-svg"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
            </linearGradient>
            <filter id="shieldShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#dc2626" floodOpacity="0.5" />
            </filter>
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sombra exterior del escudo */}
          <path d={SHIELD_PATH} fill="url(#shieldGrad)" filter="url(#shieldShadow)" />

          {/* Cuerpo principal */}
          <path d={SHIELD_PATH} fill="url(#shieldGrad)" />

          {/* Borde brillante */}
          <path
            d={SHIELD_PATH}
            fill="none"
            stroke="url(#shieldStroke)"
            strokeWidth="1.5"
          />

          {/* Línea interior decorativa */}
          <path
            d="M50 10 L85 25 C86 25.5 87 27 87 28 L87 52 C87 68 74 83 50 90 C26 83 13 68 13 52 L13 28 C13 27 14 25.5 15 25 Z"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
          />

          {/* Reflejo de luz superior */}
          <ellipse
            cx="42"
            cy="30"
            rx="18"
            ry="10"
            fill="rgba(255,255,255,0.08)"
          />
        </svg>

        {/* Texto SOS sobre el escudo */}
        <span className="sos-shield-text">SOS</span>

        {/* Partículas orbitando */}
        <div className="shield-particles">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="shield-particle-orbit"
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 8 + p.id * 0.3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                inset: 0,
              }}
            >
              <motion.span
                className="shield-particle"
                style={{
                  width: p.size,
                  height: p.size,
                  position: 'absolute',
                  top: `calc(50% - ${p.radius}px)`,
                  left: `calc(50% - ${p.size / 2}px)`,
                  transformOrigin: `${p.size / 2}px ${p.radius}px`,
                  transform: `rotate(${p.angle}deg)`,
                }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: p.delay,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Efecto de escaneo */}
        <motion.div
          className="shield-scan"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.button>
  );
}
