# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend with FastAPI
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for audio
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend, samples and docs
COPY backend/ ./backend/
COPY samples/ ./samples/
COPY docs/ ./docs/

# Copy built frontend from Stage 1 into backend static directory
COPY --from=frontend-builder /frontend/dist ./frontend/dist

ENV PORT=8080
ENV HOST=0.0.0.0

CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}
