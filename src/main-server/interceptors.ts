import { IncomingMessage, ServerResponse } from 'http'
import { CustomRequest } from './custom-request'
import { CustomResponse } from './custom-response'

export type InterceptorRequest = CustomRequest | IncomingMessage
export type InterceptorResponse = CustomResponse | ServerResponse

/**
 * Defines the structure of an interceptor, which can be used to run code for endpoints.
 * Interceptors implement this interface by providing a specific type for the request (T),
 * the response (U), and overriding the intercept function.
 * @typeparam T - Type of the interceptor request, CustomRequest OR IncomingMessage.
 * @typeparam U - Type of the interceptor response, CustomResponse OR ServerResponse.
 */
export interface Interceptor<
    T extends InterceptorRequest,
    U extends InterceptorResponse,
> {
    /**
     * Intercept function to run code for the specified interceptor.
     * @param req - The interceptor request object, CustomRequest OR IncomingMessage.
     * @param res - The interceptor response object, CustomResponse OR ServerResponse.
     * @param next - A function to call to proceed with the request execution. If not called, the execution will be stuck, especially if no response is sent back to the client.
     *
     * ````js
     * const authInterceptor : AppInterceptor = {
     *                  intercept: function (
     *                  req: CustomRequest,
     *                  res: CustomResponse,
     *                  next: () => void
     *                  ): void {
     *                      // Authentication Process
     *                      next();
     *                  }
     * }
     *
     * primo.paths("/**").addInterceptors(authInterceptor)
     *
     * ````
     */
    intercept(req: T, res: U, next: () => void): void
}

/**
 * An application interceptor extends the generic Interceptor interface with specific types for
 * CustomRequest and CustomResponse, representing the application-level request and response.
 * Application interceptors are used to run code for various endpoints in the application.
 *
 * ````js
 * const authInterceptor : AppInterceptor = {
 *      intercept: function (
 *          req: CustomRequest,
 *          res: CustomResponse,
 *          next: () => void
 *      ): void {
 *          // Authentication Process
 *          next();
 *      }
 * }
 *
 * primo.paths("/**").addInterceptors(authInterceptor)
 *
 * ````
 *
 * You can use interceptors to execute code for your endpoints. For instance, an authentication interceptor
 * can be applied to all your endpoints. The Interceptor interface defines the structure of these interceptors,
 * allowing you to implement the intercept function and customize the behavior. If the next() function is not
 * called within the intercept function, the request execution will be stuck, especially if no response is sent
 * back to the client.
 *
 * Application Interceptors and Network Interceptors share the same structure; they both intercept the request
 * and are invoked before the handler code runs. However, Network Interceptors are the first to run upon receiving
 * a request, executing before Primo performs any work on the request. On the other hand, Application Interceptors
 * run after Primo processes the request. Choose between them based on your specific needs and when you want the
 * interceptor code to be executed in the request lifecycle.
 *
 */
export interface AppInterceptor
    extends Interceptor<CustomRequest, CustomResponse> {}

/**
 * A network interceptor extends the generic Interceptor interface with specific types for
 * IncomingMessage and ServerResponse, representing the low-level network request and response.
 * Network interceptors are executed before Primo processes the request, making them suitable for
 * tasks that need to be performed at the earliest stage of the request lifecycle.
 *
 * ````js
 * const rateLimiterInterceptor : NetworkInterceptor = {
 *      intercept: function (
 *          req: IncomingMessage,
 *          res: ServerResponse,
 *          next: () => void
 *      ): void {
 *          // Run code
 *          next();
 *      }
 * }
 *
 * primo.paths("/**").addNetworkInterceptors(rateLimiterInterceptor)
 *
 * ````
 *
 * You can use interceptors to execute code for your endpoints. For instance, an authentication interceptor
 * can be applied to all your endpoints. The Interceptor interface defines the structure of these interceptors,
 * allowing you to implement the intercept function and customize the behavior. If the next() function is not
 * called within the intercept function, the request execution will be stuck, especially if no response is sent
 * back to the client.
 *
 * Application Interceptors and Network Interceptors share the same structure; they both intercept the request
 * and are invoked before the handler code runs. However, Network Interceptors are the first to run upon receiving
 * a request, executing before Primo performs any work on the request. On the other hand, Application Interceptors
 * run after Primo processes the request. Choose between them based on your specific needs and when you want the
 * interceptor code to be executed in the request lifecycle.
 */
export interface NetworkInterceptor
    extends Interceptor<IncomingMessage, ServerResponse> {}
