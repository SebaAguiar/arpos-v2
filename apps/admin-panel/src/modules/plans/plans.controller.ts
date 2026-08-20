import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { PlansService } from './plans.service';
import { CreatePlanSchema, UpdatePlanSchema, PlanParamsSchema } from './contracts';

@Controller('/plans')
@UseGuards(AuthGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.plansService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/plans/:id',
    request: { params: PlanParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PlanParamsSchema>;
    const plan = await this.plansService.findById(params.id);
    if (!plan) {
      return c.json({ error: 'Not Found', message: 'Plan not found' }, 404);
    }
    return plan;
  }

  @Get('/product/:productId')
  @Contract({
    method: 'GET',
    path: '/plans/product/:productId',
    request: { params: z.object({ productId: z.string() }) },
    responses: { 200: z.array(z.object({ id: z.string() })) },
  })
  async findByProductId(c: Context) {
    const params = c.get('kanji.validated.params') as { productId: string };
    return this.plansService.findByProductId(params.productId);
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/plans',
    request: { body: CreatePlanSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreatePlanSchema>;
    try {
      return await this.plansService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: 'Invalid input data' }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/plans/:id',
    request: { params: PlanParamsSchema, body: UpdatePlanSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PlanParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdatePlanSchema>;
    const plan = await this.plansService.update(params.id, body);
    if (!plan) {
      return c.json({ error: 'Not Found', message: 'Plan not found' }, 404);
    }
    return plan;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/plans/:id',
    request: { params: PlanParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PlanParamsSchema>;
    const result = await this.plansService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Plan not found' }, 404);
    }
    return { success: true };
  }
}
