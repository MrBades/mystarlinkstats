"use client";

import { useSpeedTest } from "@/app/hooks/useSpeedTest";
import { SpeedGauge } from "@/app/components/SpeedGauge";
import { StarlinkBadge } from "@/app/components/StarlinkBadge";
import { ResultsCard } from "@/app/components/ResultsCard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { phase, metrics, runTest, reset } = useSpeedTest();

  // Determine which speed to show on the main gauge
  const currentSpeed =
    phase === 'download' ? (metrics.downloadSpeed || 0) :
      phase === 'upload' ? (metrics.uploadSpeed || 0) :
        (metrics.downloadSpeed || 0);

  const gaugeLabel =
    phase === 'download' ? 'Downloading' :
      phase === 'upload' ? 'Uploading' :
        phase === 'ping' ? 'Initializing' :
          phase === 'complete' ? 'COMPLETE' : 'IDLE';

  return (
    <main className="min-h-screen bg-[#0B0E11] text-white flex flex-col font-sans selection:bg-cyan-900 selection:text-white pb-10 overflow-x-hidden">

      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-400"></div>
          <span className="font-bold text-xl tracking-tighter">DIAGNOSTICS</span>
        </div>
        <StarlinkBadge />
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center relative">

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#005288] rounded-full blur-[120px] opacity-10"></div>
        </div>

        {/* Speed Gauge - Always Visible but animated */}
        <div className="relative z-10 mb-12">
          <SpeedGauge
            value={currentSpeed}
            label={gaugeLabel}
            isTesting={phase !== 'idle' && phase !== 'complete'}
          />
        </div>

        {/* Start Button Overlay */}
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runTest}
              className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 md:mt-32
                               px-8 py-3 md:px-12 md:py-4 bg-transparent border-2 border-white rounded-full 
                               text-white text-sm md:text-base font-bold tracking-widest hover:bg-white hover:text-black transition-colors whitespace-nowrap"
            >
              START TEST
            </motion.button>
          )}

          {phase === 'complete' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              onClick={runTest}
              className="mt-8 px-8 py-3 bg-[#151921] border border-gray-700 rounded-full 
                               text-gray-300 font-medium hover:border-white transition-colors"
            >
              RESTART
            </motion.button>
          )}
        </AnimatePresence>

      </div>

      {/* Footer / Stats Grid */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <ResultsCard
          label="Ping"
          value={metrics.latency ? Math.round(metrics.latency).toString() : "--"}
          unit="ms"
          icon="ping"
          subValue={metrics.jitter ? `±${Math.round(metrics.jitter)} ms` : "Measuring..."}
        />
        <ResultsCard
          label="Download"
          value={metrics.downloadSpeed ? metrics.downloadSpeed.toFixed(0) : "--"}
          unit="Mbps"
          icon="download"
        />
        <ResultsCard
          label="Upload"
          value={metrics.uploadSpeed ? metrics.uploadSpeed.toFixed(0) : "--"}
          unit="Mbps"
          icon="upload"
        />
        {/* Loss mock field or derived */}
        <ResultsCard
          label="Packet Loss"
          value="0"
          unit="%"
          subValue="Est. Ideal"
        />
      </div>
    </main>
  );
}
