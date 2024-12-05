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
    pub pole_vault_attempts: Option<Vec<PoleVaultAttempt>>,
    pub sprint_time: Option<f64>,
    pub seilsprung_count: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PoleVaultAttempt {
    pub height: f64,
    pub successful: bool,
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

    pub fn add_competitor(&mut self, id: String, name: &str) {
        self.competition.competitors.push(Competitor {
            id,
            name: name.to_string(),
            pole_vault_attempts: None,
            sprint_time: None,
            seilsprung_count: None,
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

    pub fn set_seilsprung_count(
        &mut self,
        competitor_id: String,
        count: i32,
    ) -> Result<(), String> {
        if let Some(competitor) = self
            .competition
            .competitors
            .iter_mut()
            .find(|c| c.id == competitor_id)
        {
            competitor.seilsprung_count = Some(count);
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
}
