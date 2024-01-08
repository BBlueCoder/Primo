import { CustomRequest, RequestOptions } from "./custom-request";
import { CustomResponse } from "./custom-response";


export type RouteHandler = (req: CustomRequest, res: CustomResponse) => void;

export class Route {
    constructor(
        public handler: RouteHandler,
        public methods: string[],
        public requestOpts: Map<string, RequestOptions>,
        public params?: string[],
    ) { }
}