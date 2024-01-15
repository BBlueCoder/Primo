import {
    AppInterceptor,
    Interceptor,
    InterceptorConfig,
    InterceptorRequest,
    InterceptorResponse,
    NetworkInterceptor,
} from './../interceptors'

export class PrimoConfiguration {
    constructor(
        private appInterceptors: Map<string, InterceptorConfig<AppInterceptor>>,
        private networkInterceptors: Map<
            string,
            InterceptorConfig<NetworkInterceptor>
        >
    ) {}

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
    paths(...pattern: string[]) {
        return new InterceptorBuilder(
            this,
            this.appInterceptors,
            this.networkInterceptors,
            pattern
        )
    }
}

class InterceptorBuilder {
    /**
     * Constructor for InterceptorBuilder.
     * @param primoConfiguration - The Primo instance associated with the builder.
     * @param appInterceptors - List of application interceptors.
     * @param networkInterceptors - List of network interceptors.
     */
    constructor(
        private primoConfiguration: PrimoConfiguration,
        private appInterceptors: Map<string, InterceptorConfig<AppInterceptor>>,
        private networkInterceptors: Map<
            string,
            InterceptorConfig<NetworkInterceptor>
        >,
        private patterns: string[]
    ) {}

    private _methods: string[] = []

    methods(methods: string[]) {
        this._methods = methods
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
        this.addInterceptorsToAllPattern(this.appInterceptors, interceptors)

        return this.primoConfiguration
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
        this.addInterceptorsToAllPattern(this.networkInterceptors, interceptors)

        return this.primoConfiguration
    }

    private addInterceptorsToAllPattern(
        interceptors: Map<
            string,
            InterceptorConfig<
                Interceptor<InterceptorRequest, InterceptorResponse>
            >
        >,
        newInterceptors: Interceptor<InterceptorRequest, InterceptorResponse>[]
    ) {
        this.patterns.forEach((pattern) => {
            this.initializeArraysIfNull(pattern, interceptors)

            interceptors.get(pattern)!.interceptors.push(...newInterceptors)
            interceptors.get(pattern)!.methods.push(...this._methods)
        })
    }

    private initializeArraysIfNull(
        pattern: string,
        interceptors: Map<
            string,
            InterceptorConfig<
                Interceptor<InterceptorRequest, InterceptorResponse>
            >
        >
    ) {
        if (!interceptors.get(pattern)) {
            interceptors.set(pattern, {
                interceptors: [],
                methods: [],
            })
        }
    }
}

// class Primo {

// }

// Primo
//     .paths("/**").addIntercetor(interceptor)
//     .paths("/path").notAuthorized()
//     .paths("/*").edit()
//                     .addInterceptor(interceptor)
//                     .notAuthorized()
//                 .apply()
//     .path("/posts").methods(["post"]).addInterceptor(interceptor)
