import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';  // Changed import
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/auth/login (POST) - should return JWT token', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test', password: 'password' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('/profile (GET) - should return 401 without token', () => {
      return supertest(app.getHttpServer()).get('/profile').expect(401);
    });

    it('/profile (GET) - should return user profile with valid token', async () => {
      // First, get the token
      const loginRes = await supertest(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test', password: 'password' });

      const token = loginRes.body.access_token;

      // Then, use the token to access protected route
      return supertest(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('username');
        });
    });
  });

  describe('Auth Tokens', () => {
    it('/auth/login (POST) - should return both access and refresh tokens', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test', password: 'password' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.refresh_token).toBe('string');
    });

    it('/auth/refresh (POST) - should return new access token with valid refresh token', async () => {
      // First get tokens
      const loginRes = await supertest(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'test', password: 'password' });

      const refreshToken = loginRes.body.refresh_token;

      // Then use refresh token to get new access token
      const refreshRes = await supertest(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(201);

      expect(refreshRes.body).toHaveProperty('access_token');
      expect(typeof refreshRes.body.access_token).toBe('string');
    });

    it('/auth/refresh (POST) - should fail with invalid refresh token', () => {
      return supertest(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
