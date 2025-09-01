# Bucket

A desktop video editing workflow application that streamlines video ingest, project creation, and integrates with professional video production tools.

## Overview

Bucket is a powerful desktop application built with Tauri (Rust + React/TypeScript) designed to streamline video editing workflows for professionals. It simplifies video file ingest, automates project creation, and seamlessly integrates with industry-standard tools like Adobe Premiere, Trello, and Sprout Video.

## Key Features

- **Multi-Camera Project Setup**: Organize footage by camera assignment for multi-camera shoots
- **Adobe Premiere Integration**: Automatically generate project templates and folder structures
- **Progress Tracking**: Real-time progress bars for file operations and project creation
- **External Tool Integration**: 
  - **Trello**: Project management and card updates
  - **Sprout Video**: Video hosting with custom posterframe generation
- **Secure User Management**: Login/registration with encrypted data storage
- **Cross-Platform**: Available for Windows, macOS, and Linux

## Installation

### Prerequisites
- Node.js (npm)
- Rust (for development)

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/twentynineteen/ingest-tauri.git
   cd ingest-tauri
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build:tauri
   ```

4. On macOS, open the DMG file in `/target/build/dmg` and copy the app to your Applications folder.

### Development Setup

To run in development mode:
```bash
npm run dev:tauri
```

## How It Works

1. **Select Video Files**: Choose footage files from your file system
2. **Assign Cameras**: Organize files by camera number for multi-camera projects
3. **Configure Project**: Set project title and output folder location
4. **Create Project**: Generate organized folder structure with Adobe Premiere integration
5. **Track Progress**: Monitor file operations with real-time progress updates
6. **Integrate & Upload**: Connect with Trello for project management or Sprout Video for hosting

## Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Tauri 2.0 (Rust)
- **UI Components**: Radix UI + Lucide icons
- **State Management**: Zustand + TanStack React Query
- **Build Tool**: Vite

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
