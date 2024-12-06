"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { toast } from "react-hot-toast";
import { listen, emit } from '@tauri-apps/api/event';


interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  sprint_time: number | null;
}

export default function SprintPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentSprinter, setCurrentSprinter] = useState<Competitor | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

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
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors.filter(c => c.competition_type === 'Stab'));
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!currentSprinter) return;
    
    try {
      setIsLoading(true);
      await invoke('set_sprint_time', {
        competitorId: currentSprinter.id,
        time: currentTime
      });
      await invoke('save_data');
      
      // Emit refresh event
      await emit('refresh-data');
      
      // Emit success event
      await emit('sprint-success', {
        name: currentSprinter.name,
        time: currentTime
      });
      
      // Wait before hiding
      setTimeout(async () => {
        await emit('hide-sprint');
        setCurrentSprinter(null);
        setCurrentTime(0);
        setIsRunning(false);
        setRefreshKey(prev => prev + 1);
      }, 2000); // Show result for 2 seconds
      
    } catch (error) {
      console.error('Failed to save time:', error);
      toast.error('Failed to save time');
    } finally {
      setIsLoading(false);
    }
  }

  function startTimer() {
    if (!currentSprinter) return;
    setIsRunning(true);
    setStartTime(Date.now());
  }

  function stopTimer() {
    if (!startTime) return;
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000;
    setCurrentTime(Number(elapsedTime.toFixed(2)));
    setIsRunning(false);
    setStartTime(null);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Sprint Competition</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            onClick={startTimer}
            disabled={!currentSprinter || isRunning}
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

      {/* Current Sprinter Section */}
      {currentSprinter && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Current Sprinter</h2>
            <Button
              onClick={handleSave}
              disabled={isRunning || currentTime === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Result
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="font-semibold text-lg">{currentSprinter.name}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {isRunning && startTime ? (
                ((Date.now() - startTime) / 1000).toFixed(2)
              ) : (
                currentTime.toFixed(2)
              )}
              <span className="text-xl ml-1">s</span>
            </div>
          </div>
        </div>
      )}

      {/* Competitors Table */}
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
            {competitors.map((competitor) => (
              <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium">{competitor.name}</TableCell>
                <TableCell>
                  {currentSprinter?.id === competitor.id ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                      Currently Running
                    </span>
                  ) : competitor.sprint_time !== null && competitor.sprint_time !== undefined && competitor.sprint_time > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      Completed ({competitor.sprint_time}s)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Not Started
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {!currentSprinter && !isRunning && (competitor.sprint_time === null || competitor.sprint_time === undefined) && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSprinter(competitor)}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      Set as Current Sprinter
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
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