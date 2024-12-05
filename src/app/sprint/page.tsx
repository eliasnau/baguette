"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { toast } from "react-hot-toast";

interface Competitor {
  id: string;
  name: string;
  sprint_time: number | null;
}

interface ActiveSprinter {
  id: string;
  name: string;
  time: number;
}

export default function SprintPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedSprinters, setSelectedSprinters] = useState<string[]>([]);
  const [activeSprinters, setActiveSprinters] = useState<ActiveSprinter[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadCompetitors();
  }, [refreshKey]);

  async function loadCompetitors() {
    try {
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveAll() {
    try {
      setIsLoading(true);
      for (const sprinter of activeSprinters) {
        await invoke('set_sprint_time', {
          competitorId: sprinter.id,
          time: sprinter.time
        });
      }
      await invoke('save_data');
      setRefreshKey(prev => prev + 1);
      setActiveSprinters([]);
      setSelectedSprinters([]);
      setIsRunning(false);
      toast.success('All times saved successfully');
    } catch (error) {
      console.error('Failed to save times:', error);
      toast.error('Failed to save times');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCompetitor(id: string) {
    setSelectedSprinters(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  }

  useEffect(() => {
    setActiveSprinters(
      selectedSprinters.map(id => {
        const competitor = competitors.find(c => c.id === id)!;
        return {
          id: competitor.id,
          name: competitor.name,
          time: 0
        };
      })
    );
  }, [selectedSprinters, competitors]);

  function updateTime(id: string, time: number) {
    setActiveSprinters(prev => 
      prev.map(sprinter => 
        sprinter.id === id ? { ...sprinter, time } : sprinter
      )
    );
  }

  function startTimer() {
    setIsRunning(true);
    setStartTime(Date.now());
  }

  function stopTimer() {
    if (!startTime) return;
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
    
    setActiveSprinters(prev => 
      prev.map(sprinter => ({
        ...sprinter,
        time: Number(elapsedTime.toFixed(2))
      }))
    );
    
    setIsRunning(false);
    setStartTime(null);
  }

  function openLeaderboard() {
    const webview = new WebviewWindow('leaderboard', {
      url: '/leaderboard'
    });
    webview.once('tauri://created', function () {
      toast.success('Leaderboard opened');
    });
    webview.once('tauri://error', function (e) {
      toast.error(`Error opening leaderboard`);
      console.error(e);
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Sprint Competition</h1>
          <Button
            variant="outline"
            onClick={openLeaderboard}
            className="ml-4 bg-blue-50 hover:bg-blue-100 text-blue-600"
          >
            View Leaderboard 🏆
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            onClick={startTimer}
            disabled={selectedSprinters.length === 0 || isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Timer
          </Button>
          <Button
            variant="default"
            onClick={stopTimer}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700"
          >
            Stop Timer
          </Button>
        </div>
      </div>

      {/* Active Sprinters Section */}
      {activeSprinters.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Active Sprinters</h2>
            <Button
              onClick={handleSaveAll}
              disabled={!activeSprinters.length || isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save All Results
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSprinters.map((sprinter) => (
              <div 
                key={sprinter.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="font-semibold text-lg">{sprinter.name}</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {isRunning && startTime ? (
                    ((Date.now() - startTime) / 1000).toFixed(2)
                  ) : (
                    <Input
                      type="number"
                      value={sprinter.time}
                      onChange={(e) => updateTime(sprinter.id, parseFloat(e.target.value) || 0)}
                      className="w-24 text-lg font-medium"
                      step="0.01"
                      min="0"
                      disabled={isRunning}
                    />
                  )}
                  <span className="text-xl ml-1">s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing competitors table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor) => {
              const isSelected = selectedSprinters.includes(competitor.id);

              return (
                <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>
                    {isSelected && isRunning ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                        Currently Running
                      </span>
                    ) : isSelected ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    ) : competitor.sprint_time !== null ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        Not Started
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!isRunning && competitor.sprint_time === null && (
                      <Button
                        variant="outline"
                        onClick={() => toggleCompetitor(competitor.id)}
                        className={`hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {isSelected ? 'Deselect' : 'Select'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {isLoading && (
        <div className="mt-4 text-center text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
} 