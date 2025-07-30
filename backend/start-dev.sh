#!/bin/bash
echo "Starting Excel Database Management System (Development Mode)"
echo "================================================"
echo "Starting API Server on port 5000..."
python app.py &
API_PID=$!
echo "Starting CLI Terminal Server on port 8080..."
python cli_terminal_server.py &
CLI_PID=$!
echo "Both services started successfully!"
echo "API: http://localhost:5000/api"
echo "CLI: ws://localhost:8080"
echo ""
echo "Monitoring services..."
wait $API_PID $CLI_PID
