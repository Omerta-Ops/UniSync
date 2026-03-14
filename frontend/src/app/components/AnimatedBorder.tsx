import { motion } from 'motion/react';

export function AnimatedBorder() {
  return (
    <>
      {/* Main animated border */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        {/* Top border */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
            filter: 'blur(2px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Right border */}
        <motion.div
          className="absolute top-0 right-0 bottom-0 w-1"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
            filter: 'blur(2px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
          }}
          animate={{
            y: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.75,
          }}
        />

        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
            filter: 'blur(2px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
          }}
          animate={{
            x: ['200%', '-100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: 1.5,
          }}
        />

        {/* Left border */}
        <motion.div
          className="absolute top-0 left-0 bottom-0 w-1"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.8), transparent)',
            filter: 'blur(2px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
          }}
          animate={{
            y: ['200%', '-100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: 2.25,
          }}
        />

        {/* Static glow borders */}
        <div className="absolute inset-0">
          {/* Top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
            }}
          />
          
          {/* Right glow */}
          <div
            className="absolute top-0 right-0 bottom-0 w-[2px]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.2), transparent)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
            }}
          />
          
          {/* Bottom glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
            }}
          />
          
          {/* Left glow */}
          <div
            className="absolute top-0 left-0 bottom-0 w-[2px]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.2), transparent)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
            }}
          />
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]" style={{ filter: 'blur(1px)' }} />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]" style={{ filter: 'blur(1px)' }} />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]" style={{ filter: 'blur(1px)' }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]" style={{ filter: 'blur(1px)' }} />
      </div>
    </>
  );
}
