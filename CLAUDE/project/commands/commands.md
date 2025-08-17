# Project Commands

## 🔴 CRITICAL: Pre-Validation Checklist

### ALWAYS RUN BEFORE ANY COMMIT OR TASK COMPLETION:
```bash
# 1. Verify application starts
docker-compose up  # or npm run dev:all

# 2. Check all services are healthy
docker-compose ps  # All should be "Up"

# 3. Verify frontend loads
curl http://localhost:3000  # Should return HTML

# 4. Verify backend responds
curl http://localhost:5000/health  # Should return OK

# 5. Run type checking
npm run typecheck

# 6. Run linting
npm run lint

# 7. Run tests
npm run test

# If ANY step fails - STOP and fix before proceeding!
```

## Initial Setup

### Clone and Install
```bash
# Clone repository
git clone https://github.com/your-org/tbi-prop.git
cd tbi-prop

# Install dependencies for all packages
npm run install:all

# Or manually
cd backend && npm install
cd ../frontend && npm install
```

### Environment Setup
```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your values
nano .env
```

### Database Setup
```bash
# Start PostgreSQL (via Docker)
docker-compose up -d postgres redis

# Run database migrations
cd backend
npm run db:migrate

# Seed database with test data (development only)
npm run db:seed

# Generate Prisma client
npm run db:generate
```

## Development Commands

### Starting Development Environment

#### Using Docker Compose (Recommended)
```bash
# Start all services (backend, frontend, db, redis)
docker-compose up

# Start in background
docker-compose up -d

# Start specific services
docker-compose up backend frontend

# Rebuild containers
docker-compose up --build
```

#### Manual Start
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start queue workers
cd backend
npm run queue:worker
```

### Backend Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run typecheck

# Database commands
npm run db:migrate          # Run migrations
npm run db:migrate:create   # Create new migration
npm run db:migrate:undo     # Rollback last migration
npm run db:generate         # Generate Prisma client
npm run db:studio           # Open Prisma Studio GUI
npm run db:seed            # Seed database
npm run db:reset           # Reset database (CAUTION!)

# Queue management
npm run queue:worker        # Start queue worker
npm run queue:dashboard     # Start Bull Dashboard UI (port 3001)
npm run queue:clean        # Clean completed jobs

# Telegram commands
npm run telegram:auth      # Initialize Telegram session
npm run telegram:test      # Test Telegram connection
npm run telegram:parse     # Manual trigger parsing
```

### Frontend Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:ui
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run typecheck

# Bundle analysis
npm run analyze
```

### Testing Commands

#### Unit Tests
```bash
# Backend unit tests
cd backend
npm run test:unit

# Frontend unit tests
cd frontend
npm run test:unit
```

#### Integration Tests
```bash
# Backend integration tests
cd backend
npm run test:integration

# API tests
npm run test:api
```

#### E2E Tests
```bash
# Run E2E tests (requires running application)
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run E2E tests in UI mode
npm run test:e2e:ui

# Generate E2E test report
npm run test:e2e:report
```

## Infrastructure Commands

### Docker Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Execute commands in container
docker-compose exec backend bash
docker-compose exec backend npm run db:migrate

# Clean up
docker-compose down -v  # Remove volumes
docker system prune -a  # Clean everything (CAUTION!)
```

### Deployment Commands

#### Local Deployment Test
```bash
# Build and run production locally
npm run build:all
docker-compose -f docker-compose.prod.yml up
```

#### Digital Ocean Deployment
```bash
# Login to DO registry
doctl registry login

# Build and push images
npm run deploy:build
npm run deploy:push

# Deploy via Ansible
cd infrastructure/ansible
ansible-playbook -i inventory/production deploy.yml

# Or manual deployment
ssh user@server
cd /opt/tbi-prop
docker-compose pull
docker-compose up -d
```

### Database Management
```bash
# Backup database
npm run db:backup

# Restore database
npm run db:restore backup_file.sql

# Export data
npm run db:export

# Database migrations in production
npm run db:migrate:prod
```

## Maintenance Commands

