# Frontend Docker Setup

Docker configuration for the React frontend application.

## Quick Start

### Development Mode

```bash
# Start development server with hot reload
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The app will be available at http://localhost:3000

### Production Build

```bash
# Build production image
docker build \
  --build-arg REACT_APP_API_URL=http://your-api-url \
  --build-arg REACT_APP_CLERK_PUBLISHABLE_KEY=your_key \
  -t todolist-frontend:latest .

# Run production container
docker run -p 80:80 todolist-frontend:latest
```

The app will be available at http://localhost

## Environment Variables

Create a `.env` file in this directory:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
REACT_APP_ENVIRONMENT=development
```

## Available Dockerfiles

### `Dockerfile` (Production)
- Multi-stage build with Node.js build stage
- Nginx serving static files
- Optimized for production deployment
- Smaller image size (~50MB)

### `Dockerfile.dev` (Development)
- Hot reload enabled
- Development server (port 3000)
- Source code mounted as volume
- Faster startup, larger image

## Docker Commands

### Development

```bash
# Start with docker-compose
docker-compose up -d

# Start with custom env file
docker-compose --env-file .env.production up -d

# Rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production

```bash
# Build image
docker build -t todolist-frontend:prod .

# Build with environment variables
docker build \
  --build-arg REACT_APP_API_URL=https://api.example.com \
  --build-arg REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_... \
  -t todolist-frontend:prod .

# Run container
docker run -d \
  -p 80:80 \
  --name todolist-frontend \
  todolist-frontend:prod

# Stop container
docker stop todolist-frontend
docker rm todolist-frontend
```

### Direct Docker (without docker-compose)

**Development:**
```bash
docker build -f Dockerfile.dev -t todolist-frontend:dev .
docker run -d \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e REACT_APP_API_URL=http://localhost:8000 \
  -e REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_... \
  --name todolist-frontend-dev \
  todolist-frontend:dev
```

**Production:**
```bash
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:8000 \
  --build-arg REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_... \
  -t todolist-frontend:prod .

docker run -d \
  -p 80:80 \
  --name todolist-frontend-prod \
  todolist-frontend:prod
```

## Files

- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development with hot reload
- `docker-compose.yml` - Development orchestration
- `.dockerignore` - Files to exclude from build
- `nginx.conf` - Nginx configuration for production

## Health Checks

### Development
```bash
curl http://localhost:3000
```

### Production
```bash
curl http://localhost:80/health
```

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"
```

### Hot reload not working
- Ensure `CHOKIDAR_USEPOLLING=true` is set
- Check volume mounts are correct
- Verify source code is mounted: `docker exec -it todolist-frontend-dev ls /app`

### Environment variables not loading
- Verify `.env` file exists
- Check variables are prefixed with `REACT_APP_`
- For production builds, pass as `--build-arg`
- Restart container after changing `.env`

### Build fails
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Permission issues
```bash
# Fix node_modules permissions
docker-compose down
rm -rf node_modules
docker-compose up -d --build
```

## Production Deployment

### Using docker-compose

1. Edit `docker-compose.yml`, comment out `frontend-dev`, uncomment `frontend-prod`
2. Set production environment variables
3. Run:
```bash
docker-compose up -d --build
```

### Manual Deployment

```bash
# Build
docker build \
  --build-arg REACT_APP_API_URL=https://api.yourdomain.com \
  --build-arg REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg REACT_APP_ENVIRONMENT=production \
  -t todolist-frontend:latest .

# Tag for registry
docker tag todolist-frontend:latest registry.example.com/todolist-frontend:latest

# Push to registry
docker push registry.example.com/todolist-frontend:latest

# Deploy on server
docker pull registry.example.com/todolist-frontend:latest
docker run -d -p 80:80 registry.example.com/todolist-frontend:latest
```

## Integration with Backend

This frontend is designed to work with a separate backend service. Configure the backend URL:

**Development:**
```bash
REACT_APP_API_URL=http://localhost:8000
```

**Production:**
```bash
REACT_APP_API_URL=https://api.yourdomain.com
```

**Docker Network (if backend in same Docker network):**
```bash
REACT_APP_API_URL=http://backend:8000
```

## Performance Optimization

The production Dockerfile includes:
- Multi-stage build for smaller images
- Nginx with gzip compression
- Static asset caching
- Security headers
- Health check endpoint

## Security

- No secrets in image (passed as build args)
- Non-root user in production
- Security headers configured in nginx
- Health check for monitoring
- Minimal attack surface

## Monitoring

```bash
# View container stats
docker stats todolist-frontend-dev

# View logs
docker logs -f todolist-frontend-dev

# Inspect container
docker inspect todolist-frontend-dev

# Execute commands
docker exec -it todolist-frontend-dev sh
```
