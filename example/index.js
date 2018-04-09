var express = require('express');
var app = express();

/* view engine setup */
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(express.static('../'));

/* routerの設定 */
app.get('/', (req, res) => { res.render('index', {}); });

app.listen(50000);