### Monitoring
```bash
# Check service health
npm run health:check

# View application logs
npm run logs:app
npm run logs:queue
npm run logs:error

# Monitor queue status
npm run queue:stats

# Check Telegram parser status
npm run telegram:status
```

### Data Management
```bash
# Clean old listings
npm run listings:clean --days=60

# Reprocess failed AI analyses
npm run ai:reprocess

# Update geocoding for all listings
npm run geo:update:all

# Export listings to CSV
npm run export:listings --format=csv
```

### Cache Management
```bash
# Clear all caches
npm run cache:clear

# Clear specific caches
npm run cache:clear:geo
npm run cache:clear:ai
npm run cache:clear:api

# Warm up caches
npm run cache:warmup
```

## Utility Commands

### Code Generation
```bash
# Generate new NestJS module
cd backend
nest g module modules/module-name
nest g service modules/module-name
nest g controller modules/module-name

# Generate new React component
cd frontend
npm run generate:component ComponentName
npm run generate:page PageName
```

### Documentation
```bash
# Generate API documentation
npm run docs:api

# Generate code documentation
npm run docs:code

# Serve documentation locally
npm run docs:serve
```

### Performance
```bash
# Run performance tests
npm run perf:test

# Profile backend
npm run profile:backend

# Analyze bundle size
npm run analyze:bundle

# Lighthouse audit
npm run audit:lighthouse
```

## CI/CD Commands

### GitHub Actions (automatically triggered)
```bash
# Manual workflow triggers
gh workflow run deploy.yml
gh workflow run test.yml

# View workflow runs
gh run list
gh run view [run-id]
```

### Pre-commit Hooks
```bash
# Install git hooks
npm run prepare

# Run pre-commit checks manually
npm run pre-commit

# Skip hooks (emergency only)
git commit --no-verify
```

## Troubleshooting Commands

### Debug Mode
```bash
# Run backend in debug mode
npm run dev:debug

# Run with verbose logging
LOG_LEVEL=debug npm run dev

# Inspect Node process
npm run inspect
```

### Reset Commands
```bash
# Reset database
npm run db:reset

# Clear all queues
npm run queue:reset

# Reset Telegram session
npm run telegram:reset

# Full reset (CAUTION!)
npm run reset:all
```

### Health Checks
```bash
# Check all services
npm run health:all

# Check specific service
npm run health:db
npm run health:redis
npm run health:telegram
npm run health:ai
```

## Quick Start Commands

### For New Developers
```bash
# One-command setup
npm run setup:dev

# This runs:
# 1. Install dependencies
# 2. Copy env files
# 3. Start Docker services
# 4. Run migrations
# 5. Seed database
# 6. Start dev servers
```

### Daily Development
```bash
# Start everything
npm run dev:all

# Stop everything
npm run stop:all

# Update and restart
npm run update:dev
```

## Production Commands

### Deployment
```bash
# Deploy to production
npm run deploy:prod

# Rollback deployment
npm run deploy:rollback

# View deployment status
npm run deploy:status
```

### Maintenance Mode
```bash
# Enable maintenance mode
npm run maintenance:on

# Disable maintenance mode
npm run maintenance:off
```

### Backup and Restore
```bash
# Automated backup
npm run backup:auto

# Manual backup
npm run backup:manual

# List backups
npm run backup:list

# Restore from backup
npm run restore --backup-id=xxx
```

## Environment-Specific Commands

### Development
```bash
NODE_ENV=development npm run dev
```

### Staging
```bash
NODE_ENV=staging npm run start
```

### Production
```bash
NODE_ENV=production npm run start
```

## Aliases and Shortcuts

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
# TBI Property aliases
alias tbi='cd ~/projects/tbi-prop'
alias tbi-dev='cd ~/projects/tbi-prop && npm run dev:all'
alias tbi-logs='cd ~/projects/tbi-prop && docker-compose logs -f'
alias tbi-test='cd ~/projects/tbi-prop && npm run test:all'
alias tbi-build='cd ~/projects/tbi-prop && npm run build:all'
```