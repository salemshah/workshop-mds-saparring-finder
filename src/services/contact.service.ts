import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Contact } from '@prisma/client';

@Service()
export class ContactService {
  /**
   * Add a contact
   */
  async addContact(contactData: Prisma.ContactCreateInput): Promise<Contact> {
    return prisma.contact.create({
      data: {
        ...contactData,
      },
    });
  }

  /**
   * Get all contacts
   */
  async getContacts(): Promise<Contact[]> {
    return prisma.contact.findMany({});
  }
}
