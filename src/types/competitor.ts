export interface Competitor {
  id: string;
  name: string;
  type: 'stab' | 'wurf';  // Competition type
  // Stab disciplines
  pole_vault_attempts?: PoleVaultAttempt[];
  climbing_time?: number | null;
  // Wurf disciplines
  sprint_5jump?: number | null;  // Distance in meters
  kugel_distance?: number | null;  // Distance in meters
}

export interface PoleVaultAttempt {
  height: number;
  successful: boolean;
} 