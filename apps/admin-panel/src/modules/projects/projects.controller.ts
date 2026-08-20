import { Injectable } from '@kanjijs/core';
import { Controller, Get, Post, Patch, Delete } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { ProjectsService } from './projects.service';
import { CreateProjectSchema, UpdateProjectSchema, ProjectParamsSchema } from './contracts';

@Controller('/projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get('/')
  async findAll(c: Context) {
    return this.projectsService.findAll();
  }

  @Get('/:id')
  @Contract({
    method: 'GET',
    path: '/projects/:id',
    request: { params: ProjectParamsSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async findById(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProjectParamsSchema>;
    const project = await this.projectsService.findById(params.id);
    if (!project) {
      return c.json({ error: 'Not Found', message: 'Project not found' }, 404);
    }
    return project;
  }

  @Get('/client/:clientId')
  @Contract({
    method: 'GET',
    path: '/projects/client/:clientId',
    request: { params: z.object({ clientId: z.string() }) },
    responses: { 200: z.array(z.object({ id: z.string() })) },
  })
  async findByClientId(c: Context) {
    const params = c.get('kanji.validated.params') as { clientId: string };
    return this.projectsService.findByClientId(params.clientId);
  }

  @Post('/')
  @Contract({
    method: 'POST',
    path: '/projects',
    request: { body: CreateProjectSchema },
    responses: { 201: z.object({ id: z.string() }) },
  })
  async create(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof CreateProjectSchema>;
    try {
      return await this.projectsService.create(body);
    } catch (e) {
      return c.json({ error: 'Bad Request', message: (e as Error).message }, 400);
    }
  }

  @Patch('/:id')
  @Contract({
    method: 'PATCH',
    path: '/projects/:id',
    request: { params: ProjectParamsSchema, body: UpdateProjectSchema },
    responses: { 200: z.object({ id: z.string() }) },
  })
  async update(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProjectParamsSchema>;
    const body = c.get('kanji.validated.body') as z.infer<typeof UpdateProjectSchema>;
    const project = await this.projectsService.update(params.id, body);
    if (!project) {
      return c.json({ error: 'Not Found', message: 'Project not found' }, 404);
    }
    return project;
  }

  @Delete('/:id')
  @Contract({
    method: 'DELETE',
    path: '/projects/:id',
    request: { params: ProjectParamsSchema },
    responses: { 200: z.object({ success: z.boolean() }) },
  })
  async remove(c: Context) {
    const params = c.get('kanji.validated.params') as z.infer<typeof ProjectParamsSchema>;
    const result = await this.projectsService.remove(params.id);
    if (!result) {
      return c.json({ error: 'Not Found', message: 'Project not found' }, 404);
    }
    return { success: true };
  }
}
