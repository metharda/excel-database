# Excel Database Management System

Modern, user-friendly Excel file management system. Manage your Excel files like a database with web interface and CLI terminal!

## Features

### Web Interface
- **Modern Design**: Responsive and beautiful design with Tailwind CSS
- **Excel/CSV Upload**: Automatic table creation and data import
- **Advanced Search**: In-table and global search capabilities
- **Data Export**: Download tables in Excel format
- **Modern Web Interface**: React-based, responsive design
- **Terminal CLI**: Powerful command line tool
- **Fast API**: Fast querying with RESTful API

## Installation

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend
python app.py
```

Backend will run at http://localhost:5001.

### 2. Frontend Setup

```bash
# Go to project directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at http://localhost:5173.

### 3. CLI Setup

```bash
# Make CLI executable
chmod +x cli.py

# For system-wide usage (optional)
sudo ln -s $(pwd)/cli.py /usr/local/bin/dbcli
```

## Usage

### Web Interface

1. Go to http://localhost:5173 in your browser
2. View tables from the left panel
3. Use "Upload Excel" button to upload Excel files
4. Search in tables and view data

### Terminal CLI

#### Basic Commands

```bash
# List all tables
python cli.py tables

# Show table content
python cli.py show table_name

# Show with pagination
python cli.py show table_name --page 2

# Search in table
python cli.py show table_name --search "search term"

# Search in all tables
python cli.py search "search term"

# Upload Excel file
python cli.py upload file.xlsx

# Export table
python cli.py export table_name output.xlsx

# Delete table
python cli.py delete table_name
```

#### Interactive Mode

```bash
python cli.py interactive
```

Available commands in interactive mode:
- `tables` or `t`: List tables
- `use <table>`: Select table
- `show [page]`: Show selected table
- `search <term>`: Search in table
- `searchall <term>`: Search in all tables
- `clear`: Clear screen
- `help`: Show help
- `exit`: Exit

### API Endpoints

- `GET /api/tables` - List all tables
- `GET /api/tables/<table_name>` - Get table data
- `POST /api/upload` - Upload Excel/CSV file
- `GET /api/search?q=<query>` - Global search
- `GET /api/export/<table_name>` - Download table as Excel
- `DELETE /api/delete/<table_name>` - Delete table

## Feature Details

### Automatic Table Merging

- Excel files with the same column structure are automatically merged
- New tables are created for different column structures
- Column names are automatically normalized

### Data Security

- SQLite database is used
- No authentication required as it runs locally
- All data is stored locally

### Performance

- Large datasets supported with pagination
- Fast search algorithm
- Optimized database queries

## Development

### Technologies

- **Backend**: Flask, SQLAlchemy, Pandas
- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Database**: SQLite
- **CLI**: Click, Colorama, Tabulate

### Project Structure

```
.
├── app.py              # Flask backend
├── cli.py              # Terminal CLI tool
├── requirements.txt    # Python dependencies
├── databases.db        # SQLite database
├── uploads/            # Temporary upload directory
└── frontend/           # React frontend
    ├── src/
    ├── package.json
    └── ...
```