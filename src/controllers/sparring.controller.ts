import { Request, Response } from 'express';
import { Service } from 'typedi';

import {
  SparringService,
  SparringsResponse,
} from '../services/sparring.service';
import { asyncWrapper } from '../utils/asyncWrapper';

/**
 * Express controller – maps HTTP routes to SparringService methods and ensures
 * all successful responses return a top-level `sparrings` array.
 */
@Service()
export class SparringController {
  constructor(private readonly sparringService: SparringService) {}

  // -------------------------------------------------------------------------
  // GET /sparring – get all sparrings of auth user
  // -------------------------------------------------------------------------
  getAll = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result: SparringsResponse =
      await this.sparringService.getUserSparrings(userId);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // GET /sparring/:id – get sparring by ID
  // -------------------------------------------------------------------------
  getById = asyncWrapper(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result: SparringsResponse =
      await this.sparringService.getSparringById(id);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // POST /sparring – create sparring request
  // -------------------------------------------------------------------------
  create = asyncWrapper(async (req: Request, res: Response) => {
    const requesterId = req.user.id;
    const data = { ...req.body };

    const result: SparringsResponse = await this.sparringService.createSparring(
      requesterId,
      data
    );

    res
      .status(201)
      .json({ message: 'Sparring request created successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // PUT /sparring/:id – update sparring (only if status is pending)
  // -------------------------------------------------------------------------
  update = asyncWrapper(async (req: Request, res: Response) => {
    const requesterId = req.user.id;
    const id = Number(req.params.id);
    if (isNaN(id)) throw new Error('Invalid ID');

    const result: SparringsResponse = await this.sparringService.updateSparring(
      id,
      requesterId,
      req.body
    );

    res
      .status(200)
      .json({ message: 'Sparring updated successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // POST /sparring/:id/confirm – confirm sparring (by partner)
  // -------------------------------------------------------------------------
  confirm = asyncWrapper(async (req: Request, res: Response) => {
    const partnerId = req.user.id;
    const id = Number(req.params.id);

    const result: SparringsResponse =
      await this.sparringService.confirmSparring(id, partnerId);

    res
      .status(200)
      .json({ message: 'Sparring confirmed successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // POST /sparring/:id/cancel – cancel sparring (by requester or partner)
  // -------------------------------------------------------------------------
  cancel = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { reason } = req.body;

    const result: SparringsResponse = await this.sparringService.cancelSparring(
      id,
      userId,
      reason
    );

    res
      .status(200)
      .json({ message: 'Sparring cancelled successfully', ...result });
  });
}
