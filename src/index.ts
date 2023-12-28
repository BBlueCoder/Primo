import { MainServer } from "./main-server/main-server";
import { AppInterceptor, Tuto } from "./main-server/tuto";


const authInterceptor : AppInterceptor = {
    intercept(next: Function): void {
        console.log("auth intercepts");   
        next();
    }
}

const securityInterceptor : AppInterceptor = {
    intercept(next : Function) : void {
        console.log("security intercepts");
        next();
    }
}

const cacheInterceptor : AppInterceptor = {
    intercept() : void {
        console.log("app intercept");
    }
}

const t = new Tuto();

t
    .paths("/pathname/*").addInterceptor(authInterceptor)
    .paths("/pathname/*").addInterceptor(securityInterceptor)
    .paths("/pathname/**").addInterceptor(cacheInterceptor)
    .paths("/a").addInterceptor(authInterceptor)

t.excute("/pathname/*");

const server = new MainServer();

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
    console.log(req.queryParams.page);
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

    filename(filename: string, mimeType : string): string {
        return `file_${filename}`;
    },

    destination(fieldName : string, filename : string, mimeType : string) : string {
        return "./testStorage/";
    }

}, (req, res) => {
    console.log(req.files.file);
    console.log(req.body!.param);
    res.status(200).serve('');
})



// server.post('path',opts,(req,res)=> {

// })