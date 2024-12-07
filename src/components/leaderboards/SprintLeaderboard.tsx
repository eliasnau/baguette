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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-[1800px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 border-b-2 border-gray-200">
            <TableHead className="py-6 text-2xl font-bold text-gray-800 pl-8 w-32">Rang</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Sportler</TableHead>
            <TableHead className="py-6 text-2xl font-bold text-gray-800 w-48">Sprint Zeit</TableHead>
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
                  {competitor.sprint_time?.toFixed(2)}
                  <span className="text-2xl ml-1">s</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {competitors
            .filter(c => c.sprint_time === null)
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
                Noch keine Sprint Versuche
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}