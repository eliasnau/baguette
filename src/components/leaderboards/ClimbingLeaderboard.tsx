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
    
    // Add refresh event listener
    const unsubscribe = listen('refresh-data', () => {
      loadCompetitors();
    });

    // Add interval to refresh every 2 seconds
    const intervalId = setInterval(() => {
      loadCompetitors();
    }, 2000);

    return () => {
      unsubscribe.then(fn => fn());
      clearInterval(intervalId);
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-[1800px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 border-b-2 border-gray-200">
            <TableHead className="py-6 text-2xl font-bold text-gray-800 pl-8 w-32">Rang</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Sportler</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Kletterzeit</TableHead>
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
                <div className="text-2xl font-semibold text-gray-800">{competitor.name}</div>
              </TableCell>
              <TableCell className="py-8">
                <div className="text-3xl font-bold text-blue-600">
                  {competitor.climbing_time?.toFixed(2)}
                  <span className="text-2xl ml-1">s</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {competitors
            .filter(c => c.climbing_time === null)
            .map((competitor) => (
              <TableRow key={competitor.id} className="hover:bg-blue-50 transition-colors">
                <TableCell className="py-8 text-3xl font-bold pl-8">
                  <div className="text-gray-400">-</div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-2xl font-semibold text-gray-800">{competitor.name}</div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-2xl font-bold text-gray-500 italic">
                    Noch kein Versuch
                  </div>
                </TableCell>
              </TableRow>
            ))}
          {rankings.length === 0 && competitors.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-gray-500 italic text-2xl">
                Noch keine Kletterversuche
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}