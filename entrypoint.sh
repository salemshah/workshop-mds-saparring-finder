#!/bin/sh

echo "📦 Running Prisma client generation..."
npx prisma generate

echo "🚀 Starting the app..."
exec node build/main.js