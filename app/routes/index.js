var pg = require('pg');

module.exports = function(app, db) {
  app.get('/links', function (req, res) {
    res.send('Hello');
    console.log(req, res);
  });

  app.get('/', function (req, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('SELECT * FROM site_table', function(err, result) {
        done();
        if (err)
         { console.error(err); response.send("Error " + err); }
        else
         { response.render('index', {results: result.rows} ); }
      });
    });
  });
};
