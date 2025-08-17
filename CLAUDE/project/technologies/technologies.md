# Technologies Used

## Backend Technologies

### NestJS
- **Version**: Latest stable (v10+)
- **Purpose**: Progressive Node.js framework for building efficient, scalable server-side applications
- **Usage**: Main backend framework providing dependency injection, modular architecture, and TypeScript support
- **Key features used**: Modules, Services, Controllers, Guards, Pipes, Interceptors

### Prisma
- **Version**: Latest stable (v5+)
- **Purpose**: Next-generation ORM for TypeScript and Node.js
- **Usage**: Database schema management, migrations, and type-safe database queries
- **Key features used**: Schema definition, migrations, Prisma Client for database operations

### PostgreSQL
- **Version**: 15+
- **Purpose**: Advanced open-source relational database
- **Usage**: Primary data storage for all application entities
- **Key features used**: JSONB fields for metadata, PostGIS extension for geospatial data

### BullMQ
- **Version**: Latest stable
- **Purpose**: Premium queue package for handling distributed jobs
- **Usage**: Managing parsing pipeline and asynchronous job processing
- **Key features used**: Job queues, workers, job scheduling, retry mechanisms

### Redis
- **Version**: 7+
- **Purpose**: In-memory data structure store
- **Usage**: Queue backend for BullMQ, caching layer
- **Key features used**: Pub/sub, key-value storage, queue operations

### Telegram API (MTProto)
- **Library**: Gramjs or similar
- **Purpose**: Telegram client library for parsing channels
- **Usage**: Connecting to Telegram, subscribing to channels, fetching posts
- **Key features used**: Channel subscription, message retrieval, media downloading

### OpenAI API / Anthropic Claude API
- **Purpose**: AI service for text analysis
- **Usage**: Analyzing Telegram posts to identify rental listings and extract structured data
- **Key features used**: Text classification, entity extraction, structured output

### Google Maps Geocoding API
- **Purpose**: Converting addresses to geographic coordinates
- **Usage**: Getting latitude/longitude for listing addresses
- **Key features used**: Address geocoding, reverse geocoding

## Frontend Technologies

### React
- **Version**: 18+
- **Purpose**: JavaScript library for building user interfaces
- **Usage**: Main frontend framework
- **Key features used**: Hooks, Context API, functional components

### TypeScript
- **Version**: 5+
- **Purpose**: Typed superset of JavaScript
- **Usage**: Type safety across the entire frontend codebase
- **Key features used**: Interfaces, type inference, generics

### Vite
- **Version**: 5+
- **Purpose**: Next generation frontend tooling
- **Usage**: Build tool and development server
- **Key features used**: Hot Module Replacement, fast builds, ESM support

### Google Maps JavaScript API
- **Version**: Latest
- **Purpose**: Interactive maps on web pages
- **Usage**: Displaying rental listings on a map
- **Key features used**: Map rendering, markers, clustering, custom controls

### @googlemaps/markerclusterer
- **Purpose**: Marker clustering library for Google Maps
- **Usage**: Grouping nearby markers for better map readability
- **Key features used**: Dynamic clustering based on zoom level

### Chakra UI
- **Version**: 2+
- **Purpose**: Modular and accessible component library
- **Usage**: UI components and theming
- **Key features used**: Components, theme customization, responsive design

### React Query (TanStack Query)
- **Version**: 5+
- **Purpose**: Data fetching and state management
- **Usage**: Server state management, caching, synchronization
- **Key features used**: Query caching, mutations, optimistic updates

### Axios
- **Version**: Latest
- **Purpose**: HTTP client
- **Usage**: API communication with backend
- **Key features used**: Request/response interceptors, error handling

## Infrastructure Technologies

### Docker
- **Version**: Latest stable
- **Purpose**: Containerization platform
- **Usage**: Packaging applications and dependencies
- **Key features used**: Multi-stage builds, Docker Compose for local development

### Docker Compose
- **Version**: v2+
- **Purpose**: Multi-container Docker applications
- **Usage**: Local development environment orchestration
- **Key features used**: Service definitions, networks, volumes

### Ansible
- **Version**: Latest stable
- **Purpose**: Infrastructure automation
- **Usage**: Server provisioning and deployment automation
- **Key features used**: Playbooks, roles, inventory management

### Digital Ocean
- **Purpose**: Cloud infrastructure provider
- **Usage**: Hosting production environment
- **Services used**: Droplets, Managed PostgreSQL, Spaces (for media storage), Load Balancers

### Nginx
- **Version**: Latest stable
- **Purpose**: Web server and reverse proxy
- **Usage**: Serving frontend, proxying API requests
- **Key features used**: Reverse proxy, SSL termination, static file serving

### Certbot / Let's Encrypt
- **Purpose**: SSL certificate management
- **Usage**: Automatic SSL certificate generation and renewal
- **Key features used**: ACME protocol, automatic renewal

## Development Tools

### ESLint
- **Purpose**: JavaScript/TypeScript linter
- **Usage**: Code quality and consistency enforcement

### Prettier
- **Purpose**: Code formatter
- **Usage**: Consistent code formatting

### Jest
- **Purpose**: JavaScript testing framework
- **Usage**: Unit and integration testing for backend

### Vitest
- **Purpose**: Vite-native testing framework
- **Usage**: Unit testing for frontend

### Playwright / Cypress
- **Purpose**: E2E testing framework
- **Usage**: End-to-end testing of user flows

### GitHub Actions
- **Purpose**: CI/CD platform
- **Usage**: Automated testing, building, and deployment

## Monitoring & Logging

### Winston / Pino
- **Purpose**: Logging library
- **Usage**: Structured logging in backend

### Sentry
- **Purpose**: Error tracking and performance monitoring
- **Usage**: Production error monitoring and alerting

### Prometheus + Grafana (optional)
- **Purpose**: Metrics collection and visualization
- **Usage**: System and application metrics monitoring