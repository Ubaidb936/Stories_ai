# Stage 1: Build the React app
FROM node:16-alpine AS build-react

# Set working directory for React app
WORKDIR /app/frontend

# Copy package.json and package-lock.json to install dependencies
COPY frontend/package.json frontend/package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy all files from the frontend directory to the working directory
COPY frontend/ .

# Build the React app
RUN npm run build

# Stage 2: Set up the FastAPI app
FROM python:3.11.4-slim AS fastapi-app

# Set working directory for FastAPI app
WORKDIR /app

# Copy requirements.txt to install Python dependencies
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the built React app from the previous stage
COPY --from=build-react /app/frontend/build /app/frontend/build

# Copy the FastAPI application code
COPY main.py .
# Copy the services folder
COPY services ./services
# Copy the data folder
COPY data ./data

# Expose the port for FastAPI
EXPOSE 8000

# Command to run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]