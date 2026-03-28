#!/bin/sh

# Set default API URL if not provided
export API_URL=${API_URL:-http://localhost:8000}

echo "Starting FastAPI backend..."
cd /app/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 &
FASTAPI_PID=$!

echo "Waiting for FastAPI backend to warm up..."
while ! nc -z 127.0.0.1 8000; do
  sleep 0.2
done
echo "FastAPI backend is ready!"

echo "Starting Genkit frontend on port 8080..."
cd /app/frontend
npm run start

# Clean up on exit
kill $FASTAPI_PID 2>/dev/null || true
