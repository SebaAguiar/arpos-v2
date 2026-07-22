import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  findAll(@Query('type') type?: string) {
    const companyId = this.tenantContext.getCompanyId();
    return this.contactsService.findAll(companyId, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      type?: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      tax_id?: string;
      notes?: string;
    },
  ) {
    const companyId = this.tenantContext.getCompanyId();
    return this.contactsService.create(body, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      type: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      tax_id: string;
      notes: string;
      is_active: boolean;
    }>,
  ) {
    return this.contactsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
