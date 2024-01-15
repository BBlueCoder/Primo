import { PrimoConfiguration } from './configuration/primo-configuration-builder'
import { RequestOptions } from './custom-request'
import {
    AppInterceptor,
    InterceptorConfig,
    NetworkInterceptor,
} from './interceptors'
import { MainServer } from './main-server'
import { RouteHandler } from './route'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export class Primo extends MainServer {
    /**
     * The InterceptorBuilder class is responsible for managing and building interceptors for Primo instances.
     */
    private InterceptorBuilder = class {
        /**
         * Constructor for InterceptorBuilder.
         * @param primo - The Primo instance associated with the builder.
         * @param appInterceptors - List of application interceptors.
         * @param networkInterceptors - List of network interceptors.
         */
        constructor(
            private primo: Primo,
            private appInterceptors: InterceptorConfig<AppInterceptor>,
            private networkInterceptors: InterceptorConfig<NetworkInterceptor>
        ) {}

        methods(methods: string[]) {
            this.appInterceptors.methods = methods
            this.networkInterceptors.methods = methods
            return this
        }

        /**
         * Adds application interceptors to the list for a specified path.
         * @param interceptors - One or List of application interceptors to add.
         * @returns The Primo instance for method chaining.
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
         */
        addInterceptors(...interceptors: AppInterceptor[]) {
            this.appInterceptors.interceptors.push(...interceptors)
            this.primo.removeEmptyPatterns()
            return this.primo
        }

        /**
         * Adds network interceptors to the list for a specified path.
         * @param interceptors - One or List of network interceptors to add.
         * @returns The Primo instance for method chaining.
         *
         * ````js
         *
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
         */
        addNetworkInterceptors(...interceptors: NetworkInterceptor[]) {
            this.networkInterceptors.interceptors.push(...interceptors)
            this.primo.removeEmptyPatterns()
            return this.primo
        }
    }

    configure(): PrimoConfiguration {
        return new PrimoConfiguration(
            this.appInterceptors,
            this.networkInterceptors
        )
    }

    /**
     * Defines patterns for interceptors and returns an instance of the InterceptorBuilder.
     *
     * @param pattern - The pattern for interceptors, specifying the URL path.
     *
     *   For example, paths("/users").addInterceptor() will run the interceptor for every call to the /users endpoint
     *   before the actual endpoint handler is invoked.
     *
     *   **Patterns support**:
     *
     *   ** to match any subpath (e.g., /users/**),
     *   \* to match one additional path segment (e.g., /users/*),
     *
     *
     *   By default, query parameters are ignored when matching patterns (e.g., /users matches /users?limit=25&page=3).
     *
     *   Patterns must be added in the correct order, starting from the more specific to the more general.
     *
     *   If multiple patterns match the same endpoint, only the interceptors associated with the first matching pattern will run.
     *
     *   For example:
     *   ```js
     *   primo.paths("/users").addInterceptor(usersInterceptor)
     *   primo.paths("/**").addInterceptor(generalInterceptor)
     *   ````
     *
     *   ensures that the usersInterceptor is invoked for /users and generalInterceptor for any other endpoint.
     *   Reversing the order will result in only generalInterceptor being invoked for all endpoints.
     * @returns An instance of the InterceptorBuilder with the specified pattern.
     */
    // paths(pattern: string) {
    //     if (!this.appInterceptors.get(pattern))
    //         this.appInterceptors.set(pattern, {
    //             interceptors: [],
    //             methods: [],
    //         })

    //     if (!this.networkInterceptors.get(pattern))
    //         this.networkInterceptors.set(pattern, {
    //             interceptors: [],
    //             methods: [],
    //         })

    //     return new this.InterceptorBuilder(
    //         this,
    //         this.appInterceptors.get(pattern)!,
    //         this.networkInterceptors.get(pattern)!
    //     )
    // }

    /**
     * Removes patterns with empty interceptor lists from both appInterceptors and networkInterceptors.
     */
    private removeEmptyPatterns() {
        for (const p of this.appInterceptors.keys()) {
            if (this.appInterceptors.get(p)!.interceptors.length == 0)
                this.appInterceptors.delete(p)
        }

        for (const p of this.networkInterceptors.keys()) {
            if (this.networkInterceptors.get(p)?.interceptors.length == 0)
                this.networkInterceptors.delete(p)
        }
    }

    private createHttpMethodFunction(
        method: HttpMethod
    ): (
        path: string,
        arg2: RouteHandler | RequestOptions,
        arg3?: RouteHandler
    ) => void {
        return (
            path: string,
            arg2: RouteHandler | RequestOptions,
            arg3?: RouteHandler
        ): void => {
            const options =
                typeof arg2 === 'function' ? {} : (arg2 as RequestOptions)
            const handler =
                typeof arg2 === 'function'
                    ? (arg2 as RouteHandler)
                    : (arg3 as RouteHandler)
            this.httpMethod(method, path, options, handler)
        }
    }

    /**
     * Performs an HTTP GET request.
     * @param path - The URL path for the request.
     * @param arg2 - Either the RequestOptions or the RouteHandler.
     * @param arg3 - The RouteHandler if RequestOptions is provided in arg2.
     */
    get = this.createHttpMethodFunction('get')

    /**
     * Performs an HTTP POST request.
     * @param path - The URL path for the request.
     * @param arg2 - Either the RequestOptions or the RouteHandler.
     * @param arg3 - The RouteHandler if RequestOptions is provided in arg2.
     */
    post = this.createHttpMethodFunction('post')

    /**
     * Performs an HTTP PUT request.
     * @param path - The URL path for the request.
     * @param arg2 - Either the RequestOptions or the RouteHandler.
     * @param arg3 - The RouteHandler if RequestOptions is provided in arg2.
     */
    put = this.createHttpMethodFunction('put')

    /**
     * Performs an HTTP PATCH request.
     * @param path - The URL path for the request.
     * @param arg2 - Either the RequestOptions or the RouteHandler.
     * @param arg3 - The RouteHandler if RequestOptions is provided in arg2.
     */
    patch = this.createHttpMethodFunction('patch')

    /**
     * Performs an HTTP DELETE request.
     * @param path - The URL path for the request.
     * @param arg2 - Either the RequestOptions or the RouteHandler.
     * @param arg3 - The RouteHandler if RequestOptions is provided in arg2.
     */
    delete = this.createHttpMethodFunction('delete')
}
