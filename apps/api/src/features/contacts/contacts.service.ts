import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repository';
import { CreateContactInput } from './dto/create-contact.schema';
import { UpdateContactInput } from './dto/update-contact.schema';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepo: ContactsRepository,
    private readonly syncService: SyncService,
  ) {}

  async findAll(type?: string) {
    return this.contactsRepo.findAll(type);
  }

  async findOne(id: string) {
    const contact = await this.contactsRepo.findById(id);
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async create(data: CreateContactInput, companyId: string) {
    const contact = await this.contactsRepo.create(data, companyId);

    await this.syncService.enqueueChange('create', 'contact', contact.id, {
      name: contact.name,
      type: contact.type,
      email: contact.email,
      phone: contact.phone,
    });

    return contact;
  }

  async update(id: string, data: UpdateContactInput) {
    await this.findOne(id);
    const contact = await this.contactsRepo.update(id, data);

    await this.syncService.enqueueChange('update', 'contact', contact.id, {
      name: contact.name,
      type: contact.type,
      email: contact.email,
      phone: contact.phone,
    });

    return contact;
  }

  async remove(id: string) {
    const contact = await this.findOne(id);

    await this.contactsRepo.softDelete(id);

    await this.syncService.enqueueChange('delete', 'contact', contact.id, {
      name: contact.name,
      type: contact.type,
    });

    return undefined;
  }
}
