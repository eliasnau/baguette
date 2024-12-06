// @ts-nocheck
"use client";
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';

interface Competitor {
  id: string;
  name: string;
  pole_vault_attempts: PoleVaultAttempt[] | null;
}

interface PoleVaultAttempt {
  height: number;
  successful: boolean;
}

interface AttemptResult {
  name: string;
  height: number;
}

interface ShowPoleVaultPayload {
    competitorId: string;
    height: number;
  }

export function PoleVaultDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [currentHeight, setCurrentHeight] = useState<number>(0);
  const [result, setResult] = useState<'success' | 'failure' | null>(null);

  useEffect(() => {
    const showUnlisten = listen('show-pole-vault', async (event) => {
      const { competitorId, height } = event.payload as ShowPoleVaultPayload;
      setCurrentHeight(height);
      const data = await invoke('get_competition_data');
      const found = (data.competitors as Competitor[]).find(c => c.id === competitorId);
      if (found) {
        setCompetitor(found);
        const attempts = found.pole_vault_attempts || [];
        const lastAttempt = attempts[attempts.length - 1];
        setIsVisible(true);
        setResult(null);
      }
    });

    const hideUnlisten = listen('hide-pole-vault', () => {
      setIsVisible(false);
      setCompetitor(null);
      setResult(null);
    });

    const successUnlisten = listen('pole-vault-success', (event) => {
      const data = event.payload as AttemptResult;
      setResult('success');
    });

    const failureUnlisten = listen('pole-vault-failure', (event) => {
      const data = event.payload as AttemptResult;
      setResult('failure');
    });

    const refreshUnlisten = listen('refresh-data', () => {
    });

    return () => {
      showUnlisten.then(fn => fn());
      hideUnlisten.then(fn => fn());
      successUnlisten.then(fn => fn());
      failureUnlisten.then(fn => fn());
    };
  }, []);

  function getAttemptStats(attempts: PoleVaultAttempt[] | null) {
    if (!attempts) return { bestHeight: 0, successRate: 0, totalAttempts: 0 };
    
    const successful = attempts.filter(a => a.successful);
    const bestHeight = successful.length > 0 
      ? Math.max(...successful.map(a => a.height))
      : 0;
    const successRate = attempts.length > 0 
      ? (successful.length / attempts.length * 100).toFixed(1)
      : 0;

    return {
      bestHeight,
      successRate,
      totalAttempts: attempts.length
    };
  }

  function getHeightProgression(attempts: PoleVaultAttempt[] | null): { height: number, attempts: PoleVaultAttempt[] }[] {
    if (!attempts) return [];
    
    const heightMap = new Map<number, PoleVaultAttempt[]>();
    attempts.forEach(attempt => {
      if (!heightMap.has(attempt.height)) {
        heightMap.set(attempt.height, []);
      }
      heightMap.get(attempt.height)?.push(attempt);
    });

    return Array.from(heightMap.entries())
      .map(([height, attempts]) => ({ height, attempts }))
      .sort((a, b) => b.height - a.height)
      .slice(0, 3);
  }

  if (!isVisible || !competitor) return null;

  const stats = getAttemptStats(competitor.pole_vault_attempts);
  const progression = getHeightProgression(competitor.pole_vault_attempts);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className={`
          bg-gradient-to-b from-blue-900 to-black p-12 rounded-3xl shadow-2xl max-w-5xl w-full mx-4
          ${result === 'success' ? 'ring-8 ring-green-500' : ''}
          ${result === 'failure' ? 'ring-8 ring-red-500' : ''}
        `}>
          <div className="text-center mb-12">
            <h2 className="text-7xl font-bold text-white mb-4">{competitor.name}</h2>
            <div className="text-9xl font-bold text-yellow-400 mb-2">
              {currentHeight.toFixed(2)}m
            </div>
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

          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {stats.bestHeight.toFixed(2)}m
              </div>
              <div className="text-xl text-gray-300">Personal Best</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.successRate}%
              </div>
              <div className="text-xl text-gray-300">Erfolgsquote</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {stats.totalAttempts}
              </div>
              <div className="text-xl text-gray-300">Gesamtzahl der Versuche </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-300 mb-4">Vorherige Höhen</h3>
            {progression.map(({ height, attempts }, index) => (
              <div 
                key={height}
                className={`
                  p-4 rounded-lg flex items-center justify-between
                  ${height === currentHeight ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-white/10'}
                  ${index === 0 ? 'scale-105' : ''}
                `}
              >
                <span className="text-2xl font-bold text-white">{height.toFixed(2)}m</span>
                <div className="flex gap-2">
                  {attempts.map((attempt, idx) => (
                    <span
                      key={idx}
                      className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold
                        ${attempt.successful 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                        }
                      `}
                    >
                      {attempt.successful ? 'O' : 'X'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 