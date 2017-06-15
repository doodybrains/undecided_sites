const express = require('express');
const app = express();
const local = 5000;
app.set('port', (process.env.PORT || local));
app.set('view engine', 'ejs');
require('./app/routes')(app, {});
app.listen(app.get('port'), () => {
  console.log('We are live on');
});
