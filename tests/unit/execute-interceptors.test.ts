import { CustomRequest } from './../../src/main-server/custom-request'
import { IncomingMessage, ServerResponse } from 'http'
import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import { CustomResponse } from '../../src/main-server/custom-response'
import {
    AppInterceptor,
    InterceptorConfig,
} from '../../src/main-server/interceptors'
import { executeInterceptorsRecursive } from '../../src/main-server/execute-interceptors'

describe('executeInterceptorsRecursive()', () => {
    const mockCustomRequest: CustomRequest = {
        body: {},
        request: {} as IncomingMessage,
        files: {},
        params: {},
        queryParams: {},
        method: 'GET',
    }

    const mockCustomResponse: CustomResponse = {
        response: {} as ServerResponse,
        status: function (code: number): CustomResponse {
            return this
        },
        serveStaticFile: function (path: string): void {},
        serve: function (response: any): void {},
    }

    const appInterceptors: Map<
        string,
        InterceptorConfig<AppInterceptor>
    > = new Map()

    const authInterceptor: AppInterceptor = {
        intercept: function (
            req: CustomRequest,
            res: CustomResponse,
            next: () => void
        ): void {
            next()
        },
    }

    const cachInterceptor: AppInterceptor = {
        intercept: function (
            req: CustomRequest,
            res: CustomResponse,
            next: () => void
        ): void {
            next()
        },
    }

    beforeEach(() => {
        mock.restoreAll()

        appInterceptors.clear()

        appInterceptors.set('/path/**', {
            interceptors: [authInterceptor],
            methods: [],
        })

        appInterceptors.set('/**', {
            interceptors: [cachInterceptor],
            methods: [],
        })
    })

    it('should call intercept function', () => {
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
    })

    it('should call callback', () => {
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        const spy = mock.fn()

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            spy
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(spy.mock.callCount(), 1)
    })

    it('should call in order', () => {
        let order = 1

        const mAuthInterceptor = mock.method(
            authInterceptor,
            'intercept',
            (req: CustomRequest, res: CustomResponse, next: () => void) => {
                assert.strictEqual(order, 1)
                order++
                next()
            }
        )
        const mCachInterceptor = mock.method(
            cachInterceptor,
            'intercept',
            (req: CustomRequest, res: CustomResponse, next: () => void) => {
                assert.strictEqual(order, 2)
                next()
            }
        )

        appInterceptors.set('/path/**', {
            interceptors: [authInterceptor, cachInterceptor],
            methods: [],
        })

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(), 1)
    })

    it('should not call the next interceptor if next is not called', () => {
        const mAuthInterceptor = mock.method(
            authInterceptor,
            'intercept',
            () => {}
        )
        const mCachInterceptor = mock.method(cachInterceptor, 'intercept')

        appInterceptors.set('/path/**', {
            interceptors: [authInterceptor, cachInterceptor],
            methods: [],
        })

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(), 0)
    })

    it('should call only the first matched pattern', () => {
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')
        const mCachInterceptor = mock.method(cachInterceptor, 'intercept')

        appInterceptors.clear()

        appInterceptors.set('/**', {
            interceptors: [cachInterceptor],
            methods: [],
        })
        appInterceptors.set('/path/**', {
            interceptors: [authInterceptor],
            methods: [],
        })

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 0)
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(), 1)
    })

    it('should call only the first matched pattern', () => {
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')
        const mCachInterceptor = mock.method(cachInterceptor, 'intercept')

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(), 0)
    })

    it('should call serve method from the interceptor', () => {
        const mAuthInterceptor = mock.method(
            authInterceptor,
            'intercept',
            (req: CustomRequest, res: CustomResponse, next: () => void) => {
                res.serve('data')
            }
        )

        const mServe = mock.method(mockCustomResponse, 'serve', () => {})

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mServe.mock.callCount(), 1)
        assert.deepStrictEqual(mServe.mock.calls[0].arguments[0], 'data')
    })

    it('should call interceptors only for specified methods', () => {
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        appInterceptors.clear()

        appInterceptors.set('/path', {
            interceptors: [authInterceptor],
            methods: ['post'],
        })

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 0)

        executeInterceptorsRecursive(
            {
                method: 'POST',
            } as CustomRequest,
            mockCustomResponse,
            '/path',
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
    })
})
