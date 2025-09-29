#!/bin/bash
# management.sh - Script to help manage the Smart Crowd Management system

# Function to display help message
show_help() {
    echo "Smart Crowd Management System - Management Script"
    echo
    echo "Usage: ./management.sh [command]"
    echo
    echo "Commands:"
    echo "  setup      - Install dependencies and set up the environment"
    echo "  start      - Start all services (backend, frontend)"
    echo "  stop       - Stop all running services"
    echo "  seed       - Populate database with sample data"
    echo "  clean      - Remove temporary files and logs"
    echo "  status     - Check the status of all services"
    echo "  logs       - Show logs for services"
    echo "  help       - Show this help message"
    echo
}

# Setup function
setup() {
    echo "Setting up Smart Crowd Management System..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "Node.js not found. Please install Node.js v14+ first."
        exit 1
    fi
    
    # Check if MongoDB is installed and running
    if ! command -v mongod &> /dev/null; then
        echo "MongoDB not found. Please install MongoDB first."
        exit 1
    fi
    
    # Setup backend
    echo "Setting up backend..."
    cd dashboard/backend || exit
    npm install
    
    # Check if .env exists, if not create from example
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "Created .env file from example. Please update with your settings."
        else
            echo "No .env.example found. Creating basic .env file..."
            echo "MONGODB_URI=mongodb://localhost:27017/crowd-management" > .env
            echo "JWT_SECRET=generate_a_secure_secret_here" >> .env
            echo "JWT_EXPIRE=24h" >> .env
            echo "PORT=5000" >> .env
        fi
    fi
    
    # Setup frontend
    echo "Setting up frontend..."
    cd ../frontend || exit
    npm install
    
    echo "Setup complete!"
    cd ../.. || exit
}

# Start services
start() {
    echo "Starting Smart Crowd Management System..."
    
    # Start backend in background
    cd dashboard/backend || exit
    echo "Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    cd ../..
    
    # Start frontend in background
    cd dashboard/frontend || exit
    echo "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    cd ../..
    
    echo "Services started!"
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    
    # Save PIDs to file for later stopping
    echo "$BACKEND_PID $FRONTEND_PID" > .service_pids
}

# Stop services
stop() {
    echo "Stopping Smart Crowd Management System..."
    
    if [ -f .service_pids ]; then
        read -r BACKEND_PID FRONTEND_PID < .service_pids
        
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || echo "Backend was not running"
        
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || echo "Frontend was not running"
        
        rm .service_pids
    else
        echo "No running services found. If services are running, you may need to stop them manually."
    fi
}

# Seed database
seed() {
    echo "Seeding database with sample data..."
    cd dashboard/backend || exit
    npm run seed
    cd ../..
}

# Clean temporary files
clean() {
    echo "Cleaning temporary files and logs..."
    
    # Clean backend
    cd dashboard/backend || exit
    rm -rf node_modules/.cache
    rm -rf logs/*.log
    cd ../..
    
    # Clean frontend
    cd dashboard/frontend || exit
    rm -rf node_modules/.cache
    rm -rf build
    rm -rf dist
    cd ../..
    
    echo "Cleaning complete!"
}

# Check status
status() {
    echo "Checking service status..."
    
    # Check if backend is running
    if [ -f .service_pids ]; then
        read -r BACKEND_PID FRONTEND_PID < .service_pids
        
        if ps -p "$BACKEND_PID" > /dev/null; then
            echo "Backend: RUNNING (PID: $BACKEND_PID)"
        else
            echo "Backend: STOPPED"
        fi
        
        if ps -p "$FRONTEND_PID" > /dev/null; then
            echo "Frontend: RUNNING (PID: $FRONTEND_PID)"
        else
            echo "Frontend: STOPPED"
        fi
    else
        echo "No running services found"
    fi
    
    # Check MongoDB
    if command -v mongod &> /dev/null; then
        if pgrep mongod > /dev/null; then
            echo "MongoDB: RUNNING"
        else
            echo "MongoDB: STOPPED"
        fi
    else
        echo "MongoDB: NOT INSTALLED"
    fi
}

# Show logs
logs() {
    echo "Showing recent logs..."
    
    # Check if logs directory exists in backend
    if [ -d "dashboard/backend/logs" ]; then
        echo "=== Backend Logs ==="
        tail -n 50 dashboard/backend/logs/*.log
    else
        echo "No backend logs found"
    fi
}

# Check command argument
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Process command
case "$1" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    seed)
        seed
        ;;
    clean)
        clean
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    help)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

exit 0