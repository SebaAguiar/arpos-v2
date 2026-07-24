import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repository';
import { CreateContactInput } from './dto/create-contact.schema';
import { UpdateContactInput } from './dto/update-contact.schema';

@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepo: ContactsRepository) {}

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
    return this.contactsRepo.create(data, companyId);
  }

  async update(id: string, data: UpdateContactInput) {
    await this.findOne(id);
    return this.contactsRepo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.contactsRepo.softDelete(id);
  }
}
