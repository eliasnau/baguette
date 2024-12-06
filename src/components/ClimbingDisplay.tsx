"use client";
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';

interface Competitor {
  id: string;
  name: string;
  climbing_time: number | null;
}

interface AttemptResult {
  name: string;
  time: number;
}

export function ClimbingDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [result, setResult] = useState<'success' | 'failure' | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("DISPLAY: Setting up event listeners");
    
    const showUnlisten = listen('show-climbing', async (event) => {
      console.log("DISPLAY: Received show-climbing event", event);
      const competitorId = event.payload as string;
      try {
        const data: any = await invoke('get_competition_data');
        console.log("DISPLAY: Got competition data:", data);
        const found = data.competitors.find((c: Competitor) => c.id === competitorId);
        console.log("DISPLAY: Found competitor:", found);
        if (found) {
          setIsVisible(true);
          setCompetitor(found);
          setBestTime(found.climbing_time);
          setResult(null);
          setCurrentTime(null);
        }
      } catch (error) {
        console.error("DISPLAY: Error getting competitor data:", error);
      }
    });

    const hideUnlisten = listen('hide-climbing', () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setTimerValue(null);
      setIsVisible(false);
      setCompetitor(null);
      setResult(null);
      setCurrentTime(null);
    });

    const successUnlisten = listen('climbing-success', (event) => {
      const data = event.payload as AttemptResult;
      // Stop the timer if it's still running
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      // Set the final time
      setCurrentTime(data.time);
      setTimerValue(null);
      setResult('success');
    });

    const refreshUnlisten = listen('refresh-data', async () => {
      if (competitor) {
        const data: any = await invoke('get_competition_data');
        const found = data.competitors.find((c: Competitor) => c.id === competitor.id);
        if (found) {
          setCompetitor(found);
          setBestTime(found.climbing_time);
        }
      }
    });

    return () => {
      showUnlisten.then(fn => fn());
      hideUnlisten.then(fn => fn());
      successUnlisten.then(fn => fn());
      refreshUnlisten.then(fn => fn());
    };
  }, [competitor, timerInterval]);

  console.log("DISPLAY: Render with:", { isVisible, competitor, currentTime, result });

  if (!isVisible || !competitor) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className={`
          bg-gradient-to-b from-purple-900 to-black p-12 rounded-3xl shadow-2xl max-w-5xl w-full mx-4
          ${result === 'success' ? 'ring-8 ring-green-500' : ''}
          ${result === 'failure' ? 'ring-8 ring-red-500' : ''}
        `}>
          <div className="text-center mb-12">
            <h2 className="text-7xl font-bold text-white mb-4">{competitor.name}</h2>
            
            {timerValue !== null && !result && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-9xl font-bold text-yellow-400 mb-6 font-mono"
              >
                {timerValue.toFixed(2)}s
              </motion.div>
            )}
            
            {currentTime && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-9xl font-bold text-yellow-400 mb-6"
              >
                {currentTime.toFixed(2)}s
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-8xl font-bold ${
                  result === 'success' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {result === 'success' ? '✓' : '✗'}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {bestTime ? `${bestTime.toFixed(2)}s` : '-'}
              </div>
              <div className="text-xl text-gray-300">Previous Best</div>
            </div>
            {currentTime && bestTime && (
              <div className="bg-white/10 rounded-xl p-6 text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  currentTime < bestTime ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(currentTime - bestTime).toFixed(2)}s
                </div>
                <div className="text-xl text-gray-300">vs Previous</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 