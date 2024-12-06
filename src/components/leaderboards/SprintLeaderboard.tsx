// @ts-nocheck

"use client";
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  sprint_time: number | null;
}

export function SprintLeaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    loadCompetitors();
    
    // Add refresh event listener
    const unsubscribe = listen('refresh-data', () => {
      loadCompetitors();
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, []);

  async function loadCompetitors() {
    try {
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors.filter(c => c.competition_type === 'Stab'));
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  }

  function getSprintRanking() {
    return competitors
      .filter(competitor => typeof competitor.sprint_time === 'number')
      .sort((a, b) => {
        if (a.sprint_time === null || b.sprint_time === null) return 0;
        return a.sprint_time - b.sprint_time;  // Sort by fastest time (ascending)
      });
  }

  const rankings = getSprintRanking();

  return (
    <div className="p-12 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Sprint Leaderboard 🏃</h1>
        <p className="text-gray-600 mt-2">Rankings based on fastest sprint times (Stab)</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="py-6 text-2xl font-bold">Rank</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Athlete</TableHead>
              <TableHead className="py-6 text-2xl font-bold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((competitor, index) => (
              <TableRow key={competitor.id} className="hover:bg-gray-50">
                <TableCell className="py-8">
                  <div className="text-4xl font-bold text-gray-800">#{index + 1}</div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-gray-700">{competitor.name}</div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-3xl font-bold text-blue-600">
                    {competitor.sprint_time?.toFixed(2)}s
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rankings.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-2xl">
                  No sprint times recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 