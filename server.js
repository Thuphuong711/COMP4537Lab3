const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const mo = require('./modules/utils');
const lang = require('./lang/en/en'); // Import the language file
const PORT =  8080; // Use environment PORT or default to 8080
const FILE_PATH = path.join(__dirname, 'file.txt');

class Server{
    constructor(port, fileHandler){
        this.port = port;
        this.fileHandler = fileHandler;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    handleRequest(req,res){
        const parsedUrl = url.parse(req.url,true);
      
        if(parsedUrl.pathname === '/getDate/'){
            console.log('getDate');
            console.log(parsedUrl.query);
            let message = lang.message
            .replace("{name}", parsedUrl.query.name)
            .replace("{date}", mo.getDate());
    
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(message);
        }
        else if(parsedUrl.pathname === '/writeFile/'){
            console.log('writeFile');
            const text = parsedUrl.query.text;
            if(!text){
                res.writeHead(400, {'Content-Type': 'text/plain'});
                return res.end(lang.badRequest);
            }

            this.fileHandler.appendText(text, (err) => {
                if(err){
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    return res.end(lang.serverError);
                }
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(`${text}\n`)
            })
            return;
        } 

        else if (parsedUrl.pathname.startsWith('/readFile/')) {
            const pathParts = parsedUrl.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            console.log("fileName: ", fileName);
            if (req.method === 'GET') {
                if (fileName) {
                    const filePath = `./${fileName}`;
                    fs.access(filePath, fs.constants.F_OK, (err) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            return res.end(lang.pageNotFound.replace("{file}", filePath));
                        } else {
                            this.fileHandler.readFile(filePath, res);
                        }
                    });
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(message.readError);
            }
        }
        
        else {
            res.writeHead(404, {'Content-Type': 'text/plain'})
            return res.end(lang.pageNotFound.replace("{file}", this.fileHandler.filePath));
        }
       
    }

    start(){
        this.server.listen(this.port, () => {
            console.log('start')
            console.log(`Server is running on port ${this.port}`);
        })
    }
}

class FileHandle{
    constructor(filePath){
        this.filePath = filePath;
    }

    appendText(text, callback){
        fs.appendFile(this.filePath, text + '\n', callback);
    }

    readFile(filePath, res) {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(message.pageNotFound.replace("{file}", filePath));
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(data);
            }
        });
    }
    
}

const fileHandler = new FileHandle(FILE_PATH);
const server = new Server(PORT, fileHandler);
server.start();