import { AppInterceptor, NetworkInterceptor } from './../../src/main-server/interceptors';
import { describe, it, before, mock, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { MainServer } from '../../src/main-server/main-server';
import { IncomingMessage, ServerResponse } from 'http';
import { CustomRequest } from '../../src/main-server/custom-request';
import { CustomResponse } from '../../src/main-server/custom-response';

const PORT = 6002;
const API_URL = `http://localhost:${PORT}/`;

describe("interceptors integration with server", async ()=>{
    let server = new MainServer();

    beforeEach( async ()=>{
        server = new MainServer();

        server.get('/path',(req,res)=>{
            res.status(200).serve("");
        })

        await server.startAsync(PORT);
    })

    afterEach(async ()=>{
        await server.close();
    })

    it("should call network interceptors",async ()=> {

        const rateLimitInterceptor : NetworkInterceptor = {
            intercept: function (req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void): void {
                next();
            }
        } 

        const mRateLimitInterceptor = mock.method(rateLimitInterceptor,"intercept")

        server.paths("/path/**").addNetworkInterceptors(rateLimitInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(),1)
        assert.strictEqual(response.status,200);
    })

    it("should call app interceptors", async ()=> {
        const authInterceptor : AppInterceptor = {
            intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
                next();
            }
        } 

        const mAuthInterceptor = mock.method(authInterceptor,"intercept")

        server.paths("/path/**").addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1)
        assert.strictEqual(response.status,200);
    })

    it("should return response from interceptor", async ()=> {
        const authInterceptor : AppInterceptor = {
            intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
                res.status(200).serve("")
            }
        } 

        const spy = mock.fn();
        mock.method(server,"get",spy);

        const mAuthInterceptor = mock.method(authInterceptor,"intercept")

        server.paths("/path/**").addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(spy.mock.callCount(),0);
        assert.strictEqual(response.status,200);
    })

    it("should call network and app interceptors",async ()=>{
        const rateLimitInterceptor : NetworkInterceptor = {
            intercept: function (req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void): void {
                next();
            }
        } 
        const authInterceptor : AppInterceptor = {
            intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
                next();
            }
        } 

        const mRateLimitInterceptor = mock.method(rateLimitInterceptor,"intercept");
        const mAuthInterceptor = mock.method(authInterceptor,"intercept");

        server
            .paths("/path/**").addNetworkInterceptors(rateLimitInterceptor)
            .paths("/path/**").addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.strictEqual(response.status,200);
    })

    it("should call app interceptor for  specified path",async ()=> {
        const rateLimitInterceptor : NetworkInterceptor = {
            intercept: function (req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void): void {
                next();
            }
        } 
        const authInterceptor : AppInterceptor = {
            intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
                next();
            }
        } 

        const mRateLimitInterceptor = mock.method(rateLimitInterceptor,"intercept");
        const mAuthInterceptor = mock.method(authInterceptor,"intercept");

        // for better practices don't add paths in this order
        server
            .paths("/**").addNetworkInterceptors(rateLimitInterceptor)
            .paths("/path").addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.strictEqual(response.status,200);
    })

    it('should not invoke interceptors if no matched pattern found',async ()=>{
        const rateLimitInterceptor : NetworkInterceptor = {
            intercept: function (req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void): void {
                next();
            }
        } 
        const authInterceptor : AppInterceptor = {
            intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
                next();
            }
        } 

        const mRateLimitInterceptor = mock.method(rateLimitInterceptor,"intercept");
        const mAuthInterceptor = mock.method(authInterceptor,"intercept");

        server
            .paths("/other").addNetworkInterceptors(rateLimitInterceptor)
            .paths("/other").addInterceptors(authInterceptor)

        const response = await fetch(`${API_URL}path`);

        assert.deepStrictEqual(mRateLimitInterceptor.mock.callCount(),0);
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),0);
        assert.strictEqual(response.status,200);
    })
})