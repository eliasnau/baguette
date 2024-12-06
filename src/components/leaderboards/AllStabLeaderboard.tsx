// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  pole_vault_attempts: PoleVaultAttempt[] | null;
  climbing_time: number | null;
  sprint_time: number | null;
}

interface PoleVaultAttempt {
  height: number;
  successful: boolean;
}

interface CompetitorWithScores extends Competitor {
  bestHeight: number;
  totalScore: number;
}

export function AllStabLeaderboard() {
  const [competitors, setCompetitors] = useState<CompetitorWithScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();

    const intervalId = setInterval(() => {
        console.log('Interval-based refresh triggered');
        loadCompetitors();
      }, 2000)
  }, []);

  async function loadCompetitors() {
    try {
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      const stabCompetitors = (data.competitors as Competitor[])
        .filter(c => c.competition_type === 'Stab')
        .map(c => {
          const bestHeight = getBestHeight(c.pole_vault_attempts);
          return {
            ...c,
            bestHeight,
            totalScore: calculateTotalScore(bestHeight, c.climbing_time || 0, c.sprint_time || 0)
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore);
      setCompetitors(stabCompetitors);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getBestHeight(attempts: PoleVaultAttempt[] | null): number {
    if (!attempts || attempts.length === 0) return 0;
    const successfulAttempts = attempts.filter(a => a.successful);
    return successfulAttempts.length > 0
      ? Math.max(...successfulAttempts.map(a => a.height))
      : 0;
  }

  function calculateTotalScore(poleHeight: number, climbingTime: number, sprintTime: number): number {
    // Adjust scoring formula as needed
    // Higher pole vault is better, lower times are better
    return (poleHeight * 10) - climbingTime - sprintTime;
  }

  function getPoleVaultCell(attempts: PoleVaultAttempt[] | null, bestHeight: number): JSX.Element {
    if (!attempts || attempts.length === 0) {
      return (
        <div className="flex flex-col items-start">
          <div className="text-3xl font-bold text-blue-600">-</div>
          <div className="text-gray-400 text-lg mt-1">No attempts</div>
        </div>
      );
    }

    const bestHeightAttempts = attempts.filter(a => a.height === bestHeight);
    
    return (
      <div className="flex flex-col items-start">
        <div className="text-3xl font-bold text-blue-600">
          {bestHeight > 0 ? `${bestHeight.toFixed(2)}m` : '-'}
        </div>
        <div className="flex gap-1 mt-1">
          {bestHeightAttempts.map((attempt, index) => (
            <span
              key={index}
              className={`inline-flex items-center justify-center w-6 h-6 text-sm rounded-full 
                ${attempt.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {attempt.successful ? 'o' : 'x'}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">Stab Group Rankings 🏆</h2>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="py-6 text-2xl font-bold">Rank</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Athlete</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Pole Vault 🏃‍♂️</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Climbing 🧗</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Sprint 🏃</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor, index) => (
              <TableRow 
                key={competitor.id} 
                className={`
                  hover:bg-blue-50 transition-colors
                  ${index === 0 && competitor.totalScore > 0 ? 'bg-yellow-50' : ''}
                  ${index === 1 && competitor.totalScore > 0 ? 'bg-gray-50' : ''}
                  ${index === 2 && competitor.totalScore > 0 ? 'bg-orange-50' : ''}
                `}
              >
                <TableCell className="py-8 text-4xl font-bold pl-12">
                  <div className="flex items-center gap-4">
                    {competitor.totalScore > 0 && (
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
                  <div className="text-3xl font-semibold text-gray-800">{competitor.name}</div>
                </TableCell>
                <TableCell className="py-8">
                  {getPoleVaultCell(competitor.pole_vault_attempts, competitor.bestHeight)}
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-green-600">
                    {competitor.climbing_time ? `${competitor.climbing_time.toFixed(2)}s` : '-'}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-red-600">
                    {competitor.sprint_time ? `${competitor.sprint_time.toFixed(2)}s` : '-'}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-4xl font-bold text-purple-600">
                    {competitor.totalScore > 0 ? `${competitor.totalScore.toFixed(2)}` : '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {competitors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-2xl">
                  No competitors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 