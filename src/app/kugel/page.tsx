// @ts-nocheck
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
  kugel_attempts: KugelAttempt[] | null;
}

interface KugelAttempt {
  distance: number;
}

const attemptStyles = {
  attempt: "inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-sm mx-0.5",
  pending: "inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium text-sm mx-0.5"
};

export default function KugelPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentThrower, setCurrentThrower] = useState<Competitor | null>(null);
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
    if (!currentThrower) return;

    try {
      setIsLoading(true);
      await invoke('add_kugel_attempt', {
        competitorId: currentThrower.id,
        distance: currentDistance,
      });
      await invoke('save_data');
      setCurrentThrower(null);
      setCurrentDistance(0);
      setRefreshKey(prev => prev + 1);
      toast.success('Attempt recorded successfully');
    } catch (error) {
      console.error('Failed to record attempt:', error);
      toast.error('Failed to record attempt');
    } finally {
      setIsLoading(false);
    }
  }

  function getAttemptSequence(attempts: KugelAttempt[] | null): JSX.Element {
    if (!attempts) return <span className={attemptStyles.pending}>Keine Versuche</span>;
    
    const attempts_jsx = attempts.map((a, index) => (
      <span key={index} className={attemptStyles.attempt}>
        {a.distance.toFixed(2)}m
      </span>
    ));

    return (
      <div className="flex gap-1 items-center">
        {attempts_jsx}
        <span className="text-sm text-gray-500">({attempts.length}/3)</span>
      </div>
    );
  }

  function getBestAttempt(attempts: KugelAttempt[] | null): number {
    if (!attempts || attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.distance));
  }

  function canAttempt(attempts: KugelAttempt[] | null): boolean {
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
          <h1 className="text-3xl font-bold text-gray-800">Kugelstoßen🏋️</h1>
          <Button
            variant="outline"
            onClick={openLeaderboard}
            className="ml-4 bg-blue-50 hover:bg-blue-100 text-blue-600"
          >
            Bestenliste🏆
          </Button>
        </div>
      </div>

      {/* Current Thrower Display */}
      {currentThrower && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-blue-900">
                Current Thrower: {currentThrower.name}
              </h3>
              <div className="text-blue-600 mt-1">
                Previous attempts: {getAttemptSequence(currentThrower.kugel_attempts)}
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
                Rekordversuch
              </Button>
              <Button
                variant="outline"
                className="ml-2 hover:bg-red-50 text-red-600"
                onClick={() => setCurrentThrower(null)}
              >
                Abbrechen
              </Button>
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
              <TableHead className="font-semibold text-gray-700">Attempts</TableHead>
              <TableHead className="font-semibold text-gray-700">Best</TableHead>
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor) => {
              const canMakeAttempt = canAttempt(competitor.kugel_attempts);
              const bestAttempt = getBestAttempt(competitor.kugel_attempts);

              return (
                <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>{getAttemptSequence(competitor.kugel_attempts)}</TableCell>
                  <TableCell>
                    {bestAttempt > 0 ? (
                      <span className="font-semibold text-green-600">
                        {bestAttempt.toFixed(2)}m
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {!currentThrower && canMakeAttempt && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentThrower(competitor)}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        Werfen lassen
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
          Lädt...
        </div>
      )}
    </div>
  );
} 