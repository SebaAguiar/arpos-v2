import { Injectable } from '@kanjijs/core';
import { Controller, Post, Get, KANJI_CTX } from '@kanjijs/platform-hono';
import { AuthGuard, UseGuards } from '@kanjijs/auth';
import { Contract } from '@kanjijs/contracts';
import { z } from 'zod';
import type { Context } from 'hono';
import { AuthService } from './auth.service';
import { LoginRequestSchema, LoginResponseSchema } from './contracts';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  @Contract({
    method: 'POST',
    path: '/auth/login',
    request: { body: LoginRequestSchema },
    responses: { 200: LoginResponseSchema },
  })
  async login(c: Context) {
    const body = c.get('kanji.validated.body') as z.infer<typeof LoginRequestSchema>;
    return this.authService.login(body);
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async me(c: Context) {
    const user = c.get(KANJI_CTX.AUTH_USER as string);
    return this.authService.getMe(user.id);
  }
}
