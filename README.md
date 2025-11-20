<!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️--><h1 align="center">bucket</h1>

{{ template: badges }}

<p align="center">
  <b>A desktop video editing workflow application that streamlines video ingest, project creation, and integrates with professional video production tools.</b></br>
  <sub><sub>
</p>

<br />



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#table-of-contents)

## ➤ Table of Contents

	* [➤ Overview](#-overview)
	* [➤ Key Features](#-key-features)
	* [➤ Installation](#-installation)
		* [Prerequisites](#prerequisites)
		* [Quick Start](#quick-start)
		* [Development Setup](#development-setup)
	* [➤ Ollama Setup](#-ollama-setup)
		* [Installing Ollama](#installing-ollama)
		* [Running Ollama](#running-ollama)
* [➤ Ollama typically starts automatically on macOS/Windows](#-ollama-typically-starts-automatically-on-macoswindows)
* [➤ On Linux, you may need to start it manually:](#-on-linux-you-may-need-to-start-it-manually)
		* [Installing AI Models](#installing-ai-models)
* [➤ script formatting:](#-script-formatting)
* [➤ script embedding:](#-script-embedding)
* [➤ Required for adding new scripts to database](#-required-for-adding-new-scripts-to-database)
* [➤ List installed models:](#-list-installed-models)
		* [Configuring in Bucket](#configuring-in-bucket)
		* [Troubleshooting Ollama](#troubleshooting-ollama)
* [➤ Check if Ollama is running:](#-check-if-ollama-is-running)
* [➤ If not running, start it:](#-if-not-running-start-it)
* [➤ List installed models:](#-list-installed-models-1)
* [➤ Install a model:](#-install-a-model)
	* [➤ How It Works](#-how-it-works)
		* [AI Script Formatter Workflow](#ai-script-formatter-workflow)
		* [Video Project Workflow](#video-project-workflow)
	* [➤ Tech Stack](#-tech-stack)
	* [➤ License](#-license)


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#overview)

## ➤ Overview

Bucket is a powerful desktop application built with Tauri (Rust + React/TypeScript) designed to streamline video editing workflows for professionals. It simplifies video file ingest, automates project creation, and seamlessly integrates with industry-standard tools like Adobe Premiere, Trello, and Sprout Video.


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#key-features)

## ➤ Key Features

- **AI Script Formatter**: AI-powered autocue script formatting using locally hosted LLM models
  - Upload Word documents (.docx) and format them for teleprompter use
  - Text editor to review and update AI changes
  - Edit and refine AI suggestions before exporting
  - Powered by local Ollama models (no cloud required)
- **Multi-Camera Project Setup**: Organize footage by camera assignment for multi-camera shoots
- **Adobe Premiere Integration**: Automatically generate project templates and folder structures
- **Progress Tracking**: Real-time progress bars for file operations and project creation
- **External Tool Integration**:
  - **Trello**: Project management and card updates
  - **Sprout Video**: Video hosting with custom posterframe generation
- **Secure User Management**: Login/registration with encrypted data storage
- **Cross-Platform**: Available for Windows, macOS, and Linux


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#installation)

## ➤ Installation

### Prerequisites

- Node.js (npm) or Bun
- Rust (for development)
- **Ollama** (for AI Script Formatter feature) - see [Ollama Setup](#ollama-setup) below

### Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/twentynineteen/ingest-tauri.git
   cd ingest-tauri
   ```

2. Install dependencies:

   ```bash
   bun install
   # or
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


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#ollama-setup)

## ➤ Ollama Setup

The AI Script Formatter feature requires Ollama to be installed and running locally.

### Installing Ollama

1. Download and install Ollama from [ollama.com](https://ollama.com)
   - **macOS**: Download the `.dmg` installer
   - **Linux**: Run `curl -fsSL https://ollama.com/install.sh | sh`
   - **Windows**: Download from the Ollama website

2. Verify installation:
   ```bash
   ollama --version
   ```

### Running Ollama

Ollama runs as a background service. To start it:

```bash

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#ollama-typically-starts-automatically-on-macoswindows)

# ➤ Ollama typically starts automatically on macOS/Windows

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#on-linux-you-may-need-to-start-it-manually)

# ➤ On Linux, you may need to start it manually:
ollama serve
```

The service runs on `http://localhost:11434` by default.

### Installing AI Models

Before using the Script Formatter, download the following language models:

```bash

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#script-formatting)

# ➤ script formatting:
ollama pull llama3.1:latest       # Fast, good quality (8B parameters)

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#script-embedding)

# ➤ script embedding:
ollama pull nomic-embed-text:latest

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#required-for-adding-new-scripts-to-database)

# ➤ Required for adding new scripts to database


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#list-installed-models)

# ➤ List installed models:
ollama list
```

**Model Selection Tips:**

- **llama3.2**: Best for quick formatting on limited hardware

### Configuring in Bucket

1. Launch Bucket and navigate to **Settings**
2. Find the **Ollama URL** field (default: `http://localhost:11434`)
3. Update the URL if needed and click **Save**
4. Click **Test Connection** to verify Ollama is running and see how many models are available
5. Navigate to **AI Tools > Script Formatter** to start formatting scripts

### Troubleshooting Ollama

**Connection Failed:**

```bash

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#check-if-ollama-is-running)

# ➤ Check if Ollama is running:
curl http://localhost:11434/api/tags


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#if-not-running-start-it)

# ➤ If not running, start it:
ollama serve
```

**No Models Available:**

```bash

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#list-installed-models)

# ➤ List installed models:
ollama list


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#install-a-model)

# ➤ Install a model:
ollama pull llama3:latest
```

**Port Conflicts:**
If port 11434 is in use, you can run Ollama on a different port:

```bash
OLLAMA_HOST=0.0.0.0:11435 ollama serve
```

Then update the URL in Bucket Settings to `http://localhost:11435`


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#how-it-works)

## ➤ How It Works

### AI Script Formatter Workflow

1. **Upload Script**: Select a `.docx` file from your computer (up to 1GB)
2. **Select AI Model**: Choose from available Ollama models running on your machine
3. **AI Processing**: The script is automatically formatted for autocue/teleprompter readability
4. **Review Changes**: View side-by-side diff showing original vs. AI-formatted text
5. **Edit & Refine**: Make manual adjustments to the AI's suggestions if needed
6. **Export**: Download the formatted script as a `.docx` file ready for teleprompter use

### Video Project Workflow

1. **Select Video Files**: Choose footage files from your file system
2. **Assign Cameras**: Organize files by camera number for multi-camera projects
3. **Configure Project**: Set project title and output folder location
4. **Create Project**: Generate organized folder structure with Adobe Premiere integration
5. **Track Progress**: Monitor file operations with real-time progress updates
6. **Integrate & Upload**: Connect with Trello for project management or Sprout Video for hosting


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#tech-stack)

## ➤ Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Tauri 2.0 (Rust)
- **UI Components**: Radix UI + Lucide icons
- **State Management**: Zustand + TanStack React Query
- **Build Tool**: Vite
- **AI Integration**:
  - Vercel AI SDK v5 for unified provider interface
  - Ollama (local LLM runtime)
  - Monaco Editor for diff visualization and editing
  - mammoth.js for Word document parsing
  - docx for document generation



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png)](#license)

## ➤ License
	
Licensed under [UNLICENSED](https://opensource.org/licenses/UNLICENSED).
