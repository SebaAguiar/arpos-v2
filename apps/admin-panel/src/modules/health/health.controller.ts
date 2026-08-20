import { Injectable } from '@kanjijs/core';
import { Controller, Get } from '@kanjijs/platform-hono';
import type { Context } from 'hono';

@Controller('/health')
export class HealthController {
  @Get('/')
  async check(c: Context) {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'arcom-admin-panel',
    });
  }
}
