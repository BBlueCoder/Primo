import { CustomRequest } from "./main-server/custom-request";
import { CustomResponse } from "./main-server/custom-response";
import { AppInterceptor } from "./main-server/interceptors";
import { MainServer } from "./main-server/main-server";


const authInterceptor: AppInterceptor = {
    intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
        console.log("auth intercepts");
        next();
    }
}

const cacheInterceptor: AppInterceptor = {
    intercept: function (req: CustomRequest, res: CustomResponse, next: () => void): void {
        console.log("cach intercepts");
        next();
    }
}

const server = new MainServer();
server
    .paths("/**").addInterceptor(authInterceptor);


server.start(5500, () => {
    console.log("Server is running on port : 5500");
})

server.get("/test", (req, res) => {
    res.status(200).serve(req.body);
})

server.get('/file', (req, res) => {
    res.status(200).serveStaticFile('./file.html');
})

server.get('/test/:id', (req, res) => {
    res.status(200).serve(req.body);
})

server.get('/test/:id/:p', (req, res) => {
    console.log(req.params.id);
    res.status(200).serve(req.body);
})

server.get('/loop', (req, res) => {
    let a = 5;
    let b = 10;
    while (true) {
        a = a + a * b * 100 * 9999999;
    }
})

server.post('/upload', {

    filename(filename: string, mimeType: string): string {
        return `file_${filename}`;
    },

    destination(fieldName: string, filename: string, mimeType: string): string {
        return "./testStorage/";
    }

}, (req, res) => {
    console.log(req.files.file);
    console.log(req.body!.param);
    res.status(200).serve('');
})



// server.post('path',opts,(req,res)=> {

// })