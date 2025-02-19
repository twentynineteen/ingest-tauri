use std::fs::{File, create_dir_all};
use std::io::Write;
use std::path::Path;
use quick_xml::Writer;
use quick_xml::events::{Event, BytesStart};

#[tauri::command]
pub fn generate_premiere_project(file_path: String) -> Result<String, String> {
   let path = Path::new(&file_path); 
   
   // Ensure parent directory exists
   if let Some(parent) = path.parent() {
      if !parent.exists() {
          if let Err(err) = create_dir_all(parent) {
              return Err(format!("Failed to create directory: {}", err));
          }
      }
  }
   
   let mut writer = Writer::new(Vec::new());

   // Add XML declaration
    writer.write_event(quick_xml::events::Event::Decl(quick_xml::events::BytesDecl::new(
      "1.0",
      Some("UTF-8"),
      Some("yes"),
  )))
  .unwrap();

    // Root Element <PremiereData>
    let mut root = BytesStart::new("PremiereData");
    root.push_attribute(("Version", "1"));
    writer.write_event(Event::Start(root.clone())).unwrap();

    // Add a simple sequence
    let mut sequence = BytesStart::new("Sequence");
    sequence.push_attribute(("ID", "seq1"));
    sequence.push_attribute(("Name", "New Sequence"));
    writer.write_event(Event::Start(sequence.clone())).unwrap();
    writer.write_event(Event::End(sequence.to_end())).unwrap();

    // Close root
    writer.write_event(Event::End(BytesStart::new("PremiereData").to_end())).unwrap();

    // Write to file
    let xml_data = writer.into_inner();
    match File::create(&file_path) {
        Ok(mut file) => {
            if let Err(err) = file.write_all(&xml_data) {
                return Err(format!("Failed to write file: {}", err));
            }
            println!("✅ File saved successfully: {}", file_path); // Debug message
            return Ok(format!("File saved: {}", file_path));
        }
        Err(err) => Err(format!("Failed to create file: {}", err)),
    }
}
