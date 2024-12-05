mod command;
mod storage;

use command::AppState;
use std::sync::Mutex;
use storage::Storage;
use tauri::{Manager, State};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Print the app data dir path during setup
            match app.path().app_data_dir() {
                Ok(app_data_dir) => {
                    println!("\n=== APP DATA LOCATION ===");
                    println!("📁 App data directory: {:?}", app_data_dir);
                    let data_file = app_data_dir.join("competition_data.json");
                    println!("📄 Data file will be at: {:?}", data_file);
                    println!("=======================\n");

                    // Try to load existing data
                    if data_file.exists() {
                        println!("Found existing data file, loading...");
                        if let Ok(storage) = Storage::load_from_file(data_file.to_str().unwrap()) {
                            let state: State<AppState> = app.state();
                            *state.storage.lock().unwrap() = storage;
                            println!("Successfully loaded existing data");
                        } else {
                            println!("Failed to load existing data");
                        }
                    } else {
                        println!("No existing data file found");
                    }
                }
                Err(e) => println!("Failed to get app data directory: {}", e),
            }
            Ok(())
        })
        .manage(AppState {
            storage: Default::default(),
        })
        .invoke_handler(tauri::generate_handler![
            command::add_competitor,
            command::add_stabhochsprung_attempt,
            command::set_climbing_time,
            command::set_sprint_time,
            command::save_data,
            command::load_data,
            command::get_competition_data,
            command::create_new_competition
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

