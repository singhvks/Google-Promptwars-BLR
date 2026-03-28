# Map Dash – Single container (Node.js + Python)
FROM node:18-alpine

WORKDIR /app

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Copy FastAPI backend
COPY backend/requirements.txt ./backend/
RUN pip install --break-system-packages -r ./backend/requirements.txt

COPY backend/ ./backend/

# Copy Node.js frontend
COPY frontend/package.json ./frontend/
RUN cd frontend && npm install --omit=dev

COPY frontend/ ./frontend/

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Cloud Run expects port 8080
EXPOSE 8080

CMD ["./entrypoint.sh"]
