import { CustomRequest } from './custom-request'
import { CustomResponse } from './custom-response'
import { ServerResponse, IncomingMessage } from 'http'
import {
    AppInterceptor,
    Interceptor,
    InterceptorConfig,
    InterceptorRequest,
    InterceptorResponse,
    NetworkInterceptor,
} from './interceptors'
import { PathUtils } from './path-utils'

export function executeInterceptorsRecursive(
    req: CustomRequest | IncomingMessage,
    res: CustomResponse | ServerResponse,
    path: string,
    index: number,
    interceptors: Map<
        string,
        InterceptorConfig<Interceptor<InterceptorRequest, InterceptorResponse>>
    >,
    callback: () => void
) {
    const pattern = PathUtils.getPatternThatMatchesPath(
        interceptors.keys(),
        path
    )

    const intps = interceptors.get(pattern)

    if (
        isThereAnyInterceptros(intps, index) &&
        isMethodMatchesWithInterceptorsMethods(
            req.method as string,
            intps?.methods!
        )
    ) {
        intps!.interceptors[index].intercept(req, res, () => {
            executeInterceptorsRecursive(
                req,
                res,
                path,
                index + 1,
                interceptors,
                callback
            )
        })
    } else {
        callback()
    }
}

function isThereAnyInterceptros(
    intps:
        | InterceptorConfig<
              Interceptor<InterceptorRequest, InterceptorResponse>
          >
        | undefined,
    index: number
): Boolean {
    return intps != undefined && index < intps.interceptors.length
}

function isMethodMatchesWithInterceptorsMethods(
    method: string,
    methods: string[]
): Boolean {
    if (methods.length == 0) return true

    return (
        methods.findIndex((m) => m.toLowerCase() == method.toLowerCase()) != -1
    )
}
