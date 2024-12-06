// @ts-nocheck

"use client";
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  climbing_time: number | null;
}

export function ClimbingLeaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    loadCompetitors();
    console.log('Initial load triggered');
    
    // Add refresh event listener 
    const unsubscribe = listen('refresh-data', () => {
      console.log('Event-based refresh triggered');
      loadCompetitors();
    });

    // Add interval to refresh every 2 seconds
    const intervalId = setInterval(() => {
      console.log('Interval-based refresh triggered');
      loadCompetitors();
    }, 2000);

    return () => {
      unsubscribe.then(fn => fn());
      clearInterval(intervalId);
    };
  }, []);

  async function loadCompetitors() {
    try {
      const data: { competitors: Competitor[] } = await invoke('get_competition_data');
      console.log('Received data:', data); // Debug log
      setCompetitors(prevCompetitors => {
        // Only update if data is different
        if (JSON.stringify(prevCompetitors) !== JSON.stringify(data.competitors)) {
          return data.competitors;
        }
        return prevCompetitors;
      });
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  }

  function getClimbingRanking() {
    return competitors
      .filter(competitor => typeof competitor.climbing_time === 'number')
      .sort((a, b) => {
        if (a.climbing_time === null || b.climbing_time === null) return 0;
        return a.climbing_time - b.climbing_time;  // Sort by fastest time (ascending)
      });
  }

  const rankings = getClimbingRanking();

  return (
    <div className="p-12 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Climbing Leaderboard 🧗</h1>
        <p className="text-gray-600 mt-2">Rankings based on fastest climbing times</p>
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
                    {competitor.climbing_time?.toFixed(2)}s
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rankings.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500 text-2xl">
                  No climbing times recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 