import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { PaymentsService } from './payments.service';
import { CreatePaymentSchema, UpdatePaymentSchema, PaymentParamsSchema } from './contracts';

@Controller('/payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.paymentsService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/payments/:id',
    request: { params: PaymentParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PaymentParamsSchema>;
    const payment = await this.paymentsService.findById(params.id);
    if (!payment) {
      return c.json({ error: 'Not Found', message: 'Payment not found' }, 404);
    }
    return payment;
  }

  @Get('/client/:clientId')
  @Contract({
    method: 'GET',
    path: '/payments/client/:clientId',
    request: { params: z.object({ clientId: z.string() }) },
    responses: { 200: z.array(z.object({ id: z.string() })) },
  })
  async findByClientId(c: Context) {
    const params = c.get('kanji.validated.params') as { clientId: string };
    return this.paymentsService.findByClientId(params.clientId);
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/payments',
    request: { body: CreatePaymentSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreatePaymentSchema>;
    try {
      return await this.paymentsService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: 'Invalid input data' }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/payments/:id',
    request: { params: PaymentParamsSchema, body: UpdatePaymentSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PaymentParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdatePaymentSchema>;
    const payment = await this.paymentsService.update(params.id, body);
    if (!payment) {
      return c.json({ error: 'Not Found', message: 'Payment not found' }, 404);
    }
    return payment;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/payments/:id',
    request: { params: PaymentParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof PaymentParamsSchema>;
    const result = await this.paymentsService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Payment not found' }, 404);
    }
    return { success: true };
  }
}
