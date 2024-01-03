import { ServerResponse } from 'http';
import { IncomingMessage } from 'http';
import * as http from 'http';
import { CustomRequest, ExtendedRequest, RequestOptions } from './custom-request';
import { CustomResponse, ExtendedResponse } from './custom-response';
import { parse } from 'url';
import { PathUtils } from './path-utils';
import { parseJSONRequestBody,parseFormData} from './request-body-parsers';
import { Route, RouteHandler } from './route';
import { AppInterceptor, Interceptor, InterceptorRequest, InterceptorResponse, NetworkInterceptor } from './interceptors';


const JSON_CONTENT_TYPE = "application/json";

type LocalInterceptorType = Interceptor<InterceptorRequest,InterceptorResponse>[]

export class MainServer {

    private routes: {
        [route: string]: Route;
    };

    private server: http.Server;

    private appInterceptors : Map<string,AppInterceptor[]> = new Map();
    private networkInterceptors : Map<string, NetworkInterceptor[]> = new Map();

    constructor() {
        this.routes = {};
        
        this.server = http.createServer((req, res) => {
            this.searchForRoute(req, res);
        });
    }

    private InterceptorBuilder = class {

        constructor(
            private mainServer : MainServer, 
            private interceptors : LocalInterceptorType) 
            {}

        addInterceptor(...interceptors : LocalInterceptorType){
            this.interceptors.push(...interceptors);
            return this.mainServer;
        }
    }
    
    paths(pattern : string) {
        if(!this.appInterceptors.get(pattern))
            this.appInterceptors.set(pattern,[]);
        return new this.InterceptorBuilder(this,this.appInterceptors.get(pattern) || [])
    }

    private executeInterceptorsRecursive(
        req : CustomRequest | IncomingMessage, 
        res : CustomResponse | ServerResponse, 
        path : string, 
        index : number,
        interceptors : Map<string, LocalInterceptorType>,
        callback: () => void,
        ) {

        const pattern = PathUtils.getPatternThatMatchesPath(interceptors.keys(),path);
        
        const intps = interceptors.get(pattern);
        if(intps && index<intps!.length){
            intps![index].intercept(req,res,()=>{
                this.executeInterceptorsRecursive(req,res,path,index + 1,interceptors,callback);
            })
        }else{
            callback();
        }
    }
    
    start(port: number, callback: (() => void | undefined)): void {
        this.server.listen(port, () => {
            callback();
        })
    }

    startAsync(port : number) : Promise<void> {
        return new Promise((resolve,reject)=>{
            this.server.listen(port, () => {
                resolve();
            })
        })
    }

    close() {
        this.server.close();
    }
    
    httpMethod(
        method: string,
        path: string,
        requestOptions: RequestOptions,
        handler: RouteHandler
    ): void {
        const pathIfExists = PathUtils.findPath(Object.keys(this.routes), path);

        if (pathIfExists !== null) {
            const route = this.routes[pathIfExists];

            const isMethodAlreadyExists = route.methods.findIndex(m => m === method) !== -1;
            if (isMethodAlreadyExists)
                return;

            route.methods.push(method);
            route.requestOpts.set(method, requestOptions)
            return;
        }

        const paramNames: string[] = [];

        const pathRegex = PathUtils.parsePath(path, paramNames);

        const requestOptsMap = new Map<string, RequestOptions>();
        requestOptsMap.set(method, requestOptions);

        this.routes[pathRegex + ""] = new Route(
            handler,
            [method],
            requestOptsMap,
            paramNames
        );
    }

    get(path: string, handler: RouteHandler): void {
        this.httpMethod("get", path, {}, handler);
    }

    post(path: string, handler: RouteHandler): void;
    post(path: string, requestOptions: RequestOptions, handler: RouteHandler): void;
    post(path: string, arg2: RouteHandler | RequestOptions, arg3?: RouteHandler): void {
        if (typeof arg2 === 'function') {
            this.httpMethod("post", path, {}, arg2);
        } else {
            this.httpMethod("post", path, arg2, arg3 as RouteHandler);
        }
    }

    private searchForRoute(req: http.IncomingMessage, res: http.ServerResponse) {
        const parsedUrl = parse(req.url!, true);

        const path = PathUtils.findPath(Object.keys(this.routes), parsedUrl.pathname!);

        if (path === null) {
            res.statusCode = 404;
            res.end();
            return;
        }

        const route = this.routes[path];

        const isMethodAllowed = route.methods.findIndex(m => m === req.method?.toLowerCase()) !== -1

        if (!isMethodAllowed) {
            res.statusCode = 405;
            res.end();
            return;
        }

        this.handleRequest(
            new ExtendedRequest(req),
            new ExtendedResponse(res),
            route,
            path,
            parsedUrl.pathname!,
            parsedUrl.query
        );
    }

    private handleRequest(
        req: CustomRequest,
        res: CustomResponse,
        route: Route,
        pathRegex: string,
        pathname: string,
        query: object
    ): void {

        console.log(pathname);

        const paramValues = PathUtils.extractParamsFromUrlPath(pathRegex, pathname);
        let i = 0;
        route.params?.forEach(p => {
            req.params[p] = paramValues[i];
            i++;
        })

        const queryParams = PathUtils.extractQueryParamsFromUrl(query);
        req.queryParams = queryParams;

        const requestOpts = route.requestOpts.get(req.request.method!.toLowerCase())
        if (requestOpts !== undefined)
            req.requestOpts = requestOpts;

        this.parseRequestBody(req, () => {
            this.executeInterceptorsRecursive(
                req,
                res,
                pathname,
                0,
                this.appInterceptors,
                () => {
                    route.handler(req, res);
                }
            )
        });
    }

    private parseRequestBody(req: CustomRequest, callback: () => void) {
        if (req.request.headers['content-type'] === JSON_CONTENT_TYPE)
            parseJSONRequestBody(req, callback);
        else if (req.request.headers['content-type']?.includes("multipart/form-data"))
            parseFormData(req, callback)
        else 
            callback();
    }


}   
