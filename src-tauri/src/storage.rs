use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Competition {
    pub name: String,
    pub competitors: Vec<Competitor>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Competitor {
    pub id: String,
    pub name: String,
    pub competition_type: CompetitionType,
    // Stab disciplines
    pub pole_vault_attempts: Option<Vec<PoleVaultAttempt>>,
    pub climbing_time: Option<f64>,
    pub sprint_time: Option<f64>,
    // Wurf disciplines
    pub sprint_5jump: Option<Vec<JumpAttempt>>,
    pub kugel_distance: Option<f64>,
    pub wsprint_time: Option<f64>,
    pub kugel_attempts: Option<Vec<KugelAttempt>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum CompetitionType {
    Stab,
    Wurf,
}

#[derive(Debug, Serialize, Deserialize, Clone)]

pub struct PoleVaultAttempt {
    pub height: f64,
    pub successful: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KugelAttempt {
    pub distance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JumpAttempt {
    pub distance: f64,
}

pub struct Storage {
    pub competition: Competition,
}

impl Default for Storage {
    fn default() -> Self {
        Self {
            competition: Competition {
                name: String::new(),
                competitors: Vec::new(),
            },
        }
    }
}

impl Storage {
    pub fn new(name: &str) -> Self {
        Self {
            competition: Competition {
                name: name.to_string(),
                competitors: Vec::new(),
            },
        }
    }

    pub fn get_competition_data(&self) -> &Competition {
        &self.competition
    }

    pub fn add_competitor(&mut self, id: String, name: &str, competition_type: CompetitionType) {
        self.competition.competitors.push(Competitor {
            id,
            name: name.to_string(),
            competition_type,
            pole_vault_attempts: None,
            climbing_time: None,
            sprint_time: None,
            sprint_5jump: None,
            kugel_distance: None,
            wsprint_time: None,
            kugel_attempts: None,
        });
    }

    pub fn set_sprint_time(&mut self, competitor_id: String, time: f64) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            competitor.sprint_time = Some(time);
            Ok(())
        } else {
            Err("Competitor not found".to_string())
        }
    }
    
    pub fn set_climbing_time(
        &mut self,
        competitor_id: String,
        time: f64,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            competitor.climbing_time = Some(time);
            Ok(())
        } else {
            Err("Competitor not found".to_string())
        }
    }

    pub fn save_to_file(&self, file_path: &str) -> Result<(), String> {
        let json = serde_json::to_string_pretty(&self.competition)
            .map_err(|e| format!("Failed to serialize competition: {}", e))?;

        fs::write(file_path, json).map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(())
    }

    pub fn load_from_file(file_path: &str) -> Result<Self, String> {
        let content =
            fs::read_to_string(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

        let competition: Competition = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse competition data: {}", e))?;

        Ok(Self { competition })

    }

    pub fn add_pole_vault_attempt(
        &mut self,
        competitor_id: &str,
        height: f64,
        successful: bool,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            // Initialize attempts vector if None
            if competitor.pole_vault_attempts.is_none() {
                competitor.pole_vault_attempts = Some(Vec::new());
            }

            let attempts = competitor.pole_vault_attempts.as_ref().unwrap();

            // Check if the competitor has failed 3 times at a lower height without success
            for attempt in attempts {
                if attempt.height < height && !attempt.successful {
                    let failedAttempts = attempts
                        .iter()
                        .filter(|a| a.height == attempt.height && !a.successful)
                        .count();
                    if failedAttempts >= 3 {
                        return Err(
                            "Cannot attempt a height after failing a lower height 3 times"
                                .to_string(),
                        );
                    }
                }
            }

            let attempt = PoleVaultAttempt { height, successful };

            if let Some(attempts) = &mut competitor.pole_vault_attempts {
                attempts.push(attempt);
            }

            Ok(())
        } else {
            Err("Competitor not found".to_string())
        }
    }

    pub fn get_highest_cleared_height(&self, competitor_id: &str) -> Option<f64> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter()
            .find(|c| c.id == competitor_id)
        {
            competitor
                .pole_vault_attempts
                .as_ref()
                .and_then(|attempts| {
                    attempts
                        .iter()
                        .filter(|attempt| attempt.successful)
                        .map(|attempt| attempt.height)
                        .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                })
        } else {
            None
        }
    }

    pub fn set_kugel_distance(&mut self, competitor_id: String, distance: f64) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            competitor.kugel_distance = Some(distance);
            Ok(())
        } else {
            Err("Competitor not found".to_string())
        }
    }

    pub fn set_wsprint_time(
        &mut self,
        competitor_id: String,
        time: f64,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            competitor.sprint_time = Some(time);
            Ok(())
        } else {
            Err("Competitor not found".to_string())
        }
    }

    pub fn add_kugel_attempt(
        &mut self,
        competitor_id: &str,
        distance: f64,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            if competitor.competition_type != CompetitionType::Wurf {
                return Err("Competitor is not a Wurf competitor".to_string());
            }

            let attempt = KugelAttempt { distance };
            
            match &mut competitor.kugel_attempts {
                Some(attempts) if attempts.len() >= 5 => {
                    Err("Maximum number of attempts reached".to_string())
                }
                Some(attempts) => {
                    attempts.push(attempt);
                    Ok(())
                }
                None => {
                    competitor.kugel_attempts = Some(vec![attempt]);
                    Ok(())
                }
            }
        } else {
            Err("Competitor not found".to_string())
        }
    }

    pub fn add_jump_attempt(
        &mut self,
        competitor_id: &str,
        distance: f64,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            if competitor.competition_type != CompetitionType::Wurf {
                return Err("Competitor is not a Wurf competitor".to_string());
            }

            let attempt = JumpAttempt { distance };
            
            match &mut competitor.sprint_5jump {
                Some(attempts) if attempts.len() >= 2 => {
                    Err("Maximum number of attempts (2) reached".to_string())
                }
                Some(attempts) => {
                    attempts.push(attempt);
                    Ok(())
                }
                None => {
                    competitor.sprint_5jump = Some(vec![attempt]);
                    Ok(())
                }
            }
        } else {
            Err("Competitor not found".to_string())
        }
    }
}
