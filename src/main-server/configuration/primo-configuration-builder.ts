import {
    AppInterceptor,
    InterceptorConfig,
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
    paths(pattern: string) {
        if (!this.appInterceptors.get(pattern))
            this.appInterceptors.set(pattern, {
                interceptors: [],
                methods: [],
            })

        if (!this.networkInterceptors.get(pattern))
            this.networkInterceptors.set(pattern, {
                interceptors: [],
                methods: [],
            })

        return new InterceptorBuilder(
            this,
            this.appInterceptors.get(pattern)!,
            this.networkInterceptors.get(pattern)!,
            () => {
                this.removeEmptyPatterns()
            }
        )
    }

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
}

class InterceptorBuilder {
    /**
     * Constructor for InterceptorBuilder.
     * @param primo - The Primo instance associated with the builder.
     * @param appInterceptors - List of application interceptors.
     * @param networkInterceptors - List of network interceptors.
     */
    constructor(
        private primo: PrimoConfiguration,
        private appInterceptors: InterceptorConfig<AppInterceptor>,
        private networkInterceptors: InterceptorConfig<NetworkInterceptor>,
        private removeEmptyPatterns: () => void
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
        this.removeEmptyPatterns()
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
        this.removeEmptyPatterns()
        return this.primo
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
