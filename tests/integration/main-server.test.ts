import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { Primo } from '../../src/main-server/primo'

const PORT = 6001
const API_URL = `http://localhost:${PORT}/`

describe('test endpoints methods', () => {
    const server = new Primo()
    before(async () => {
        server.get('/path', (req, res) => {
            res.status(200).serve('')
        })

        await server.startAsync(PORT)
    })

    after(async () => {
        await server.close()
    })

    it('should return 200 for successfull request', async () => {
        const response = await fetch(`${API_URL}path`)

        assert.strictEqual(response.status, 200)
    })

    it('should return 404 when the endpoint is not found', async () => {
        const response = await fetch(`${API_URL}invalid`)

        assert.strictEqual(response.status, 404)
    })

    it('should return 405 if method is not allowed', async () => {
        const response = await fetch(`${API_URL}path`, {
            method: 'POST',
        })

        assert.strictEqual(response.status, 405)
    })
})
