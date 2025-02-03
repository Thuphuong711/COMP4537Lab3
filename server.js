const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const mo = require('./modules/utils');
const lang = require('./lang/en/en'); // Import the language file

class Server{
    constructor(port, fileHandler){
        this.port = port;
        this.fileHandler = fileHandler;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    handleRequest(req,res){
        const parsedUrl = url.parse(req.url,true);
      
        if(parsedUrl.pathname === '/getDate/'){
            console.log(parsedUrl.query);
            let message = lang.message
            .replace("{name}", parsedUrl.query.name)
            .replace("{date}", mo.getDate());
    
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(message);
        }
        else if(parsedUrl.pathname === '/writeFile/'){
            const text = parsedUrl.query.text;
            if(!text){
                res.writeHead(400, {'Content-Type': 'text/plain'});
                return res.end('Bad Request: Missing text parameter');
            }

            this.fileHandler.appendText(text, (err) => {
                if(err){
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Internal Server Error');
                }
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end(`${text}`)
            })
        } 

        else if(parsedUrl.pathname.startsWith('/readFile/')){
            this.fileHandler.readFile((err, data) => {
                if(err){
                    if(err.code === 'ENOENT'){
                        res.writeHead(404, {'Content-Type': 'text/plain'});
                        return res.end(`Error 404 : ${this.FileHandler.filePath} not found`);
                    }
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Internal Server Error');
                }
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data);
            })
        }
        else {
            res.writeHead(404, {'Content-Type': 'text/plain'})
            res.end("Error :" + lang.error)
        }
       
    }

    start(){
        this.server.listen(this.port, () => {
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

    readFile(callback) {
        fs.open(this.filePath, 'a+', (err, fd) => {
            if (err) {
                return callback(err);
            }
            fs.readFile(this.filePath, 'utf8', (err, data) => {
                fs.close(fd, () => {}); // Close the file descriptor
                if (err) {
                    return callback(err);
                }
                callback(null, data || ''); // Return empty content if file is new
            });
        });
    }
    
}
const PORT =  8080; // Use environment PORT or default to 8080
const FILE_PATH = path.join(__dirname, 'file.txt');
const fileHandler = new FileHandle(FILE_PATH);
const server = new Server(PORT, fileHandler);
server.start();