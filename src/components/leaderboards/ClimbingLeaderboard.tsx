"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Competitor {
  id: string;
  name: string;
  climbing_time: number | null | undefined;  // Changed from seilsprung_count
}

export function ClimbingLeaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCompetitors();
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  async function loadCompetitors() {
    try {
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    }
  }

  function getClimbingRanking() {
    return competitors
      .filter(competitor => typeof competitor.climbing_time === 'number')
      .sort((a, b) => {
        if (a.climbing_time === undefined || b.climbing_time === undefined) return 0;
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50">
              <TableHead className="font-semibold text-gray-700">Rank</TableHead>
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Time</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((competitor, index) => (
              <TableRow 
                key={competitor.id} 
                className={`
                  hover:bg-blue-50 transition-colors
                  ${index === 0 ? 'bg-yellow-50' : ''}
                  ${index === 1 ? 'bg-gray-50' : ''}
                  ${index === 2 ? 'bg-orange-50' : ''}
                `}
              >
                <TableCell className="py-8 text-3xl font-bold pl-8">
                  <div className="flex items-center gap-3">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-2xl font-semibold text-gray-800">
                    {competitor.name}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  {typeof competitor.climbing_time === 'number' ? (
                    <div className="text-3xl font-bold text-blue-600">
                      {competitor.climbing_time.toFixed(2)}
                      <span className="text-2xl ml-1">s</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-400 italic">
                      No time
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-8">
                  {typeof competitor.climbing_time === 'number' && (
                    <div className={`
                      inline-flex items-center px-4 py-2 rounded-full
                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${index === 1 ? 'bg-gray-100 text-gray-800' : ''}
                      ${index === 2 ? 'bg-orange-100 text-orange-800' : ''}
                      ${index > 2 ? 'bg-blue-100 text-blue-800' : ''}
                    `}>
                      {index === 0 && "Gold 🏆"}
                      {index === 1 && "Silver 🥈"}
                      {index === 2 && "Bronze 🥉"}
                      {index > 2 && `${index + 1}th Place`}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rankings.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500 italic">
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