import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ZodBodyModule } from './zod-body-test.controller';

describe('ZodBody decorator (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZodBodyModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return parsed data when body is valid', async () => {
    const response = await request(app.getHttpServer())
      .post('/test/echo')
      .send({ name: 'John', age: 30 })
      .expect(201);

    expect(response.body).toEqual({ name: 'John', age: 30 });
  });

  it('should return 400 when body is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/test/echo')
      .send({ name: '', age: -1 })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return 400 when body is missing', async () => {
    await request(app.getHttpServer())
      .post('/test/echo')
      .expect(400);
  });

  it('should strip unknown fields via Zod defaults', async () => {
    const response = await request(app.getHttpServer())
      .post('/test/echo')
      .send({ name: 'John', age: 30, extra: true })
      .expect(201);

    expect(response.body).toEqual({ name: 'John', age: 30 });
  });
});
