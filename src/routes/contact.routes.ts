import { Router } from 'express';
import { Container } from 'typedi';
import { validate } from '../middlewares/validation.middleware';

import { ContactController } from '../controllers/contact.controller';
import { createContactSchema } from '../validators/contact.validation';

const router = Router();
const contactController = Container.get(ContactController);

// Add a contact
router.post('/', validate(createContactSchema), contactController.addContact);
// Get all contacts
router.get('/all', contactController.getContacts);

export default router;
