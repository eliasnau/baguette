"use client";
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PoleVaultLeaderboard } from "@/components/leaderboards/PoleVaultLeaderboard";
import { SprintLeaderboard } from "@/components/leaderboards/SprintLeaderboard";
import { ClimbingLeaderboard } from "@/components/leaderboards/ClimbingLeaderboard";

type LeaderboardType = 'pole' | 'sprint' | 'climbing';

export default function LeaderboardPage() {
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<LeaderboardType>('pole');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="py-8">
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Competition Leaderboards</h1>
              <p className="text-gray-600 mt-2">View rankings and results for each discipline</p>
            </div>
            <Select
              value={selectedLeaderboard}
              onValueChange={(value: LeaderboardType) => setSelectedLeaderboard(value)}
            >
              <SelectTrigger className="w-[280px] h-12 text-lg bg-blue-50">
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pole" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏃‍♂️ Pole Vault
                  </div>
                </SelectItem>
                <SelectItem value="sprint" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏃 Sprint
                  </div>
                </SelectItem>
                <SelectItem value="climbing" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🧗 Climbing
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto w-full flex justify-center">
            <div className="min-w-full">
              {selectedLeaderboard === 'pole' && <PoleVaultLeaderboard />}
              {selectedLeaderboard === 'sprint' && <SprintLeaderboard />}
              {selectedLeaderboard === 'climbing' && <ClimbingLeaderboard />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 