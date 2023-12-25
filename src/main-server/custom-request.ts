import * as http from 'http';
import {EventEmitter} from 'events';
import { RequestOptions } from './main-server';

export interface FileMetadata {
    filename : string,
    savedName : string,
    encoding : string,
    mimeType : string,
    destination : string,
    size : number,
    date : Date
}

export interface CustomRequest {
    body : {
        [name: string] : any
    };

    request : http.IncomingMessage;

    requestOpts? : RequestOptions

    files : { [fieldName : string] : FileMetadata[] };

    params: {
        [name: string]: string;
    }

    queryParams: {
        [name: string]: string;
    }
}

export class ExtendedRequest extends EventEmitter implements CustomRequest  {
    body: {
        [name: string] : any
    } = {};

    request : http.IncomingMessage;

    files: { [fieldName: string]: FileMetadata[]; } = {};
    

    params: {
        [name: string]: string;
    } = {};

    queryParams: { [name: string]: string; } = {}

    constructor(req : http.IncomingMessage) {
        super();
        this.request = req;
    } 
}

