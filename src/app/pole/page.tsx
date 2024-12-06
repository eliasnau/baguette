// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import toast from 'react-hot-toast';
import { emit } from '@tauri-apps/api/event';

interface Competitor {
  id: string;
  name: string;
  competition_type: 'Stab' | 'Wurf';
  pole_vault_attempts: PoleVaultAttempt[] | null;
}

interface PoleVaultAttempt {
  height: number;
  successful: boolean;  
}

interface AttemptsByHeight {
  [height: number]: PoleVaultAttempt[];
}

const attemptStyles = {
  success: "inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium text-sm mx-0.5",
  failure: "inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium text-sm mx-0.5",
  pending: "inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium text-sm mx-0.5"
};

export default function PolePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentHeight, setCurrentHeight] = useState<number>(2.00);
  const [currentJumper, setCurrentJumper] = useState<Competitor | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCompetitors();
  }, [refreshKey]);

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

  async function handleAttempt(successful: boolean) {
    if (!currentJumper) return;

    try {
      setIsLoading(true);
      await invoke('add_stabhochsprung_attempt', {
        competitorId: currentJumper.id,
        height: currentHeight,
        successful
      });
      await invoke('save_data');

      // Emit refresh event
      await emit('refresh-data');
      
      // Emit the result event first
      await emit(successful ? 'pole-vault-success' : 'pole-vault-failure', {
        name: currentJumper.name,
        height: currentHeight
      });
      
      // Emit refresh event
      
      
      // Wait a moment before hiding the display
      setTimeout(async () => {
        await emit('hide-pole-vault');
        setCurrentJumper(null);
        setRefreshKey(prev => prev + 1);
      }, 2000); // Show result for 2 seconds
      
    } catch (error) {
      console.error('Failed to record attempt:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setCurrentHeight(value);
    }
  };

  // Helper function to get attempt sequence at height
  function getAttemptSequence(attempts: PoleVaultAttempt[] | null, height: number): JSX.Element {
    if (!attempts) return <span className={attemptStyles.pending}>-</span>;
    const attemptsAtHeight = attempts.filter(a => a.height === height);
    if (attemptsAtHeight.length === 0) return <span className={attemptStyles.pending}>-</span>;
    
    const attempts_jsx = attemptsAtHeight.map((a, index) => (
      <span 
        key={index} 
        className={a.successful ? attemptStyles.success : attemptStyles.failure}
      >
        {a.successful ? 'o' : 'x'}
      </span>
    ));

    if (attemptsAtHeight.some(a => a.successful)) {
      return <div className="flex gap-1">{attempts_jsx}</div>;
    }
    if (attemptsAtHeight.length >= 3) {
      return <div className="flex gap-1">{attempts_jsx}</div>;
    }
    return (
      <div className="flex gap-1 items-center">
        {attempts_jsx}
        <span className="text-sm text-gray-500">({attemptsAtHeight.length}/3)</span>
      </div>
    );
  }

  // Helper function to check if competitor can attempt height
  function canAttemptHeight(attempts: PoleVaultAttempt[] | null, height: number): boolean {
    if (!attempts) return true;
    
    // Get attempts grouped by height
    const attemptsByHeight = attempts.reduce((acc: { [height: number]: PoleVaultAttempt[] }, attempt) => {
      if (!acc[attempt.height]) {
        acc[attempt.height] = [];
      }
      acc[attempt.height].push(attempt);
      return acc;
    }, {});

    // Check each height
    for (const attemptHeight in attemptsByHeight) {
      const heightAttempts = attemptsByHeight[parseFloat(attemptHeight)];
      
      // If they've succeeded at this height, they can't attempt it again
      if (parseFloat(attemptHeight) === height && heightAttempts.some(a => a.successful)) {
        return false;
      }
      
      // If they've failed 3 times at this height without success
      const failedAttempts = heightAttempts.filter(a => !a.successful).length;
      if (failedAttempts >= 3 && !heightAttempts.some(a => a.successful)) {
        // Can't attempt this height or any higher heights
        if (height >= parseFloat(attemptHeight)) {
          return false;
        }
      }
    }
    
    return true;
  }

  function openLeaderboard() {
    const webview = new WebviewWindow('leaderboard', {
      url: 'leaderboard'
    });
    webview.once('tauri://created', function () {
      toast.success('Leaderboard opened');
    });
    webview.once('tauri://error', function (e) {
      toast.error(`Error opening leaderboard`);
      console.error(e);
     });
  }

  const handleSetCurrentJumper = async (competitor: Competitor) => {
    setCurrentJumper(competitor);
    await emit('show-pole-vault', {competitorId: competitor.id, height: currentHeight});
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Pole Vault Competition</h1>
          <Button
            variant="outline"
            onClick={openLeaderboard}
            className="ml-4 bg-blue-50 hover:bg-blue-100 text-blue-600"
          >
            View Leaderboard 🏆
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Current Height:</span>
            <Input
              type="number"
              value={currentHeight}
              onChange={handleHeightChange}
              step={0.05}
              min={0}
              className="w-24 text-lg font-medium"
            />
            <span className="text-gray-600">m</span>
          </div>
        </div>
      </div>

      {/* Current Jumper Display */}
      {currentJumper && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-blue-900">
                Current Jumper: {currentJumper.name}
              </h3>
              <p className="text-blue-700 mt-1">Attempting: {currentHeight}m</p>
              <div className="text-blue-600 mt-1">
                Attempts at current height: {
                  getAttemptSequence(currentJumper.pole_vault_attempts, currentHeight)
                }
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                className="bg-green-500 hover:bg-green-600 text-white px-6"
                onClick={() => handleAttempt(true)}
              >
                Success (o)
              </Button>
              <Button
                variant="default"
                className="bg-red-500 hover:bg-red-600 text-white px-6"
                onClick={() => handleAttempt(false)}
              >
                Failure (x)
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
              <TableHead className="font-semibold text-gray-700">Current Height ({currentHeight}m)</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor) => {
              const canAttempt = canAttemptHeight(competitor.pole_vault_attempts, currentHeight);
              const highestSuccess = Math.max(
                ...((competitor.pole_vault_attempts || [])
                  .filter(a => a.successful)
                  .map(a => a.height)),
                0
              );

              return (
                <TableRow key={competitor.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>
                    {getAttemptSequence(competitor.pole_vault_attempts, currentHeight)}
                  </TableCell>
                  <TableCell>
                    {currentJumper?.id === competitor.id ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        Currently Jumping
                      </span>
                    ) : !canAttempt && highestSuccess >= currentHeight ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                        Height Cleared ✓ (Best: {highestSuccess}m)
                      </span>
                    ) : !canAttempt && highestSuccess < currentHeight ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800">
                        Failed Height ✗ {highestSuccess > 0 ? `(Best: ${highestSuccess}m)` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        Can Attempt {highestSuccess > 0 ? `(Best: ${highestSuccess}m)` : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!currentJumper && canAttempt && (
                      <Button
                        variant="outline"
                        onClick={() => handleSetCurrentJumper(competitor)}
                        disabled={currentJumper !== null}
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