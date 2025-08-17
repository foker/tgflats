import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Listings E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/listings (GET)', () => {
    it('should return paginated listings', () => {
      return request(app.getHttpServer())
        .get('/api/listings')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter listings by price range', () => {
      return request(app.getHttpServer())
        .get('/api/listings?minPrice=500&maxPrice=1000')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          res.body.data.forEach((listing: any) => {
            if (listing.price) {
              expect(listing.price).toBeGreaterThanOrEqual(500);
              expect(listing.price).toBeLessThanOrEqual(1000);
            }
          });
        });
    });

    it('should filter listings by district', () => {
      return request(app.getHttpServer())
        .get('/api/listings?district=Vake')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          res.body.data.forEach((listing: any) => {
            if (listing.district) {
              expect(listing.district.toLowerCase()).toContain('vake');
            }
          });
        });
    });

    it('should handle pagination', () => {
      return request(app.getHttpServer())
        .get('/api/listings?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('/api/listings/stats (GET)', () => {
    it('should return listing statistics', () => {
      return request(app.getHttpServer())
        .get('/api/listings/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalListings');
          expect(res.body).toHaveProperty('activeListings');
          expect(res.body).toHaveProperty('averagePrice');
          expect(res.body).toHaveProperty('listingsByDistrict');
          expect(res.body).toHaveProperty('priceRange');
        });
    });
  });

  describe('/api/listings/search (GET)', () => {
    it('should search listings by query', () => {
      return request(app.getHttpServer())
        .get('/api/listings/search?query=apartment')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return empty results for non-matching query', () => {
      return request(app.getHttpServer())
        .get('/api/listings/search?query=xyznonexistent')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.total).toBe(0);
        });
    });
  });

  describe('/api/listings/map (GET)', () => {
    it('should return map data with coordinates', () => {
      return request(app.getHttpServer())
        .get('/api/listings/map')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((item: any) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('latitude');
            expect(item).toHaveProperty('longitude');
          });
        });
    });
  });

  describe('/api/listings/:id (GET)', () => {
    it('should return 404 for non-existing listing', () => {
      return request(app.getHttpServer())
        .get('/api/listings/non-existing-id')
        .expect(404);
    });
  });

  describe('/api/listings (POST)', () => {
    it('should create a new listing', () => {
      const newListing = {
        district: 'Test District',
        address: 'Test Address 123',
        price: 999,
        currency: 'USD',
        bedrooms: 3,
        areaSqm: 100,
        petsAllowed: true,
        furnished: false,
        description: 'Test listing for E2E tests',
      };

      return request(app.getHttpServer())
        .post('/api/listings')
        .send(newListing)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.district).toBe(newListing.district);
          expect(res.body.price).toBe(newListing.price);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/listings')
        .send({})
        .expect(400);
    });

    it('should validate price is positive', () => {
      return request(app.getHttpServer())
        .post('/api/listings')
        .send({
          district: 'Test',
          price: -100,
        })
        .expect(400);
    });
  });

  describe('WebSocket events', () => {
    it('should connect to WebSocket server', (done) => {
      const io = require('socket.io-client');
      const socket = io(`http://localhost:${process.env.PORT || 3001}`, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error: any) => {
        done(error);
      });
    });
  });
});