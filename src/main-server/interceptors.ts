import { CustomRequest } from './custom-request';
import { CustomResponse } from './custom-response';


export interface AppInterceptor {
    intercept(req: CustomRequest, res: CustomResponse, next: () => void): void
}