import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { ClientsService } from './clients.service';
import { CreateClientSchema, UpdateClientSchema, ClientParamsSchema } from './contracts';

@Controller('/clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.clientsService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/clients/:id',
    request: { params: ClientParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ClientParamsSchema>;
    const client = await this.clientsService.findById(params.id);
    if (!client) {
      return c.json({ error: 'Not Found', message: 'Client not found' }, 404);
    }
    return client;
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/clients',
    request: { body: CreateClientSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreateClientSchema>;
    try {
      return await this.clientsService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: 'Invalid input data' }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/clients/:id',
    request: { params: ClientParamsSchema, body: UpdateClientSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ClientParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdateClientSchema>;
    const client = await this.clientsService.update(params.id, body);
    if (!client) {
      return c.json({ error: 'Not Found', message: 'Client not found' }, 404);
    }
    return client;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/clients/:id',
    request: { params: ClientParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ClientParamsSchema>;
    const result = await this.clientsService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Client not found' }, 404);
    }
    return { success: true };
  }
}
