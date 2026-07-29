import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateContactSchema, CreateContactInput } from './dto/create-contact.schema';
import { UpdateContactSchema, UpdateContactInput } from './dto/update-contact.schema';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  findAll(@Query('type') type?: string) {
    return this.contactsService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  create(@ZodBody(CreateContactSchema) input: CreateContactInput) {
    const companyId = this.tenantContext.getCompanyId();
    return this.contactsService.create(input, companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @ZodBody(UpdateContactSchema) input: UpdateContactInput) {
    return this.contactsService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
