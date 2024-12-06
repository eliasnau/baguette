// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  kugel_attempts: KugelAttempt[] | null;
  sprint_5jump: JumpAttempt[] | null;
  wsprint_time: number | null;
}

interface KugelAttempt {
  distance: number;
}

interface JumpAttempt {
  distance: number;
}

interface CompetitorWithScores extends Competitor {
  bestKugel: number;
  best5Jump: number;
  totalScore: number;
}

export function AllWurfLeaderboard() {
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
      const wurfCompetitors = (data.competitors as Competitor[])
        .filter(c => c.competition_type === 'Wurf')
        .map(c => {
          const bestKugel = getBestAttempt(c.kugel_attempts);
          const best5Jump = getBestAttempt(c.sprint_5jump);
          const wsprintTime = c.wsprint_time || 0;
          return {
            ...c,
            bestKugel,
            best5Jump,
            totalScore: calculateTotalScore(bestKugel, best5Jump, wsprintTime)
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore);
      setCompetitors(wurfCompetitors);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getBestAttempt(attempts: any[] | null): number {
    if (!attempts || attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.distance));
  }

  function calculateTotalScore(kugelDistance: number, jumpDistance: number, wsprintTime: number): number {
    // Adjust the scoring formula as needed
    return (kugelDistance * 1.3) + (jumpDistance / 2) - wsprintTime;
  }

  if (isLoading) {
    return <div className="text-center p-4">Lädt...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">Rangliste der Wurf-Gruppe  🏆</h2>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="py-6 text-2xl font-bold">Rang</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Sportler</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Kugelstoßen 🏋️</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Froschspringen 🦘</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Sprint 🏃</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Ergebnisse</TableHead>
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
                  <div className="text-3xl font-bold text-blue-600">
                    {competitor.bestKugel > 0 ? `${competitor.bestKugel.toFixed(2)}m` : '-'}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-green-600">
                    {competitor.best5Jump > 0 ? `${competitor.best5Jump.toFixed(2)}m` : '-'}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-red-600">
                    {competitor.wsprint_time ? `${competitor.wsprint_time.toFixed(2)}s` : '-'}
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
                 Keine Sportler gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 