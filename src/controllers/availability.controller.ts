import { Request, Response } from 'express';
import { Service } from 'typedi';

import {
  AvailabilityService,
  AvailabilitiesResponse,
} from '../services/availability.service';
import { asyncWrapper } from '../utils/asyncWrapper';

/**
 * Express controller – maps HTTP routes to AvailabilityService methods and ensures
 * **every** successful response that the mobile app consumes contains a
 * top-level `availabilities` array. (If a message is needed it’s merged alongside.)
 */
@Service()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // -------------------------------------------------------------------------
  // GET /availability – get all availabilities of auth user
  // -------------------------------------------------------------------------
  getAll = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result: AvailabilitiesResponse =
      await this.availabilityService.getAllAvailabilities(userId);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // GET /availability/:id – get availability by ID
  // -------------------------------------------------------------------------
  getById = asyncWrapper(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result: AvailabilitiesResponse =
      await this.availabilityService.getAvailabilityById(id);
    res.status(200).json(result);
  });

  // -------------------------------------------------------------------------
  // POST /availability – create availability
  // -------------------------------------------------------------------------
  create = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const data = { ...req.body };

    const result: AvailabilitiesResponse =
      await this.availabilityService.createAvailability(userId, data);

    res
      .status(201)
      .json({ message: 'Availability created successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // PUT /availability/:id – update availability
  // -------------------------------------------------------------------------
  update = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const result: AvailabilitiesResponse =
      await this.availabilityService.updateAvailability(id, userId, req.body);

    res
      .status(200)
      .json({ message: 'Availability updated successfully', ...result });
  });

  // -------------------------------------------------------------------------
  // DELETE /availability/:id – delete availability
  // -------------------------------------------------------------------------
  delete = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const id = Number(req.params.id);

    await this.availabilityService.deleteAvailability(id, userId);
    res.status(200).json({ message: 'Availability deleted successfully' });
  });
}
