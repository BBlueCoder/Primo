import { CustomRequest } from './custom-request'
import { CustomResponse } from './custom-response'
import { ServerResponse, IncomingMessage } from 'http'
import {
    Interceptor,
    InterceptorRequest,
    InterceptorResponse,
} from './interceptors'
import { PathUtils } from './path-utils'

export function executeInterceptorsRecursive(
    req: CustomRequest | IncomingMessage,
    res: CustomResponse | ServerResponse,
    path: string,
    index: number,
    interceptors: Map<
        string,
        Interceptor<InterceptorRequest, InterceptorResponse>[]
    >,
    callback: () => void
) {
    const pattern = PathUtils.getPatternThatMatchesPath(
        interceptors.keys(),
        path
    )

    const intps = interceptors.get(pattern)

    if (intps && index < intps!.length) {
        intps![index].intercept(req, res, () => {
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
