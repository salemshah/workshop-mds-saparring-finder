import { Request, Response } from 'express';
import { Service } from 'typedi';
import { asyncWrapper } from '../utils/asyncWrapper';
import { ContactService } from '../services/contact.service';
import { Contact } from '@prisma/client';

/**
 * Express controller – maps HTTP routes to ProfileService methods and ensures
 * **every** successful response that the mobile app consumes contains a
 * top-level `profiles` array. (If a message is needed it’s merged alongside.)
 */
@Service()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // -------------------------------------------------------------------------
  // GET /contact – fetch all contacts
  // -------------------------------------------------------------------------
  getContacts = asyncWrapper(async (req: Request, res: Response) => {
    const result: Contact[] = await this.contactService.getContacts();
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // POST /contact – add a contact
  // -------------------------------------------------------------------------
  addContact = asyncWrapper(async (req: Request, res: Response) => {
    const result: Contact = await this.contactService.addContact(req.body);

    res.status(201).json(result);
  });
}
