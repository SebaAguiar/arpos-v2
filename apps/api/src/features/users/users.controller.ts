import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { Public } from '../auth/guards/public.decorator';
import { UsersService } from './users.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { ZodQuery } from '../../core/validation/zod-query.decorator';
import { CreateUserSchema, CreateUserInput } from './dto/create-user.schema';
import { UpdateUserSchema, UpdateUserInput } from './dto/update-user.schema';
import { UserFiltersSchema, UserFiltersInput } from './dto/user-filters.schema';

@Public()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@ZodQuery(UserFiltersSchema) filters: UserFiltersInput) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@ZodBody(CreateUserSchema) input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @ZodBody(UpdateUserSchema) input: UpdateUserInput) {
    return this.usersService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
