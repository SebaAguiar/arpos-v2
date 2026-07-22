import { ContactsService, type ApiContact } from "../services/contacts.service";
import type { Customer } from "@/lib/types";

function mapContact(api: ApiContact): Customer {
  return {
    id: api.id,
    name: api.name,
    email: api.email ?? undefined,
    phone: api.phone ?? undefined,
    address: api.address ?? undefined,
    taxId: api.tax_id ?? undefined,
  };
}

export const ContactsRepository = {
  async getAll(type?: string): Promise<Customer[]> {
    const contacts = await ContactsService.list(type);
    return contacts.map(mapContact);
  },

  async getById(id: string): Promise<Customer> {
    const contact = await ContactsService.get(id);
    return mapContact(contact);
  },

  async create(input: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
  }): Promise<Customer> {
    const created = await ContactsService.create({ ...input, type: "customer" });
    return mapContact(created);
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      tax_id: string;
    }>,
  ): Promise<Customer> {
    const updated = await ContactsService.update(id, data);
    return mapContact(updated);
  },

  async remove(id: string): Promise<void> {
    return ContactsService.remove(id);
  },
};
