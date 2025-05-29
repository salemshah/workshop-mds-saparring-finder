import { Request, Response } from 'express';
import { Service } from 'typedi';
import { NotificationService } from '../services/notification.service';
import { asyncWrapper } from '../utils/asyncWrapper';
import CustomError from '../utils/customError';

@Service()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // -------------------------------------------------------------------------
  // GET /notifications – list all notifications for authenticated user
  // -------------------------------------------------------------------------
  listAll = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const notifications = await this.notificationService.listAllByUser(userId);
    res.status(200).json({ notifications });
  });

  // -------------------------------------------------------------------------
  // GET /notifications/:id – get a single notification by ID
  // -------------------------------------------------------------------------
  getById = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');

    const notification = await this.notificationService.getById(id, userId);
    res.status(200).json({ notification });
  });

  // -------------------------------------------------------------------------
  // DELETE /notifications/:id – delete a notification
  // -------------------------------------------------------------------------
  deleteById = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');

    const result = await this.notificationService.deleteById(id, userId);
    res.status(200).json(result);
  });
}
