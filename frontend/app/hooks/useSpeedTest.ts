"use client";

import { useState, useCallback, useRef } from "react";

export type TestPhase = "idle" | "ping" | "download" | "upload" | "complete";

export interface SpeedTestMetrics {
  latency: number | null; // ms
  jitter: number | null; // ms
  downloadSpeed: number | null; // Mbps
  uploadSpeed: number | null; // Mbps
  progress: number; // 0-100
}

export function useSpeedTest() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [metrics, setMetrics] = useState<SpeedTestMetrics>({
    latency: null,
    jitter: null,
    downloadSpeed: null,
    uploadSpeed: null,
    progress: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = () => {
    setPhase("idle");
    setMetrics({
      latency: null,
      jitter: null,
      downloadSpeed: null,
      uploadSpeed: null,
      progress: 0,
    });
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const runTest = useCallback(async () => {
    reset();
    setPhase("ping");
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // --- PING PHASE ---
      const pings: number[] = [];
      for (let i = 0; i < 10; i++) {
        if (signal.aborted) return;
        const start = performance.now();
        await fetch("http://localhost:8000/test/ping/", {
          cache: "no-store",
          signal,
        });
        const end = performance.now();
        pings.push(end - start);
        setMetrics((m) => ({ ...m, progress: 10 + (i / 10) * 10 })); // 10-20%
      }

      const avgLatency = pings.reduce((a, b) => a + b, 0) / pings.length;
      const variance =
        pings.reduce((a, b) => a + Math.pow(b - avgLatency, 2), 0) /
        pings.length;
      const jitter = Math.sqrt(variance);

      setMetrics((m) => ({
        ...m,
        latency: avgLatency,
        jitter: jitter,
        progress: 20,
      }));

      // --- DOWNLOAD PHASE ---
      setPhase("download");
      const downloadStart = performance.now();
      let loadedBytes = 0;
      const duration = 10000; // 10 seconds max or until size reached

      // Multiple streams to saturate link
      const streams = 3;
      const promises = Array.from({ length: streams }).map(async (_, i) => {
        const response = await fetch(
          `http://localhost:8000/test/download/?size=${10 * 1024 * 1024}`,
          {
            signal,
            cache: "no-store",
          }
        );
        if (!response.body) return;
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            loadedBytes += value.length;
            const now = performance.now();
            const elapsed = (now - downloadStart) / 1000;
            if (elapsed > 0) {
              const mbps = (loadedBytes * 8) / (elapsed * 1000000);
              setMetrics((m) => ({
                ...m,
                downloadSpeed: mbps,
                progress: 20 + Math.min(60, (elapsed / 5) * 60), // Animate progress roughly
              }));
            }
          }
        }
      });

      await Promise.all(promises);

      // Finalize download speed
      const downloadEnd = performance.now();
      const downloadSeconds = (downloadEnd - downloadStart) / 1000;
      const finalDownloadMbps =
        (loadedBytes * 8) / (downloadSeconds * 1000_000);
      setMetrics((m) => ({
        ...m,
        downloadSpeed: finalDownloadMbps,
        progress: 60,
      }));

      // --- UPLOAD PHASE ---
      setPhase("upload");
      const uploadStart = performance.now();
      // Generate 20MB of random data
      const uploadSize = 20 * 1024 * 1024;
      const blob = new Blob([
        new Uint8Array(uploadSize).map(() => Math.random() * 255),
      ]);

      // Use XMLHttpRequest for progress events if strictly needed, but fetch is cleaner
      // Fetch doesn't give upload progress easily in standard JS without streams,
      // but we can measure end-to-end.
      // For better progress, we could chunk it manually, but let's do a single burst for max throughput.

      await fetch("http://localhost:8000/test/upload/", {
        method: "POST",
        body: blob,
        signal,
        cache: "no-store",
      });

      const uploadEnd = performance.now();
      const uploadSeconds = (uploadEnd - uploadStart) / 1000;
      const finalUploadMbps = (uploadSize * 8) / (uploadSeconds * 1000_000);

      setMetrics((m) => ({
        ...m,
        uploadSpeed: finalUploadMbps,
        progress: 100,
      }));

      setPhase("complete");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Test aborted");
      } else {
        console.error("Speed test failed", error);
        setPhase("idle"); // or error state
      }
    }
  }, []);

  return { phase, metrics, runTest, reset };
}
