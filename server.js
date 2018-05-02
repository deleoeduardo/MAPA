var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
express.static.mime.default_type = "text/html";
app.use(express.static(path.join(__dirname,'/public')));


app.get('/map.html', function (req, res) {
   console.log(__dirname);
   console.log(path.join(__dirname,'/public'));
   res.sendFile( __dirname + "/" + "map.html" );
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})