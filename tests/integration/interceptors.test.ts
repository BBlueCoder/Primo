import {
    AppInterceptor,
    NetworkInterceptor,
} from './../../src/main-server/interceptors'
import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { IncomingMessage, ServerResponse } from 'http'
import { CustomRequest } from '../../src/main-server/custom-request'
import { CustomResponse } from '../../src/main-server/custom-response'
import { Primo } from '../../src/main-server/primo'

const PORT = 6002
const API_URL = `http://localhost:${PORT}/`

describe('interceptors integration with server', async () => {
    let server

    beforeEach(async () => {
        server = new Primo()

        server.get('/path', (req, res) => {
            res.status(200).serve('')
        })

        await server.startAsync(PORT)
    })

    afterEach(async () => {
        await server.close()
    })

    it('should call network interceptors', async () => {
        const rateLimitInterceptor: NetworkInterceptor = {
            intercept: function (
                req: IncomingMessage,
                res: ServerResponse<IncomingMessage>,
                next: () => void
            ): void {
                next()
            },
        }

        const mRateLimitInterceptor = mock.method(
            rateLimitInterceptor,
            'intercept'
        )

        server
            .configure()
            .paths('/path/**')
            .addNetworkInterceptors(rateLimitInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 1)
        assert.strictEqual(response.status, 200)
    })

    it('should call app interceptors', async () => {
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                next()
            },
        }

        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        server.configure().paths('/path/**').addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.strictEqual(response.status, 200)
    })

    it('should return response from interceptor', async () => {
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                res.status(200).serve('')
            },
        }

        const spy = mock.fn()
        mock.method(server, 'get', spy)

        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        server.configure().paths('/path/**').addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(spy.mock.callCount(), 0)
        assert.strictEqual(response.status, 200)
    })

    it('should call network and app interceptors', async () => {
        const rateLimitInterceptor: NetworkInterceptor = {
            intercept: function (
                req: IncomingMessage,
                res: ServerResponse<IncomingMessage>,
                next: () => void
            ): void {
                next()
            },
        }
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                next()
            },
        }

        const mRateLimitInterceptor = mock.method(
            rateLimitInterceptor,
            'intercept'
        )
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        server
            .configure()
            .paths('/path/**')
            .addNetworkInterceptors(rateLimitInterceptor)
            .paths('/path/**')
            .addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.strictEqual(response.status, 200)
    })

    it('should call app interceptor for specified path', async () => {
        const rateLimitInterceptor: NetworkInterceptor = {
            intercept: function (
                req: IncomingMessage,
                res: ServerResponse<IncomingMessage>,
                next: () => void
            ): void {
                next()
            },
        }
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                next()
            },
        }

        const mRateLimitInterceptor = mock.method(
            rateLimitInterceptor,
            'intercept'
        )
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        // for better practices don't add paths in this order
        server
            .configure()
            .paths('/**')
            .addNetworkInterceptors(rateLimitInterceptor)
            .paths('/path')
            .addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 1)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
        assert.strictEqual(response.status, 200)
    })

    it('should not invoke interceptors if no matched pattern found', async () => {
        const rateLimitInterceptor: NetworkInterceptor = {
            intercept: function (
                req: IncomingMessage,
                res: ServerResponse<IncomingMessage>,
                next: () => void
            ): void {
                next()
            },
        }
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                next()
            },
        }

        const mRateLimitInterceptor = mock.method(
            rateLimitInterceptor,
            'intercept'
        )
        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        server
            .configure()
            .paths('/other')
            .addNetworkInterceptors(rateLimitInterceptor)
            .paths('/other')
            .addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`)

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 0)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 0)
        assert.strictEqual(response.status, 200)
    })

    it('should add the object to the request', async () => {
        const User = {
            name: 'user',
            password: 'password',
        }

        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                req.user = User
                next()
            },
        }

        server.get('/user', (req, res) => {
            res.status(200).serve(req.user)
        })

        server.configure().paths('/user').addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}user`)

        const result = await response.json()

        assert.deepStrictEqual(result, User)
        assert.strictEqual(response.status, 200)
    })

    it('should call interceptors only for specified methods', async () => {
        const authInterceptor: AppInterceptor = {
            intercept: function (
                req: CustomRequest,
                res: CustomResponse,
                next: () => void
            ): void {
                res.status(401).serve('')
            },
        }

        const rateLimitInterceptor: NetworkInterceptor = {
            intercept: function (
                req: IncomingMessage,
                res: ServerResponse<IncomingMessage>,
                next: () => void
            ): void {
                res.statusCode = 429
                res.end()
            },
        }

        server
            .configure()
            .paths('/post')
            .methods(['post'])
            .addInterceptors(authInterceptor)
            .paths('/articles')
            .methods(['post'])
            .addNetworkInterceptors(rateLimitInterceptor)

        const mAuthInterceptor = mock.method(authInterceptor, 'intercept')

        server.get('/post', (req, res) => {
            res.status(200).serve('')
        })

        server.post('/post', (req, res) => {
            res.status(200).serve('')
        })

        const responseOfGet = await fetch(`${API_URL}post`)

        assert.strictEqual(responseOfGet.status, 200)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 0)

        const responseOfPost = await fetch(`${API_URL}post`, { method: 'POST' })

        assert.strictEqual(responseOfPost.status, 401)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)

        const mRateLimitInterceptor = mock.method(
            rateLimitInterceptor,
            'intercept'
        )

        server.get('/articles', (req, res) => {
            res.status(200).serve('')
        })

        server.post('/articles', (req, res) => {
            res.status(200).serve('')
        })

        const responseOfGetNetowrk = await fetch(`${API_URL}articles`)

        assert.strictEqual(responseOfGetNetowrk.status, 200)
        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 0)

        const responseOfPostNetowrk = await fetch(`${API_URL}articles`, {
            method: 'POST',
        })

        assert.strictEqual(responseOfPostNetowrk.status, 429)
        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(), 1)
    })
})
