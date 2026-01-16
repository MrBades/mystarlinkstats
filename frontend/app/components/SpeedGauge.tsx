"use client";

import { motion } from "framer-motion";

interface SpeedGaugeProps {
  value: number; // Mbps
  max?: number;
  label?: string;
  isTesting: boolean;
}

export function SpeedGauge({ value, max = 500, label = "DOWNLOAD", isTesting }: SpeedGaugeProps) {
  // Convert speed to logarithmic angle for better visualization at low/med speeds
  // 0 -> 0 deg, max -> 180 deg
  // Log scale: log(value+1) / log(max+1) * 180

  const angle = Math.min(180, (Math.log(value + 1) / Math.log(max + 1)) * 180);

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      {/* Gauge Background */}
      <div className="relative w-64 h-32 md:w-72 md:h-36 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Track */}
          <path
            d="M 10,100 A 90,90 0 0,1 190,100"
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress */}
          <motion.path
            d="M 10,100 A 90,90 0 0,1 190,100"
            fill="none"
            stroke="#3b82f6" // Starlink Blue
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="283" // approx length of semi-circle arc (PI * r) r=90 -> 282.7
            strokeDashoffset={283 - (angle / 180) * 283}
            initial={{ strokeDashoffset: 283 }}
            animate={{ strokeDashoffset: 283 - (angle / 180) * 283 }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className={isTesting ? "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : ""}
          />
        </svg>
      </div>

      {/* Value Display */}
      <div className="absolute top-28 flex flex-col items-center">
        <motion.div
          className="text-4xl md:text-6xl font-bold text-white tracking-tighter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {value.toFixed(1)}
        </motion.div>
        <div className="text-gray-400 text-sm font-medium mt-1">Mbps</div>
        {label && <div className="text-cyan-400 text-xs font-bold mt-2 tracking-widest uppercase">{label}</div>}
      </div>
    </div>
  );
}
