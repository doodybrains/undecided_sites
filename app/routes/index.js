var dotenv = require('dotenv');
var pg = require('pg');
var bodyParser = require('body-parser');
dotenv.load();

module.exports = function(app, db) {
  app.use(bodyParser.json());
  app.post('/links', function (req, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO site_table(id, link) VALUES($1, $2) returning id', [req.body.id, req.body.link], function(err, result) {
        done();
        if(err) {
          return console.error('error running query', err);
        }
        response.send(result);
      });
    });
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
