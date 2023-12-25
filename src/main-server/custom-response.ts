import * as http from 'http';
import { getMimeType } from '../utils/get-mime-type';
import * as fs from 'fs';
import { pipeline } from 'stream';

export interface CustomResponse {

    response: http.ServerResponse;

    status(code: number): CustomResponse;

    serveStaticFile(path: string): void;

    serve(response: any): void;
}

export class ExtendedResponse implements CustomResponse {

    response: http.ServerResponse<http.IncomingMessage>;


    constructor(res: http.ServerResponse) {
        this.response = res;
    }

    status(code: number): CustomResponse {
        this.response.statusCode = code;
        return this;
    }

    setHeader(k: string, v: string) {
        if(!this.response.hasHeader(k)){
            this.response.setHeader(k, v);
        }
        return this;
    }

    serveStaticFile(path: string): void {
        const mimeType = getMimeType(path);

        if (mimeType !== null)
            this.setHeader('Content-Type', mimeType);

        const rs = fs.createReadStream(path);

        pipeline(
            rs,
            this.response,
            (err) => {
                if (err)
                    console.log(err);
                this.response.end();
            }
        )
    }

    serve(response: any): void {
        
        switch (typeof response) {
            case 'object':
                this.setHeader('Content-Type', getMimeType("..json")!);
                this.response.end(JSON.stringify(response));
                return;
            case 'string':
                this.setHeader('Content-Type', getMimeType('..html')!);
                break;
            case 'bigint':
            case 'boolean':
            case 'number':
                this.setHeader('Content-Type',getMimeType('..txt')!);
                break;
        }

        this.response.end(response);
    }

}