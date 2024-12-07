"use client";
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PoleVaultLeaderboard } from "@/components/leaderboards/PoleVaultLeaderboard";
import { SprintLeaderboard } from "@/components/leaderboards/SprintLeaderboard";
import { SprintLeaderboardWurf } from "@/components/leaderboards/SprintLeaderboardWurf";
import { ClimbingLeaderboard } from "@/components/leaderboards/ClimbingLeaderboard";
import { KugelLeaderboard } from "@/components/leaderboards/KugelLeaderboard";
import { FiveJumpLeaderboard } from "@/components/leaderboards/FiveJumpLeaderboard";
import { AllWurfLeaderboard } from "@/components/leaderboards/AllWurfLeaderboard";
import { AllStabLeaderboard } from "@/components/leaderboards/AllStabLeaderboard";
import { PoleVaultDisplay } from "@/components/PoleVaultDisplay";
import { ClimbingDisplay } from '@/components/ClimbingDisplay';
import { SprintDisplay } from '@/components/SprintDisplay';

type LeaderboardType = 'pole' | 'sprint' | 'climbing' | 'kugel' | 'fivejump' | 'allwurf' | 'allstab' | 'sprintwurf';

export default function LeaderboardPage() {
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<LeaderboardType>('pole');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="py-8">
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Bestenlisten</h1>
              <p className="text-gray-600 mt-2">Bestenliste für alle Disziplinen anzeigen</p>
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
                    🏃‍♂️ Stabhochsprung
                  </div>
                </SelectItem>
                <SelectItem value="sprint" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏃 Sprint (Stab)
                  </div>
                </SelectItem>
                <SelectItem value="climbing" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🧗 Seilklettern
                  </div>
                </SelectItem>
                <SelectItem value="kugel" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏋️ Kugelstoßen
                  </div>
                </SelectItem>
                <SelectItem value="sprintwurf" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    � Sprint (Wurf)
                  </div>
                </SelectItem>
                <SelectItem value="fivejump" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🦘 Froschsprung
                  </div>
                </SelectItem>
                <SelectItem value="allwurf" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏆 Kugel Dreikampf Bestenliste
                  </div>
                </SelectItem>
                <SelectItem value="allstab" className="text-lg py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    🏆 Stabhoch Dreikampf Bestenliste
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
              {selectedLeaderboard === 'kugel' && <KugelLeaderboard />} 
              {selectedLeaderboard === 'sprintwurf' && <SprintLeaderboardWurf />} 
              {selectedLeaderboard === 'fivejump' && <FiveJumpLeaderboard />}
              {selectedLeaderboard === 'allwurf' && <AllWurfLeaderboard />}
              {selectedLeaderboard === 'allstab' && <AllStabLeaderboard />}
            </div>
          </div>
        </div>
      </div>
      <PoleVaultDisplay />
    </div>
  );
} 
