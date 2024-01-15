import { describe, beforeEach, it, mock, afterEach } from 'node:test'
import assert from 'node:assert'
import { Primo } from '../../src/main-server/primo'
import { AppInterceptor } from '../../src/main-server/interceptors'
import { CustomRequest } from '../../src/main-server/custom-request'
import { CustomResponse } from '../../src/main-server/custom-response'

const PORT = 6003
const API_URL = `http://localhost:${PORT}/`

describe('primo configuration', async () => {
    let primo: Primo

    beforeEach(async () => {
        primo = new Primo()

        await primo.startAsync(PORT)
    })

    afterEach(async () => {
        await primo.close()
    })

    it('should call interceptors for all paths', async () => {
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

        primo
            .configure()
            .paths('/posts', '/users')
            .methods(['post'])
            .addInterceptors(authInterceptor)

        primo.get('/posts', (req, res) => {
            res.status(200).serve('')
        })

        primo.post('/posts', (req, res) => {
            res.status(200).serve('')
        })

        primo.post('/users', (req, res) => {
            res.status(200).serve('')
        })

        const response = await fetch(`${API_URL}posts`)

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 0)

        const response_2 = await fetch(`${API_URL}posts`, { method: 'POST' })

        assert.strictEqual(response_2.status, 200)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)

        const response_3 = await fetch(`${API_URL}users`, { method: 'POST' })

        assert.strictEqual(response_3.status, 200)
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 2)
    })
})
