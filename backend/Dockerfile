FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy backend application files
COPY backend/ ./

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 8000

# Run FastAPI app from inside the backend directory so relative imports work
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
