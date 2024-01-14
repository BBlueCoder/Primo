import { Primo } from './main-server/primo'

const server = new Primo()

server.start(5500, () => {
    console.log('Server is running on port : 5500')
})

server.get('/test', (req, res) => {
    res.status(200).serve(req.body)
})

server.get('/file', (req, res) => {
    res.status(200).serveStaticFile('./file.html')
})

server.get('/test/:id', (req, res) => {
    res.status(200).serve(req.body)
})

server.get('/test/:id/:p', (req, res) => {
    console.log(req.params.id)
    res.status(200).serve(req.body)
})

server.post(
    '/upload',
    {
        filename(filename: string, mimeType: string): string {
            return `${Date.now()}_file_${filename}`
        },

        destination(
            fieldName: string,
            filename: string,
            mimeType: string
        ): string {
            return './storage/'
        },
    },
    (req, res) => {
        console.log(req.files)
        const response = { data: 'success' }
        res.status(200).serve(response)
    }
)

server.post('path', (req, res) => {})
