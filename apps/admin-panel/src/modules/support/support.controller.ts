import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { SupportService } from './support.service';
import { CreateTicketSchema, UpdateTicketSchema, TicketParamsSchema } from './contracts';

@Controller('/support')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.supportService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/support/:id',
    request: { params: TicketParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof TicketParamsSchema>;
    const ticket = await this.supportService.findById(params.id);
    if (!ticket) {
      return c.json({ error: 'Not Found', message: 'Ticket not found' }, 404);
    }
    return ticket;
  }

  @Get('/client/:clientId')
  @Contract({
    method: 'GET',
    path: '/support/client/:clientId',
    request: { params: z.object({ clientId: z.string() }) },
    responses: { 200: z.array(z.object({ id: z.string() })) },
  })
  async findByClientId(c: Context) {
    const params = c.get('kanji.validated.params') as { clientId: string };
    return this.supportService.findByClientId(params.clientId);
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/support',
    request: { body: CreateTicketSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreateTicketSchema>;
    try {
      return await this.supportService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: 'Invalid input data' }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/support/:id',
    request: { params: TicketParamsSchema, body: UpdateTicketSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof TicketParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdateTicketSchema>;
    const ticket = await this.supportService.update(params.id, body);
    if (!ticket) {
      return c.json({ error: 'Not Found', message: 'Ticket not found' }, 404);
    }
    return ticket;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/support/:id',
    request: { params: TicketParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof TicketParamsSchema>;
    const result = await this.supportService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Ticket not found' }, 404);
    }
    return { success: true };
  }
}
