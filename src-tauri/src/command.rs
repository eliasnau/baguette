use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use log::info;

use crate::storage::{Competition, Storage};

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
) -> Result<(), String> {
    // Add competitor
    {
        let mut storage = state.storage.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        storage.add_competitor(id, &name);
    } // Lock is released here
    
    println!("Adding competitor and saving to disk...");
    
    // Save immediately
    save_data(state, app_handle).await?;
    
    Ok(())
}

#[tauri::command]
pub async fn add_stabhochsprung_attempt(
    state: State<'_, AppState>,
    competitor_id: String,
    height: f64,
    successful: bool,
) -> Result<(), String> {
    let mut storage = state.storage.lock().unwrap();
    storage.add_pole_vault_attempt(&competitor_id, height, successful);
    Ok(())
}

#[tauri::command]
pub async fn set_sprint_time(
    state: State<'_, AppState>,
    competitor_id: u32,
    time: f32,
) -> Result<(), String> {
    let mut storage = state.storage.lock().unwrap();
    storage
        .set_sprint_time(competitor_id.to_string(), time as f64)
}

#[tauri::command]
pub async fn set_seilsprung_count(
    state: State<'_, AppState>,
    competitor_id: u32,
    count: u32,
) -> Result<(), String> {
    let mut storage = state.storage.lock().unwrap();
    storage
        .set_seilsprung_count(competitor_id.to_string(), count as i32)
}

#[tauri::command]
pub async fn save_data(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let storage = state.storage.lock().unwrap();
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    println!("App data directory: {:?}", app_data_dir);
    
    // Create the directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    let file_path = app_data_dir.join("competition_data.json");
    println!("Saving data to: {:?}", file_path);
    
    storage.save_to_file(file_path.to_str().unwrap())
}

#[tauri::command]
pub async fn load_data(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let app_data_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let file_path = app_data_dir.join("competition_data.json");
    
    println!("Looking for data file at: {:?}", file_path);
    
    if !file_path.exists() {
        println!("No existing data file found");
        return Ok(());
    }

    println!("Loading data from: {:?}", file_path);
    match Storage::load_from_file(file_path.to_str().unwrap()) {
        Ok(new_storage) => {
            let mut storage = state.storage.lock().unwrap();
            *storage = new_storage;
            Ok(())
        }
        Err(e) => Err(e),
    }
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
