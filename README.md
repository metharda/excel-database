# Excel Database Management System

A modern, full-stack Excel file management system with web interface and CLI terminal integration. Transform your Excel files into a queryable database with advanced search capabilities.

## Features

### Web Interface
- **Drag & Drop Upload**: Upload Excel files (.xlsx, .xls, .csv) by dragging them anywhere on the page
- **Multi-language Support**: English and Turkish language options
- **Advanced Search**: Global search across all tables with real-time filtering
- **Data Management**: View, search, export, and delete tables with pagination
- **Row Selection**: Select and export specific rows with modern checkboxes
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Integrated Terminal**: Built-in web terminal for CLI operations

### Backend API
- **RESTful API**: Fast Flask-based backend with SQLAlchemy ORM
- **Redis Caching**: Optional Redis integration for improved performance
- **File Processing**: Automatic Excel/CSV parsing with pandas
- **Data Export**: Download tables in Excel (.xlsx) or CSV format
- **Search Engine**: Configurable search with up to 5000 results

### Command Line Interface
- **Interactive Mode**: Full-featured CLI with command history
- **Database Operations**: Create, read, update, delete operations
- **Batch Processing**: Upload multiple files and perform bulk operations

## Quick Start

### Using Docker (Recommended)

```bash
# Production setup
make install
make up

# Development setup
make dev
```

### Manual Installation

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Usage

### Web Interface
1. Open http://localhost:5173 in your browser
2. Drag and drop Excel files anywhere on the page or use the upload button
3. Select tables from the left panel to view data
4. Use global search to find data across all tables
5. Select rows and export specific data

### CLI Terminal
```bash
# Access via web terminal or direct CLI
python cli.py interactive

# Basic commands
python cli.py upload file.xlsx
python cli.py tables
python cli.py show table_name
python cli.py search "search term"
python cli.py export table_name output.xlsx
python cli.py export table_name output.csv --format csv
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | List all tables |
| GET | `/api/tables/<name>` | Get table data with pagination |
| POST | `/api/upload` | Upload Excel/CSV files |
| GET | `/api/search` | Global search with limit parameter |
| GET | `/api/export/<name>` | Download table as Excel or CSV (format parameter optional) |
| DELETE | `/api/delete/<name>` | Delete table |

## Docker Services

The application includes multiple services orchestrated with Docker Compose:

- **Backend API**: Flask server on port 5001
- **Frontend**: React application on port 5173  
- **CLI Terminal**: Interactive terminal server
- **Redis**: Optional caching layer
- **Nginx**: Production reverse proxy

## Development

### Available Make Commands

```bash
make help          # Show all available commands
make dev           # Start development environment
make build         # Rebuild Docker images
make logs          # View service logs
make clean         # Clean up containers and volumes
make backup        # Backup database
make restore       # Restore database
```

### Technology Stack

**Frontend**: React 18, Tailwind CSS, Lucide Icons, XLSX.js  
**Backend**: Flask, SQLAlchemy, Pandas, Redis  
**Database**: SQLite with optional Redis caching  
**Infrastructure**: Docker, Nginx, Docker Compose

### Project Structure

```
├── backend/
│   ├── app.py              # Flask API server
│   ├── cli.py              # Command line interface
│   ├── cli_terminal_server.py # Web terminal server
│   ├── requirements.txt    # Python dependencies
│   └── data/              # SQLite database storage
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React application
│   │   └── components/    # Reusable components
│   ├── package.json       # Node.js dependencies
│   └── dist/             # Production build
├── docker-compose.yml     # Production orchestration
├── docker-compose.dev.yml # Development orchestration
└── Makefile              # Automation commands
```

## Features in Detail

### Drag & Drop Upload
- Detects file types automatically
- Works across the entire page surface
- Visual feedback with overlay animations
- Supports multiple Excel formats

### Advanced Search
- Real-time search across all tables
- Configurable result limits (up to 5000)
- Search term highlighting
- Filter results within search results

### Data Management
- Automatic table creation from Excel sheets
- Smart column mapping and normalization
- Pagination for large datasets (20 records per page)
- Row-level selection with bulk export

### Multi-language Support
- Complete English/Turkish translations
- Dynamic language switching
- Localized date and number formats