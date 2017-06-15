const express = require('express');
const app = express();
const port = 5000;
app.set('view engine', 'ejs');
require('./app/routes')(app, {});
app.listen(port, () => {
  console.log('We are live on ' + port);
});
