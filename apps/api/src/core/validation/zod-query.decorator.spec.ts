import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ZodQueryModule } from './zod-query-test.controller';

describe('ZodQuery decorator (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ZodQueryModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should parse query params when valid', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/query?from=abc&limit=10')
      .expect(200);

    expect(response.body).toEqual({ from: 'abc', limit: 10 });
  });

  it('should handle empty query', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/query')
      .expect(200);

    expect(response.body).toEqual({});
  });

  it('should return 400 when query validation fails', async () => {
    await request(app.getHttpServer())
      .get('/test/query?limit=abc')
      .expect(400);
  });
});
