
import * as http from 'http';
import { EventEmitter } from 'events';
import { CustomRequest, ExtendedRequest, FileMetadata } from './custom-request';
import { CustomResponse, ExtendedResponse } from './custom-response';
import { parse } from 'url';
import { PathUtils } from './path-utils';
import { parseJSONRequestBody,parseFormData} from './request-body-parsers';

type RouteHandler = (req: CustomRequest, res: CustomResponse) => void;

const JSON_CONTENT_TYPE = "application/json";

export class Route {
    constructor(
        public handler: RouteHandler,
        public methods: string[],
        public requestOpts: Map<string, RequestOptions>,
        public params?: string[],
    ) { }
}

export interface RequestOptions {
    destination?: (fieldName: string, filename: string, mimeType: string) => string;
    filename?: (filename: string, mimeType: string) => string;
}


export class MainServer extends EventEmitter {

    private routes: {
        [route: string]: Route;
    };
    private server: http.Server;

    // abstract handleRequest(req: http.IncomingMessage, res: http.ServerResponse, route : Route) : void

    constructor() {
        super();

        this.routes = {};

        this.server = http.createServer((req, res) => {
            this.searchForRoute(req, res);
        });
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
            route.handler(req, res);
        });

    }

    start(port: number, callback: (() => void | undefined)): void {
        this.server.listen(port, () => {
            callback();
        })
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

    private parseRequestBody(req: CustomRequest, callback: () => void) {
        if (req.request.headers['content-type'] === JSON_CONTENT_TYPE)
            parseJSONRequestBody(req, callback);
        else if (req.request.headers['content-type']?.includes("multipart/form-data"))
            parseFormData(req, callback)
        else 
            callback();
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
}   
