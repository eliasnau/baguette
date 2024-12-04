import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Competitor {
  id: string;
  name: string;
  // ... other fields
}

interface Attempt {
  height: number;
  successful: boolean;
}

export default function PoleVault() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentHeight, setCurrentHeight] = useState<number>(2.00);
  
  useEffect(() => {
    // Load competition data when component mounts
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    const data = await invoke('get_competition_data');
    setCompetitors(data.competitors);
  }

  async function handleAttempt(competitorId: string, successful: boolean) {
    await invoke('add_stabhochsprung_attempt', {
      competitorId,
      height: currentHeight,
      successful
    });
    // Reload data to get updated attempts
    loadCompetitors();
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stabhochsprung</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Aktuelle Höhe (m):</label>
        <input 
          type="number"
          step="0.05"
          value={currentHeight}
          onChange={(e) => setCurrentHeight(Number(e.target.value))}
          className="border p-2 rounded"
        />
      </div>

      <div className="grid gap-4">
        {competitors.map((competitor) => (
          <div key={competitor.id} className="border p-4 rounded">
            <h3 className="font-bold">{competitor.name}</h3>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAttempt(competitor.id, true)}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                ✓
              </button>
              <button
                onClick={() => handleAttempt(competitor.id, false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                ✗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 