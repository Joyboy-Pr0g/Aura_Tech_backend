import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AddressService } from '../../services/address/AddressService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AddressController {
  constructor(@inject(AddressService) private addressService: AddressService) {}

  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const addresses = await this.addressService.getMyAddresses(req.user!.id);
      res.json(APIResponse.success('Addresses retrieved', addresses));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const address = await this.addressService.addAddress(req.user!.id, req.validatedData);
      res.status(201).json(APIResponse.success('Address added', address));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.addressService.updateAddress(req.user!.id, req.params.id, req.validatedData);
      res.json(APIResponse.success('Address updated'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  setDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.addressService.setDefault(req.user!.id, req.params.id);
      res.json(APIResponse.success('Default address set'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.addressService.deleteAddress(req.user!.id, req.params.id);
      res.json(APIResponse.success('Address deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
