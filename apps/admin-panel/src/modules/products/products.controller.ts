import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { ProductsService } from './products.service';
import { CreateProductSchema, UpdateProductSchema, ProductParamsSchema } from './contracts';

@Controller('/products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.productsService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/products/:id',
    request: { params: ProductParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProductParamsSchema>;
    const product = await this.productsService.findById(params.id);
    if (!product) {
      return c.json({ error: 'Not Found', message: 'Product not found' }, 404);
    }
    return product;
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/products',
    request: { body: CreateProductSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreateProductSchema>;
    try {
      return await this.productsService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: (e as Error).message }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/products/:id',
    request: { params: ProductParamsSchema, body: UpdateProductSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProductParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdateProductSchema>;
    const product = await this.productsService.update(params.id, body);
    if (!product) {
      return c.json({ error: 'Not Found', message: 'Product not found' }, 404);
    }
    return product;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/products/:id',
    request: { params: ProductParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProductParamsSchema>;
    const result = await this.productsService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Product not found' }, 404);
    }
    return { success: true };
  }
}
