use std::fs::{File, create_dir_all};
use std::io::Write;
use std::path::Path;
use quick_xml::Writer;
use quick_xml::events::{Event, BytesStart, BytesDecl, BytesText};

#[tauri::command]
pub fn generate_premiere_project(file_path: String, files: Vec<String>) -> Result<String, String> {
    let path = Path::new(&file_path);

    println!("🚀 Creating Premiere Pro 2025 project: {}", file_path);

    // Ensure the parent directory exists
    if let Some(parent) = path.parent() {
        println!("📂 Checking project directory: {:?}", parent);
        if !parent.exists() {
            println!("❗ Directory missing. Creating...");
            create_dir_all(parent).map_err(|err| format!("❌ Failed to create directory: {}", err))?;
            println!("✅ Directory created successfully!");
        }
    }

    // Start writing XML structure
    let mut writer = Writer::new(Vec::new());

    // Add XML declaration
    writer
        .write_event(Event::Decl(BytesDecl::new("1.0", Some("UTF-8"), Some("yes"))))
        .unwrap();

    // Root <Project>
    let mut project = BytesStart::new("Project");
    project.push_attribute(("Version", "47")); // Premiere 2025 XML version
    writer.write_event(Event::Start(project.clone())).unwrap();

    // 🔹 MEDIA BIN (to store imported video/audio)
    writer.write_event(Event::Start(BytesStart::new("MediaBin"))).unwrap();

    for (i, file) in files.iter().enumerate() {
        let mut clip = BytesStart::new("Clip");
        clip.push_attribute(("ID", format!("clip-{}", i).as_str()));
        writer.write_event(Event::Start(clip.clone())).unwrap();

        writer.write_event(Event::Start(BytesStart::new("Name"))).unwrap();
        writer.write_event(Event::Text(BytesText::new(
            Path::new(file).file_name().unwrap().to_str().unwrap(),
        )))
        .unwrap();
        writer.write_event(Event::End(BytesStart::new("Name").to_end())).unwrap();

        writer.write_event(Event::Start(BytesStart::new("FilePath"))).unwrap();
        writer.write_event(Event::Text(BytesText::new(file))).unwrap();
        writer.write_event(Event::End(BytesStart::new("FilePath").to_end())).unwrap();

        writer.write_event(Event::End(clip.to_end())).unwrap();
    }

    writer.write_event(Event::End(BytesStart::new("MediaBin").to_end())).unwrap();

    // 🔹 SEQUENCE SETUP
    let mut sequence = BytesStart::new("Sequence");
    sequence.push_attribute(("ID", "seq-1"));
    sequence.push_attribute(("FrameWidth", "3840"));
    sequence.push_attribute(("FrameHeight", "2160"));
    sequence.push_attribute(("Timebase", "50"));
    sequence.push_attribute(("Codec", "ProRes 422"));

    writer.write_event(Event::Start(sequence.clone())).unwrap();

    writer.write_event(Event::Start(BytesStart::new("Tracks"))).unwrap();

    // 🔹 VIDEO TRACKS
    writer.write_event(Event::Start(BytesStart::new("VideoTracks"))).unwrap();

    for (i, _file) in files.iter().enumerate() {
        let mut track = BytesStart::new("Track");
    
        // FIX: Convert `format!()` output to `&str`
        track.push_attribute(("ID", format!("video-{}", i).as_str()));
    
        writer.write_event(Event::Start(track.clone())).unwrap();
        writer.write_event(Event::Start(BytesStart::new("ClipRef"))).unwrap();
        writer.write_event(Event::Text(BytesText::new(&format!("clip-{}", i)))).unwrap();
        writer.write_event(Event::End(BytesStart::new("ClipRef").to_end())).unwrap();
        writer.write_event(Event::End(track.to_end())).unwrap();
    }

    writer.write_event(Event::End(BytesStart::new("VideoTracks").to_end())).unwrap(); // ✅ FIXED

    // 🔹 AUDIO TRACKS
    writer.write_event(Event::Start(BytesStart::new("AudioTracks"))).unwrap();
    
    for (i, _file) in files.iter().enumerate() {
        let mut track = BytesStart::new("Track");
    
        // Convert `format!()` output to `&str` before passing to `push_attribute`
        track.push_attribute(("ID", format!("audio-{}", i).as_str()));
    
        writer.write_event(Event::Start(track.clone())).unwrap();
        writer.write_event(Event::Start(BytesStart::new("ClipRef"))).unwrap();
        writer.write_event(Event::Text(BytesText::new(&format!("clip-{}", i)))).unwrap();
        writer.write_event(Event::End(BytesStart::new("ClipRef").to_end())).unwrap();
        writer.write_event(Event::End(track.to_end())).unwrap();
    }
    

    writer.write_event(Event::End(BytesStart::new("AudioTracks").to_end())).unwrap(); // ✅ FIXED

    writer.write_event(Event::End(BytesStart::new("Tracks").to_end())).unwrap();
    writer.write_event(Event::End(sequence.to_end())).unwrap();

    // Close <Project>
    writer.write_event(Event::End(BytesStart::new("Project").to_end())).unwrap();

    // Convert XML data to bytes and write to file
    let xml_data = writer.into_inner();
    match File::create(&file_path) {
        Ok(mut file) => {
            file.write_all(&xml_data).map_err(|err| format!("Failed to write file: {}", err))?;
            println!("✅ Premiere Pro project created: {}", file_path);
            Ok(format!("File saved: {:?}", file_path))
        }
        Err(err) => Err(format!("Failed to create file: {}", err)),
    }
}
