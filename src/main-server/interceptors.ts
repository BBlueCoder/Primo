import { IncomingMessage,ServerResponse } from 'http';
import { CustomRequest } from './custom-request';
import { CustomResponse } from './custom-response';

export type InterceptorRequest = CustomRequest | IncomingMessage
export type InterceptorResponse = CustomResponse | ServerResponse

export interface Interceptor<T extends InterceptorRequest,U extends InterceptorResponse> {
    intercept(req: T, res: U, next: () => void): void
}

export interface AppInterceptor extends Interceptor<CustomRequest,CustomResponse> {}

export interface NetworkInterceptor extends Interceptor<IncomingMessage,ServerResponse> {}