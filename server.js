let http = require('http');
let url = require('url');
const mo = require('./modules/utils');
const lang = require('./lang/en/en'); // Import the language file

http.createServer(function (req, res) {
    let q = url.parse(req.url, true);
    console.log(q.query);

    let message = lang.message
        .replace("{name}", q.query.name)
        .replace("{date}", mo.getDate());

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(message);
}).listen(8888);
