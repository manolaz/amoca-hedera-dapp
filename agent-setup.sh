#!/bin/bash
set -euo pipefail

# Agent setup script for Hedera App
# This script installs dependencies and prepares the project for development.

# Copy environment template if .env does not exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Run lint checks
echo "Running linter..."
npm run lint

# Build the project
echo "Building project..."
if ! npm run build; then
  echo "Build failed. Fix errors before running the application."
fi

echo "Agent setup complete."
