#!/bin/sh

set -e

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=src/prisma/schema.prisma

# Start the application
echo "Starting the application..."
exec node build/server.js