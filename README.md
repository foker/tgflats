# TBI-Prop - Tbilisi Property Rental Platform

A full-stack application for aggregating and displaying property rentals in Tbilisi from various Telegram channels.

## Features

- 🏠 Property listing aggregation from Telegram channels
- 🗺️ Interactive map with clustered markers
- 📋 List view with advanced filtering
- 🔍 Smart search functionality
- 🤖 AI-powered property analysis
- 📍 Automatic geocoding
- 📱 Responsive design

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Redis** - Caching and queues
- **BullMQ** - Job queue processing
- **WebSocket** - Real-time updates

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Chakra UI** - Component library
- **React Query** - Data fetching
- **Google Maps API** - Map visualization

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tbi-prop
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api

## Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Google Maps API key
- Telegram Bot Token (optional)
- OpenAI API key (optional)

### Local Development

1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

## API Endpoints

- `GET /api/listings` - Get all listings with filters
- `GET /api/listings/:id` - Get specific listing
- `POST /api/listings` - Create new listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/listings/search` - Search listings
- `GET /api/listings/stats` - Get statistics

## Project Structure

```
tbi-prop/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Shared utilities
│   │   └── main.ts         # Application entry
│   ├── prisma/            # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml     # Docker services
└── .env.example          # Environment template
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License