// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  kugel_attempts: KugelAttempt[] | null;
}

interface KugelAttempt {
  distance: number;
}

export function KugelLeaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();

    const unsubscribe = listen('refresh-data', () => {
        console.log('Event-based refresh triggered');
        loadCompetitors();
      });
  
      // Add interval to refresh every 2 seconds
      const intervalId = setInterval(() => {
        console.log('Interval-based refresh triggered');
        loadCompetitors();
      }, 2000);
  }, []);

  async function loadCompetitors() {
    try {
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      const wurfCompetitors = (data.competitors as Competitor[])
        .filter(c => c.competition_type === 'Wurf')
        .map(c => ({
          ...c,
          bestDistance: getBestAttempt(c.kugel_attempts)
        }))
        .sort((a, b) => b.bestDistance - a.bestDistance);
      setCompetitors(wurfCompetitors);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getBestAttempt(attempts: KugelAttempt[] | null): number {
    if (!attempts || attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.distance));
  }

  function getAttemptCircles(attempts: KugelAttempt[] | null): JSX.Element {
    if (!attempts || attempts.length === 0) {
      return <span className="text-gray-500 text-xl">Noch keine Versuche</span>;
    }

    return (
      <div className="flex gap-3 items-center justify-start">
        {attempts.map((attempt, index) => (
          <div
            key={index}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-800 font-semibold shadow-sm hover:shadow-md transition-shadow"
            title={`Attempt ${index + 1}: ${attempt.distance.toFixed(2)}m`}
          >
            <div className="text-center">
              <span className="text-xl">{attempt.distance.toFixed(1)}</span>
              <span className="text-sm">m</span>
            </div>
          </div>
        ))}
        {Array.from({ length: 3 - attempts.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 font-semibold text-2xl"
          >
            -
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">Lädt...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">Kugelstoßen Ergebnisse 🏋️</h2>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="py-6 text-2xl font-bold">Rang</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Sportler</TableHead>
              <TableHead className="py-6 text-2xl font-bold">bester Versuch</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Versuche</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor, index) => (
              <TableRow 
                key={competitor.id} 
                className={`
                  hover:bg-blue-50 transition-colors
                  ${index === 0 && competitor.bestDistance > 0 ? 'bg-yellow-50' : ''}
                  ${index === 1 && competitor.bestDistance > 0 ? 'bg-gray-50' : ''}
                  ${index === 2 && competitor.bestDistance > 0 ? 'bg-orange-50' : ''}
                `}
              >
                <TableCell className="py-8 text-4xl font-bold pl-12">
                  <div className="flex items-center gap-4">
                    {competitor.bestDistance > 0 && (
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
                    {competitor.bestDistance > 0 ? `${competitor.bestDistance.toFixed(2)}m` : '-'}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  {getAttemptCircles(competitor.kugel_attempts)}
                </TableCell>
              </TableRow>
            ))}
            {competitors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500 text-2xl">
                  Keine Teilnehmer gefunden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 