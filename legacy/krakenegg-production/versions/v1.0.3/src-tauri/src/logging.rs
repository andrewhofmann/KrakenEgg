use std::fs;
use std::path::PathBuf;

pub struct Logger {
    log_dir: PathBuf,
}

impl Logger {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let log_dir = get_log_directory()?;
        fs::create_dir_all(&log_dir)?;
        Ok(Self { log_dir })
    }

    pub fn init(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let log_level = std::env::var("KRAKENEGG_LOG_LEVEL")
            .unwrap_or_else(|_| "info".to_string());

        println!("🎯 KrakenEgg logging initialized");
        println!("📁 Log directory: {}", self.log_dir.display());
        println!("📊 Log level: {}", log_level);
        println!("🚀 Application startup");

        Ok(())
    }

    pub fn log_file_operation(&self, operation: &str, path: &str, result: &Result<(), String>) {
        match result {
            Ok(()) => println!("✅ FILE_OP: {} completed successfully on '{}'", operation, path),
            Err(e) => eprintln!("❌ FILE_OP: {} failed on '{}': {}", operation, path, e),
        }
    }

    pub fn log_navigation(&self, from: Option<&str>, to: &str, files_count: usize, dirs_count: usize) {
        println!("🧭 NAVIGATION: {} -> {} ({} files, {} dirs)",
              from.unwrap_or("startup"), to, files_count, dirs_count);
    }

    pub fn log_command_invocation(&self, command: &str, args: &serde_json::Value) {
        println!("🔧 COMMAND: {} with args: {}", command, args);
    }

    pub fn log_frontend_communication(&self, direction: &str, message: &str) {
        println!("📡 FRONTEND_COMM: [{}] {}", direction, message);
    }

    pub fn log_system_info(&self, info: &str) {
        println!("💻 SYSTEM: {}", info);
    }

    pub fn log_performance(&self, operation: &str, duration_ms: u64) {
        if duration_ms > 1000 {
            eprintln!("⚠️  PERFORMANCE: {} took {}ms (slow)", operation, duration_ms);
        } else {
            println!("⚡ PERFORMANCE: {} took {}ms", operation, duration_ms);
        }
    }

    pub fn log_error(&self, error: &str, context: Option<&str>) {
        match context {
            Some(ctx) => eprintln!("💥 ERROR [{}]: {}", ctx, error),
            None => eprintln!("💥 ERROR: {}", error),
        }
    }
}

fn get_log_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let dirs = dirs::home_dir()
        .ok_or("Could not find home directory")?;

    #[cfg(target_os = "macos")]
    let log_dir = dirs.join("Library/Logs/KrakenEgg");

    #[cfg(target_os = "windows")]
    let log_dir = dirs.join("AppData/Local/KrakenEgg/logs");

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let log_dir = dirs.join(".local/share/krakenegg/logs");

    Ok(log_dir)
}

#[macro_export]
macro_rules! log_timing {
    ($logger:expr, $operation:expr, $code:block) => {{
        let start = std::time::Instant::now();
        let result = $code;
        let duration = start.elapsed().as_millis() as u64;
        $logger.log_performance($operation, duration);
        result
    }};
}