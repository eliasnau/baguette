"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

interface Competition {
  name: string;
  competitors: Competitor[];
}

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

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [newCompetitionName, setNewCompetitionName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [competitorDialogOpen, setCompetitorDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await invoke('load_data');
      await loadCompetitions();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function saveData() {
    try {
      await invoke('save_data');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  async function loadCompetitions() {
    try {
      setIsLoading(true);
      const data = await invoke('get_competition_data');
      setCompetitions([data]);
      if (selectedCompetition) {
        const updatedSelectedCompetition = data.competitors ? data : null;
        setSelectedCompetition(updatedSelectedCompetition);
      }
    } catch (error) {
      console.error('Failed to load competitions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createCompetition() {
    if (!newCompetitionName.trim()) return;

    try {
      setIsLoading(true);
      await invoke('create_new_competition', { 
        name: newCompetitionName 
      });
      await loadCompetitions();
      setNewCompetitionName('');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create competition:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addCompetitor() {
    if (!newCompetitorName.trim()) return;

    try {
      setIsLoading(true);
      await invoke('add_competitor', { 
        name: newCompetitorName
      });
      await loadCompetitions();
      setNewCompetitorName('');
      setCompetitorDialogOpen(false);
    } catch (error) {
      console.error('Failed to add competitor:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Wettbewerbsmanagement
        </h1>
        
        {/* Create Competition Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Wetbewerb erstellen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Wettbewerb erstellen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={newCompetitionName}
                onChange={(e) => setNewCompetitionName(e.target.value)}
                placeholder="Competition Name"
              />
              <Button onClick={createCompetition}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Competition Select */}
      <div className="mb-8">
        <Select
          onValueChange={(value) => {
            const competition = competitions.find(c => c.name === value);
            setSelectedCompetition(competition || null);
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a competition" />
          </SelectTrigger>
          <SelectContent>
            {competitions.map((competition, index) => (
              <SelectItem key={index} value={competition.name}>
                {competition.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCompetition && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sportler</h2>
            <div className="flex gap-4">
              <Dialog open={competitorDialogOpen} onOpenChange={setCompetitorDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Sportler hinzufügen</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuen Sportler hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      placeholder="Competitor Name"
                    />
                    <Button onClick={addCompetitor}>Hinzufügen</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="secondary"
                onClick={() => router.push('/pole')}
              >
                Stabhochsprung
              </Button>
            </div>
          </div>

          {/* Competitors Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sprint Zeit</TableHead>
                  <TableHead>Seilsprung Zeit</TableHead>
                  <TableHead>Stabhochsprung versuche</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCompetition.competitors.map((competitor) => (
                  <TableRow key={competitor.id}>
                    <TableCell>{competitor.name}</TableCell>
                    <TableCell>{competitor.sprint_time ?? '-'}</TableCell>
                    <TableCell>{competitor.seilsprung_count ?? '-'}</TableCell>
                    <TableCell>
                      {competitor.pole_vault_attempts?.length ?? 0} versuche
                    </TableCell>
                  </TableRow>
                ))}
                {selectedCompetition.competitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Keinen Teilnehmer gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
} 