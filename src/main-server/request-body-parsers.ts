import busboy = require('busboy');
import { pipeline } from 'stream';
import fs from 'fs';
import { CustomRequest } from './custom-request';

export function parseJSONRequestBody(req: CustomRequest, callback: () => void) {
    let currentBody = "";
    req.request.on("data", (data) => {
        currentBody += data.toString();
    })

    req.request.on("end", () => {
        req.body = JSON.parse(currentBody);
        callback();
    })
}

function getDestinationForSavingFiles(req: CustomRequest, fieldName: string, filename: string, mimeType: string): string {
    if (req.requestOpts !== undefined && req.requestOpts.destination !== undefined) {
        return req.requestOpts.destination(fieldName, filename, mimeType);
    }
    return "./storage/";
}

function getFilenameForSavingFiles(req: CustomRequest, filename: string, mimeType: string) {
    if (req.requestOpts !== undefined && req.requestOpts.filename !== undefined) {
        return req.requestOpts.filename(filename, mimeType);
    }

    return filename;
}

export function parseFormData(req: CustomRequest, callback: () => void) {
    const bb = busboy({ headers: req.request.headers })

    const files: string[] = [];
    const fields: { [name: string]: string } = {};

    req.files = {};
    let isClosed = false;

    bb.on('file', (fieldName, fileStream, info) => {
        files.push(info.filename);

        const destination = getDestinationForSavingFiles(
            req,
            fieldName,
            info.filename,
            info.mimeType
        );

        const filename = getFilenameForSavingFiles(req, info.filename, info.mimeType);

        const savePath = `${destination}${filename}`;
        const ws = fs.createWriteStream(savePath);

        pipeline(fileStream, ws, (err) => {
            if (err)
                console.log(err);
            else {
                fs.stat(savePath, (err, stats) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(stats.birthtime);
                        
                        if (req.files[fieldName] === undefined)
                            req.files[fieldName] = [];

                        req.files[fieldName].push({
                            filename: info.filename,
                            savedName: filename,
                            encoding: info.encoding,
                            mimeType: info.mimeType,
                            destination: destination,
                            size : stats.size,
                            date : stats.birthtime
                        })
                    }

                    files.pop();
                if (isClosed && files.length === 0)
                    callback();
                })
            }
        })
    })

    bb.on('field', (name, val, _) => {
        fields[name] = val;
        req.body = fields;
    });

    bb.on('close', () => {
        isClosed = true;
        if (isClosed && files.length === 0)
            callback();
    })

    req.request.pipe(bb);
}