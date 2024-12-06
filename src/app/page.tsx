// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Competition {
  name: string;
  competitors: Competitor[];
}

interface Competitor {
  id: string;
  name: string;
  type: 'Stab' | 'Wurf';
  // Stab disciplines
  pole_vault_attempts?: PoleVaultAttempt[] | null;
  climbing_time?: number | null;
  // Wurf disciplines
  sprint_5jump?: number | null;
  kugel_distance?: number | null;
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
  const [newCompetitorType, setNewCompetitorType] = useState<'Stab' | 'Wurf'>('Stab');
  const [competitorDialogOpen, setCompetitorDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Stab' | 'Wurf'>('Stab');
  const router = useRouter();

  useEffect(() => {
    loadCompetitions();
  }, []);

  async function loadCompetitions() {
    try {
      const data = await invoke('get_competition_data');
      setCompetitions([data]);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    }
  }

  async function createCompetition() {
    if (!newCompetitionName.trim()) return;

    try {
      await invoke('create_new_competition', { name: newCompetitionName });
      setNewCompetitionName('');
      setDialogOpen(false);
      await loadCompetitions();
    } catch (error) {
      console.error('Failed to create competition:', error);
    }
  }

  async function addCompetitor() {
    if (!newCompetitorName.trim()) return;

    try {
      await invoke('add_competitor', {
        name: newCompetitorName,
        competitionType: newCompetitorType
      });
      await loadCompetitions();
      setNewCompetitorName('');
      setCompetitorDialogOpen(false);
    } catch (error) {
      console.error('Failed to add competitor:', error);
    }
  }

  function getCompetitorsByType(type: 'Stab' | 'Wurf') {
    return selectedCompetition?.competitors.filter(c => c.competition_type === type) || [];
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Competition Management</h1>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Wettkampf erstellen</Button> 
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Wettkampf erstellen</DialogTitle>
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
              <SelectItem key={index} value={competition.name || `competition-${index}`}>
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
                    <DialogTitle>BNeuen Sportler hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                      placeholder="Competitor Name"
                    />
                    <Select
                      value={newCompetitorType}
                      onValueChange={(value: 'Stab' | 'Wurf') => setNewCompetitorType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select competition type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stab">Stab Wettkampf</SelectItem>
                        <SelectItem value="Wurf">Wurf Wettkampf</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addCompetitor}>Hinzufügen</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* All navigation buttons */}
              <Button variant="secondary" onClick={() => router.push('/pole')}>
                Stabhocsprung
              </Button>
              <Button variant="secondary" onClick={() => router.push('/climbing')}>
                Seilklettern
              </Button>
              <Button variant="secondary" onClick={() => router.push('/sprint')}>
                Stabsprint
              </Button>
              <Button variant="secondary" onClick={() => router.push('/wsprint')}>
                Wurfsprint
              </Button>
              <Button variant="secondary" onClick={() => router.push('/jump')}>
                Froschsprünge
              </Button>
              <Button variant="secondary" onClick={() => router.push('/kugel')}>
                Kugelstoßen
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value: 'Stab' | 'Wurf') => setActiveTab(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="Stab">Stab Wettkampf</TabsTrigger>
              <TabsTrigger value="Wurf">Wurf Wettkampf</TabsTrigger>
            </TabsList>

            <TabsContent value="Stab">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Stabhochsprung versuche</TableHead>
                    <TableHead>Kletterzeit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCompetitorsByType('Stab').map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell>{competitor.name}</TableCell>
                      <TableCell>{competitor.pole_vault_attempts?.length ?? 0} versuche</TableCell>
                      <TableCell>{competitor.climbing_time ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="Wurf">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Froschsprung weite</TableHead>
                    <TableHead>Kugel weite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCompetitorsByType('Wurf').map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell>{competitor.name}</TableCell>
                      <TableCell>{competitor.sprint_5jump ? `${competitor.sprint_5jump}m` : '-'}</TableCell>
                      <TableCell>{competitor.kugel_distance ? `${competitor.kugel_distance}m` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}