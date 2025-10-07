#!/bin/bash

set -e  # Exit on any error

echo "🚀 Setting up ChatKit Link workspace..."

# Check for required tools
echo "Checking for required tools..."

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed. Please install Python 3 first."
    exit 1
fi

if ! command -v pip3 &> /dev/null; then
    echo "❌ Error: pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ All required tools found"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

# Setup .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  WARNING: Please edit .env and add your OPENAI_API_KEY before running the app"
else
    echo "✅ .env file already exists"
fi

echo "✨ Setup complete! You can now run the app."
