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
  competition_type: 'Stab' | 'Wurf';
  sprint_5jump: JumpAttempt[] | null;
}

interface JumpAttempt {
  distance: number;
}

export default function JumpPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentJumper, setCurrentJumper] = useState<Competitor | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCompetitors();
  }, [refreshKey]);

  async function loadCompetitors() {
    try {
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      setCompetitors(data.competitors.filter(c => c.competition_type === 'Wurf'));
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAttempt() {
    if (!currentJumper) return;

    try {
      setIsLoading(true);
      await invoke('add_jump_attempt', {
        competitorId: currentJumper.id,
        distance: currentDistance,
      });
      await invoke('save_data');
      setCurrentJumper(null);
      setCurrentDistance(0);
      setRefreshKey(prev => prev + 1);
      toast.success('Jump recorded successfully');
    } catch (error) {
      console.error('Failed to record jump:', error);
      toast.error('Failed to record jump');
    } finally {
      setIsLoading(false);
    }
  }

  function getAttemptSequence(attempts: JumpAttempt[] | null): JSX.Element {
    if (!attempts || attempts.length === 0) {
      return <span className="text-gray-500 text-xl">No attempts yet</span>;
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
        {Array.from({ length: 3 - (attempts?.length || 0) }).map((_, index) => (
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

  function getBestAttempt(attempts: JumpAttempt[] | null): number {
    if (!attempts || attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.distance));
  }

  function canAttempt(attempts: JumpAttempt[] | null): boolean {
    if (!attempts) return true;
    return attempts.length < 3;
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
          <h1 className="text-3xl font-bold text-gray-800">5-Jump Competition 🦘</h1>
          <Button
            variant="outline"
            onClick={openLeaderboard}
            className="ml-4 bg-blue-50 hover:bg-blue-100 text-blue-600"
          >
            View Leaderboard 🏆
          </Button>
        </div>
      </div>

      {currentJumper && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-blue-900">
                Current Jumper: {currentJumper.name}
              </h3>
              <div className="text-blue-600 mt-1">
                Previous attempts: {getAttemptSequence(currentJumper.sprint_5jump)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentDistance || ''}
                onChange={(e) => setCurrentDistance(parseFloat(e.target.value) || 0)}
                step={0.01}
                min={0}
                placeholder="Distance"
                className="w-24 text-lg font-medium"
              />
              <span className="text-gray-600">m</span>
              <Button
                variant="default"
                className="bg-green-500 hover:bg-green-600 text-white px-6"
                onClick={handleAttempt}
                disabled={!currentDistance}
              >
                Record Jump
              </Button>
              <Button
                variant="outline"
                className="ml-2 hover:bg-red-50 text-red-600"
                onClick={() => setCurrentJumper(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Attempts</TableHead>
              <TableHead className="font-semibold text-gray-700">Best</TableHead>
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor) => {
              const canMakeAttempt = canAttempt(competitor.sprint_5jump);
              const bestAttempt = getBestAttempt(competitor.sprint_5jump);

              return (
                <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>{getAttemptSequence(competitor.sprint_5jump)}</TableCell>
                  <TableCell>
                    {bestAttempt > 0 ? (
                      <span className="font-semibold text-green-600">
                        {bestAttempt.toFixed(2)}m
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {!currentJumper && canMakeAttempt && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentJumper(competitor)}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        Set as Current Jumper
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