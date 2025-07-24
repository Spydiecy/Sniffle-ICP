#!/bin/bash

# Function to cleanup existing processes
cleanup_processes() {
  echo "Cleaning up existing processes..."
  
  # Kill all chromium processes
  pkill -f chromium 2>/dev/null || true
  pkill -f playwright 2>/dev/null || true
  
  # Kill any existing Node.js processes related to our project
  pkill -f "node dist/token_scraper.js" 2>/dev/null || true
  pkill -f "node dist/twitter_scraper.js" 2>/dev/null || true
  pkill -f "node dist/ai_analyzer.js" 2>/dev/null || true
  pkill -f "node dist/api-server.js" 2>/dev/null || true
  
  echo "Process cleanup completed."
}

# Cleanup before starting
cleanup_processes

# Check for tmux
if ! command -v tmux &> /dev/null; then
  echo "tmux is not installed. Please install tmux first."
  exit 1
fi

# Check for nvm
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
fi
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm not found. Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  echo "nvm is already installed."
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "npm not found. Installing latest Node.js LTS via nvm..."
  nvm install --lts
else
  echo "npm is already installed."
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found. Installing pnpm..."
  npm install -g pnpm
else
  echo "pnpm is already installed."
fi

# Convert .env.example to .env if needed
if [ -f "$HOME/Sniffle-ICP/.env.example" ] && [ ! -f "$HOME/Sniffle-ICP/.env" ]; then
  mv "$HOME/Sniffle-ICP/.env.example" "$HOME/Sniffle-ICP/.env"
  echo "Moved .env.example to .env"
fi

if ! tmux has-session -t frontend 2>/dev/null; then
    tmux new-session -d -s frontend "cd $HOME/Sniffle-ICP/frontend && pnpm install && pnpm run build && cd $HOME/Sniffle-ICP && dfx start --background && dfx deploy --network ic"
  echo "Started tmux session: backend"
else
  echo "tmux session 'backend' already exists."
fi
# Start backend session (API server, AI analyzer, Twitter scraper) with auto-restart
if ! tmux has-session -t backend 2>/dev/null; then
  tmux new-session -d -s backend "bash -c 'while true; do cd $HOME/Sniffle-ICP/backend && pnpm install && pnpm exec playwright install && pnpm exec playwright install-deps && pnpm build && pnpm exec concurrently \"node dist/twitter_scraper.js\" \"node dist/ai_analyzer.js\" \"node dist/api-server.js\"; echo \"backend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: backend"
else
  echo "tmux session 'backend' already exists."
fi

# Start token scraper session with 5min run / 5min stop cycle
if ! tmux has-session -t scraper 2>/dev/null; then
  tmux new-session -d -s scraper "bash -c 'while true; do cd $HOME/Sniffle-ICP/backend && pnpm install && pnpm exec playwright install && pnpm exec playwright install-deps && pnpm build && pnpm exec node dist/token_scraper.js; echo \"token scraper crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: scraper"
else
  echo "tmux session 'scraper' already exists."
fi

if ! tmux has-session -t agent 2>/dev/null; then
  tmux new-session -d -s agent "bash -c 'while true; do cd $HOME/Sniffle-ICP/agent && source venv/bin/activate && uvicorn api:app --host 0.0.0.0 --port 8000 --reload; echo \"agent API crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: agent (API mode)"
else
  echo "tmux session 'agent' already exists (API mode)."
fi

# List sessions
sleep 1
tmux ls
