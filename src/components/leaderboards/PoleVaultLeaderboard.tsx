// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  pole_vault_attempts: PoleVaultAttempt[] | null;
}

interface PoleVaultAttempt {
  height: number;
  successful: boolean;
}

const attemptStyles = {
  success: "bg-green-100 text-green-700 border-2 border-green-300 shadow-md hover:bg-green-200 hover:shadow-lg",
  failure: "bg-red-100 text-red-700 border-2 border-red-300 shadow-md hover:bg-red-200 hover:shadow-lg",
  noAttempts: "bg-gray-100 text-gray-600 border-2 border-gray-300 shadow-md",
  failedAll: "bg-red-50 text-red-600 border-2 border-red-200 shadow-md"
};

export function PoleVaultLeaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCompetitors();
    
    // Add refresh event listener
    const unsubscribe = listen('refresh-data', () => {
      loadCompetitors();
    });

    // Add interval to refresh every 2 seconds
    const intervalId = setInterval(() => {
      console.log('Interval-based refresh triggered');
      loadCompetitors();
    }, 2000);

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, []);

  async function loadCompetitors() {
    try {
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors);
    } catch (error) {	
      console.error('Failed to load competitors:', error);
    }
  }

  function getPoleVaultRanking() {
    return competitors.map(competitor => {
      const attempts = competitor.pole_vault_attempts;
      if (!attempts || attempts.length === 0) {
        return {
          ...competitor,
          highestHeight: 0,
          totalAttempts: 0,
          attemptSequence: '',
          status: 'No attempts yet'
        };
      }

      const successfulAttempts = attempts.filter(a => a.successful);
      const highestHeight = successfulAttempts.length > 0
        ? Math.max(...successfulAttempts.map(a => a.height))
        : 0;
      const bestHeightAttempts = attempts.filter(a => a.height === highestHeight) || [];
      const attemptSequence = bestHeightAttempts.map(a => (a.successful ? 'o' : 'x')).join(' ');
      
      return {
        ...competitor,
        highestHeight,
        totalAttempts: attempts.length,
        attemptSequence,
        status: highestHeight === 0 ? 'Failed all attempts' : ''
      };
    }).sort((a, b) => {
      if (b.highestHeight !== a.highestHeight) {
        return b.highestHeight - a.highestHeight;
      }
      return a.totalAttempts - b.totalAttempts;
    });
  }

  const rankings = getPoleVaultRanking();

  function getOrdinalSuffix(i: number): string {
    const j = i % 10,
          k = i % 100;
    if (j == 1 && k != 11) {
      return "st";
    }
    if (j == 2 && k != 12) {
      return "nd";
    }
    if (j == 3 && k != 13) {
      return "rd";
    }
    return "th";
  }

  function getPerformanceSummary(attempts: PoleVaultAttempt[] | null) {
    if (!attempts || attempts.length === 0) return null;
    
    const heights = [...new Set(attempts.map(a => a.height))].sort((a, b) => a - b);
    return heights.map(height => {
      const attemptsAtHeight = attempts.filter(a => a.height === height);
      const successCount = attemptsAtHeight.filter(a => a.successful).length;
      return {
        height,
        success: successCount > 0,
        attempts: attemptsAtHeight.length
      };
    });
  }

  function getSuccessRate(attempts: PoleVaultAttempt[] | null) {
    if (!attempts || attempts.length === 0) return null;
    
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(a => a.successful).length;
    const rate = (successfulAttempts / totalAttempts) * 100;
        
        return {
        rate: rate.toFixed(0),
      successful: successfulAttempts,
      total: totalAttempts
    };
  }

  function getPersonalBest(attempts: PoleVaultAttempt[] | null) {
    if (!attempts || attempts.length === 0) return null;
    
    const successfulAttempts = attempts.filter(a => a.successful);
    if (successfulAttempts.length === 0) return null;

    const bestHeight = Math.max(...successfulAttempts.map(a => a.height));
    return bestHeight.toFixed(2);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-[1800px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 border-b-2 border-gray-200">
            <TableHead className="py-6 text-2xl font-bold text-gray-800 pl-8 w-32">Rank</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Athlete</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Best Height</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-96">
              <div className="flex flex-col">
                <span>Attempts at Best Height</span>
                <span className="text-lg font-normal text-gray-600 mt-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 border border-green-300 mr-2">o</span>
                  Success
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 border border-red-300 ml-4 mr-2">x</span>
                  Failure
                </span>
              </div>
            </TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-96">Performance Trend</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Success Rate</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Personal Best</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((competitor, index) => {
            const performanceSummary = getPerformanceSummary(competitor.pole_vault_attempts);
            const successRate = getSuccessRate(competitor.pole_vault_attempts);
            const personalBest = getPersonalBest(competitor.pole_vault_attempts);
            
            return (
              <TableRow 
                key={competitor.id} 
                className={`
                  hover:bg-blue-50 transition-colors
                  ${index === 0 && competitor.highestHeight > 0 ? 'bg-yellow-50' : ''}
                  ${index === 1 && competitor.highestHeight > 0 ? 'bg-gray-50' : ''}
                  ${index === 2 && competitor.highestHeight > 0 ? 'bg-orange-50' : ''}
                `}
              >
                <TableCell className="py-8 text-3xl font-bold pl-8">
                  <div className="flex items-center gap-3">
                    {competitor.highestHeight > 0 && (
                      <>
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                      </>
                    )}
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-2xl font-semibold text-gray-800">{competitor.name}</div>
                </TableCell>
                <TableCell className="py-8">
                  {competitor.highestHeight > 0 ? (
                    <div className="text-3xl font-bold text-blue-600">
                      {competitor.highestHeight.toFixed(2)}
                      <span className="text-2xl ml-1">m</span>
                    </div>
                  ) : (
                    <div className={`text-2xl font-bold ${competitor.status === 'Failed all attempts' ? 'text-red-600' : 'text-gray-500'} italic`}>
                      {competitor.status}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-8">
                  <div className="flex gap-3 items-center min-h-[4rem]">
                    {competitor.attemptSequence ? (
                      competitor.totalAttempts > 0 ? (
                        competitor.attemptSequence.split(' ').map((attempt, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <span 
                              className={`
                                inline-flex items-center justify-center w-16 h-16 rounded-full 
                                text-3xl font-bold transition-all duration-200
                                ${attempt === 'o' ? attemptStyles.success : attemptStyles.failure}
                              `}
                            >
                              {attempt}
                            </span>
                            <span className="text-sm text-gray-500 mt-1">#{i + 1}</span>
                          </div>
                        ))
                      ) : (
                        <span className={`inline-flex items-center justify-center h-16 px-8 rounded-full text-2xl font-bold transition-all duration-200 ${attemptStyles.noAttempts}`}>
                          No Attempts
                        </span>
                      )
                    ) : (
                      <span className={`inline-flex items-center justify-center h-16 px-8 rounded-full text-2xl font-bold transition-all duration-200 ${attemptStyles.failedAll}`}>
                        Failed All
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  {performanceSummary ? (
                    <div className="flex items-center gap-2">
                      {performanceSummary.map((perf, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`
                            px-3 py-1 rounded-md text-sm font-medium
                            ${perf.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          `}>
                            {perf.height.toFixed(2)}m
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {perf.attempts} {perf.attempts === 1 ? 'try' : 'tries'}
                          </div>
                          {i < performanceSummary.length - 1 && (
                            <div className="text-gray-400 text-lg mx-1">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No attempts yet</div>
                  )}
                </TableCell>
                <TableCell className="py-8">
                  {successRate ? (
                    <div className="flex flex-col items-center">
                      <div className={`
                        text-3xl font-bold mb-1
                        ${Number(successRate.rate) >= 70 ? 'text-green-600' : 
                          Number(successRate.rate) >= 50 ? 'text-blue-600' : 
                          Number(successRate.rate) >= 30 ? 'text-orange-600' : 'text-red-600'}
                      `}>
                        {successRate.rate}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {successRate.successful} of {successRate.total} attempts
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className={`
                            h-full rounded-full
                            ${Number(successRate.rate) >= 70 ? 'bg-green-500' : 
                              Number(successRate.rate) >= 50 ? 'bg-blue-500' : 
                              Number(successRate.rate) >= 30 ? 'bg-orange-500' : 'bg-red-500'}
                          `}
                          style={{ width: `${successRate.rate}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No attempts yet</div>
                  )}
                </TableCell>
                <TableCell className="py-8">
                  {personalBest ? (
                    <div className="text-3xl font-bold text-blue-600">
                      {personalBest}m
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No successful jumps</div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {rankings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500 italic">
                No pole vault attempts recorded yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}