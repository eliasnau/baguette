"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Competitor {
  id: string;
  name: string;
  pole_vault_attempts: PoleVaultAttempt[] | null;
  sprint_time: number | null;
  seilsprung_count: number | null;
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

export default function Leaderboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('pole');

  useEffect(() => {
    loadCompetitors();
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

  function getAllEventsRanking() {
    // Implement logic to rank based on all events
    return competitors; // Placeholder
  }

  const rankings = selectedEvent === 'pole' ? getPoleVaultRanking() : getAllEventsRanking();

  return (
    <div className="p-12 max-w-full mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-12 bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-5xl font-bold text-gray-800">Competition Leaderboard</h1>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-64 h-12 text-xl">
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pole" className="text-xl py-3">Pole Vault</SelectItem>
            <SelectItem value="all" className="text-xl py-3">All Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 border-b-2 border-gray-200">
              <TableHead className="py-6 text-2xl font-bold text-gray-800 pl-8">Rank</TableHead>
              <TableHead className="py-6 text-2xl font-bold text-gray-800">Athlete</TableHead>
              <TableHead className="py-6 text-2xl font-bold text-gray-800">Best Height</TableHead>
              <TableHead className="py-6 text-2xl font-bold text-gray-800">
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
              <TableHead className="py-6 text-2xl font-bold text-gray-800">Total Attempts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((competitor, index) => (
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
                      {competitor.highestHeight}
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
                        <span 
                          className={`
                            inline-flex items-center justify-center h-16 px-8
                            rounded-full text-2xl font-bold transition-all duration-200
                            ${attemptStyles.noAttempts}
                          `}
                        >
                          No Attempts
                        </span>
                      )
                    ) : (
                      <span 
                        className={`
                          inline-flex items-center justify-center h-16 px-8
                          rounded-full text-2xl font-bold transition-all duration-200
                          ${attemptStyles.failedAll}
                        `}
                      >
                        Failed All
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-8">
                  <div className="text-2xl text-gray-600">
                    {competitor.totalAttempts > 0 ? (
                      <>
                        {competitor.totalAttempts}
                        <span className="text-xl ml-2">total</span>
                      </>
                    ) : (
                      <span className="text-xl text-gray-500 italic">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 