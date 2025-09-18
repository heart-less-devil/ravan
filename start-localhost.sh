#!/bin/bash

echo "🚀 Starting BioPing Application on Localhost..."
echo

echo "📦 Installing dependencies..."
npm install

echo
echo "🔧 Installing server dependencies..."
cd server
npm install
cd ..

echo
echo "🏠 Starting both frontend and backend..."
echo
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:3001"
echo
echo "⏳ Starting servers... (Press Ctrl+C to stop)"
echo

npm run dev 