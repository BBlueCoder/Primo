import { IncomingMessage, ServerResponse } from 'http';
import {
    describe,
    it,
    mock,
    beforeEach,
} from 'node:test';
import assert from 'node:assert';
import { CustomRequest } from '../../src/main-server/custom-request';
import { CustomResponse } from '../../src/main-server/custom-response';
import { AppInterceptor } from '../../src/main-server/interceptors';
import { executeInterceptorsRecursive } from '../../src/main-server/execute-interceptors';


describe("executeInterceptorsRecursive()", () => {

    const mockCustomRequest: CustomRequest = {
        body: {},
        request: {} as IncomingMessage,
        files: {},
        params: {},
        queryParams: {}
    }

    const mockCustomResponse: CustomResponse = {
        response: {} as ServerResponse,
        status: function (code: number): CustomResponse { return this; },
        serveStaticFile: function (path: string): void { },
        serve: function (response: any): void { }
    }

    const appInterceptors: Map<string, AppInterceptor[]> = new Map();

    const authInterceptor: AppInterceptor = {
        intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
            next();
        }
    }

    const cachInterceptor: AppInterceptor = {
        intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
            next();
        }
    }

    beforeEach(() => {
        mock.restoreAll();

        appInterceptors.clear()
    })

    it('should call intercept function', () => {
        const mAuthInterceptor = mock.method(authInterceptor, "intercept");

        appInterceptors.set("/path/**", [authInterceptor]);

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => { }
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(), 1)
    })

    it('should call callback',()=>{
        const mAuthInterceptor = mock.method(authInterceptor, "intercept");

        appInterceptors.set("/path/**", [authInterceptor]);

        const spy = mock.fn();

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            spy
        )
        
        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1)
        assert.deepStrictEqual(spy.mock.callCount(),1)
    })

    it('should call in order',()=> {
        let order = 1;

        const mAuthInterceptor = mock.method(authInterceptor, "intercept",(req: CustomRequest, res: CustomResponse, next: () => void)=>{
            assert.strictEqual(order,1);
            order++;
            next();
            
        });
        const mCachInterceptor = mock.method(cachInterceptor,"intercept",(req: CustomRequest, res: CustomResponse, next: () => void)=> {
            assert.strictEqual(order,2);
            next();
        });

        appInterceptors.set("/path/**", [authInterceptor,cachInterceptor]);

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(),1);
    })

    it('should not call the next interceptor if next is not called', () => {

        const mAuthInterceptor = mock.method(authInterceptor, "intercept",()=>{});
        const mCachInterceptor = mock.method(cachInterceptor,"intercept");

        appInterceptors.set("/path/**", [authInterceptor,cachInterceptor]);

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(),0);
    })

    it('should call only the first matched pattern',() => {
        const mAuthInterceptor = mock.method(authInterceptor, "intercept");
        const mCachInterceptor = mock.method(cachInterceptor,"intercept");

        /**
         * (**) means expand the path fully. ex : /path/** => [/path, /path/5, /path/5/asc, ...] all these paths match with the pattern
         * (*) means expand the path once. ex : /path/* => [/path, /path/5, path/second] 
         * in the next case only the cacheInterceptor should run
         * the API run only the first pattern it found that matches with the path
         * And because /** means any path 
         * the API won't reach /path/**
         * the order of adding the interceptors matters 
         * always start with the most specified pattern like in the next test
         */

        appInterceptors.set("/**",[cachInterceptor])
        appInterceptors.set("/path/**",[authInterceptor])

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),0);
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(),1);
    })

    it('should call only the first matched pattern',() => {
        const mAuthInterceptor = mock.method(authInterceptor, "intercept");
        const mCachInterceptor = mock.method(cachInterceptor,"intercept");

        appInterceptors.set("/path/**",[authInterceptor])
        appInterceptors.set("/**",[cachInterceptor])

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mCachInterceptor.mock.callCount(),0);
    })

    it('should call serve method from the interceptor', () => {
        const mAuthInterceptor = mock.method(authInterceptor, "intercept",(req: CustomRequest, res: CustomResponse, next: () => void)=>{
            res.serve("data");
        });

        const mServe = mock.method(mockCustomResponse,"serve",()=>{});

        appInterceptors.set("/path/**",[authInterceptor])

        executeInterceptorsRecursive(
            mockCustomRequest,
            mockCustomResponse,
            "/path",
            0,
            appInterceptors,
            () => {}
        )

        assert.deepStrictEqual(mAuthInterceptor.mock.callCount(),1);
        assert.deepStrictEqual(mServe.mock.callCount(),1);
        assert.deepStrictEqual(mServe.mock.calls[0].arguments[0],"data");        
    })
})