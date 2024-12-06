use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use std::path::PathBuf;
use std::sync::Mutex;

use crate::storage::{Competition, Storage, CompetitionType};

// Tauri State für den zentralen Daten-Speicher
pub struct AppState {
    pub storage: Mutex<Storage>,
}

// Payloads für die Commands
#[derive(Debug, Deserialize)]
pub struct AddCompetitorPayload {
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct AttemptPayload {
    pub competitor_id: u32,
    pub height: f32,
    pub success: bool,
}

#[derive(Debug, Deserialize)]
pub struct PoleVaultAttemptPayload {
    pub competitor_id: String,
    pub height: f64,
    pub successful: bool,
}

#[tauri::command]
pub async fn add_competitor(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    name: String,
    competition_type: CompetitionType,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.add_competitor(uuid::Uuid::new_v4().to_string(), &name, competition_type);
    }
    save_data(state, app_handle).await?;
    Ok(())
}

#[tauri::command]
pub async fn add_stabhochsprung_attempt(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    height: f64,
    successful: bool,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().unwrap();
        storage.add_pole_vault_attempt(&competitor_id, height, successful)?;
    }

    // Save the data after adding the attempt
    save_data(state, app_handle).await?;

    Ok(())
}

#[tauri::command]
pub async fn set_sprint_time(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    time: f64,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.set_sprint_time(competitor_id, time)?;
    }
    save_data(state, app_handle).await?;
    Ok(())
}

#[tauri::command]
pub async fn set_wsprint_time(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    time: f64,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().map_err(|e| e.to_string())?;
        storage.set_wsprint_time(competitor_id, time)?;
    }
    save_data(state, app_handle).await?;
    Ok(())
}

#[tauri::command]
pub async fn set_climbing_time(
    state: State<'_, AppState>,
    competitor_id: String,
    time: f64,
) -> Result<(), String> {
    let mut storage = state.storage.lock().unwrap();
    storage.set_climbing_time(competitor_id, time)?;
    Ok(())
}

#[tauri::command]
pub async fn save_data(state: State<'_, AppState>, app_handle: AppHandle) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&storage.competition)
        .map_err(|e| format!("Failed to serialize storage: {}", e))?;
    save_data_file(&app_handle, &json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_data(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let file_path = get_data_file(&app_handle).map_err(|e| e.to_string())?;
    if !file_path.exists() {
        return Ok(());
    }

    let content = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    let competition: Competition = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse competition data: {}", e))?;

    let mut storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.competition = competition;
    Ok(())
}

#[tauri::command]
pub async fn get_competition_data(state: State<'_, AppState>) -> Result<Competition, String> {
    let storage = state.storage.lock().unwrap();
    Ok(storage.get_competition_data().clone())
}

#[tauri::command]
pub async fn create_new_competition(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    name: String,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().unwrap();
        *storage = Storage::new(&name);
    }

    println!("Creating new competition and saving to disk...");

    save_data(state, app_handle).await?;

    Ok(())
}

#[tauri::command]
pub async fn add_jump_attempt(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    distance: f64,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().unwrap();
        storage.add_jump_attempt(&competitor_id, distance)?;
    }
    save_data(state, app_handle).await?;
    Ok(())
}

#[tauri::command]
pub async fn set_kugel_distance(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    distance: f64,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().unwrap();
        storage.set_kugel_distance(competitor_id, distance)?;
    }
    save_data(state, app_handle).await?;
    Ok(())
}

#[tauri::command]
pub async fn add_kugel_attempt(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    competitor_id: String,
    distance: f64,
) -> Result<(), String> {
    {
        let mut storage = state.storage.lock().unwrap();
        storage.add_kugel_attempt(&competitor_id, distance)?;
    }
    save_data(state, app_handle).await?;
    Ok(())
}

fn get_data_file(app_handle: &AppHandle) -> Result<PathBuf, std::io::Error> {
    app_handle
        .path()
        .app_data_dir()
        .map(|path| path.join("competition_data.json"))
        .map_err(|e| std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("App data directory not found: {}", e)
        ))
}

fn save_data_file(app_handle: &AppHandle, data: &str) -> Result<(), std::io::Error> {
    let data_file = get_data_file(app_handle)?;
    std::fs::write(data_file, data)?;
    Ok(())
}

