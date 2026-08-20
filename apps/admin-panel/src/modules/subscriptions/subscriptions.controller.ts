import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
  SubscriptionParamsSchema,
} from './contracts';

@Controller('/subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.subscriptionsService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/subscriptions/:id',
    request: { params: SubscriptionParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof SubscriptionParamsSchema>;
    const sub = await this.subscriptionsService.findById(params.id);
    if (!sub) {
      return c.json({ error: 'Not Found', message: 'Subscription not found' }, 404);
    }
    return sub;
  }

  @Get('/client/:clientId')
  @Contract({
    method: 'GET',
    path: '/subscriptions/client/:clientId',
    request: { params: z.object({ clientId: z.string() }) },
    responses: { 200: z.array(z.object({ id: z.string() })) },
  })
  async findByClientId(c: Context) {
    const params = c.get('kanji.validated.params') as { clientId: string };
    return this.subscriptionsService.findByClientId(params.clientId);
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/subscriptions',
    request: { body: CreateSubscriptionSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreateSubscriptionSchema>;
    try {
      return await this.subscriptionsService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: 'Invalid input data' }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/subscriptions/:id',
    request: { params: SubscriptionParamsSchema, body: UpdateSubscriptionSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof SubscriptionParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdateSubscriptionSchema>;
    const sub = await this.subscriptionsService.update(params.id, body);
    if (!sub) {
      return c.json({ error: 'Not Found', message: 'Subscription not found' }, 404);
    }
    return sub;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/subscriptions/:id',
    request: { params: SubscriptionParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof SubscriptionParamsSchema>;
    const result = await this.subscriptionsService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Subscription not found' }, 404);
    }
    return { success: true };
  }
}
