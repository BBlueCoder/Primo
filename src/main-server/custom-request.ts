import * as http from 'http';
import {EventEmitter} from 'events';


export interface RequestOptions {
    destination?: (fieldName: string, filename: string, mimeType: string) => string;
    filename?: (filename: string, mimeType: string) => string;
}

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

