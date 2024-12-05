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
  seilsprung_count: number | null;
}

interface ActiveClimber {
  id: string;
  name: string;
  count: number;
}

export default function ClimbingPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedClimbers, setSelectedClimbers] = useState<string[]>([]);
  const [activeClimbers, setActiveClimbers] = useState<ActiveClimber[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      for (const climber of activeClimbers) {
        await invoke('set_seilsprung_count', {
          competitorId: climber.id,
          count: climber.count
        });
      }
      await invoke('save_data');
      setRefreshKey(prev => prev + 1);
      setActiveClimbers([]);
      setSelectedClimbers([]);
      setIsRunning(false);
      toast.success('All counts saved successfully');
    } catch (error) {
      console.error('Failed to save counts:', error);
      toast.error('Failed to save counts');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCompetitor(id: string) {
    setSelectedClimbers(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  }

  useEffect(() => {
    setActiveClimbers(
      selectedClimbers.map(id => {
        const competitor = competitors.find(c => c.id === id)!;
        return {
          id: competitor.id,
          name: competitor.name,
          count: 0
        };
      })
    );
  }, [selectedClimbers, competitors]);

  function updateCount(id: string, count: number) {
    setActiveClimbers(prev => 
      prev.map(climber => 
        climber.id === id ? { ...climber, count } : climber
      )
    );
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
          <h1 className="text-3xl font-bold text-gray-800">Climbing Competition</h1>
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
            onClick={() => setIsRunning(true)}
            disabled={selectedClimbers.length === 0 || isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Timer
          </Button>
          <Button
            variant="default"
            onClick={() => setIsRunning(false)}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700"
          >
            Stop Timer
          </Button>
        </div>
      </div>

      {/* Active Climbers Section */}
      {activeClimbers.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Active Climbers</h2>
            <Button
              onClick={handleSaveAll}
              disabled={!activeClimbers.length || isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save All Results
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClimbers.map((climber) => (
              <div 
                key={climber.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="font-semibold text-lg">{climber.name}</span>
                </div>
                <Input
                  type="number"
                  value={climber.count}
                  onChange={(e) => updateCount(climber.id, parseInt(e.target.value) || 0)}
                  className="w-24 text-lg font-medium"
                  min={0}
                  disabled={isRunning}
                />
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
              const isSelected = selectedClimbers.includes(competitor.id);

              return (
                <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>
                    {isSelected && isRunning ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                        Currently Climbing
                      </span>
                    ) : isSelected ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    ) : competitor.seilsprung_count !== null ? (
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
                    {!isRunning && competitor.seilsprung_count === null && (
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