var dotenv = require('dotenv');
var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require('fs');
var aws = require('aws-sdk');
var path = require('path');
var flow = require('flow');
dotenv.load();

module.exports = function(app, db) {
  app.engine('html', require('ejs').renderFile);
  app.use(bodyParser.json());
  app.post('/links', function (req, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO site_table(id, links) VALUES($1, $2) returning id', [req.body.id, req.body.links], function(err, result) {
        done();
        if (err)
         { console.error(err); response.send("Error " + err); }
        else
        { response.send(req.body.links) }
      });
    });
  });

  app.post('/send', function (req, res) {
    var s3 = new aws.S3(),
    result = {
      error: 0,
      uploaded: []
    };

    var indexbody = `<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="https://s3-us-west-2.amazonaws.com/undecided-sites/${req.body.style}.css">
    <link href="https://fonts.googleapis.com/css?family=Roboto+Mono" rel="stylesheet"></head><body><div class="container">${req.body.response}</div></body></html>`;

    flow.exec(
      function() {
        app.set('data', req.body.response);
        fs.writeFile(`public/index-${req.body.tag}.html`, indexbody, function(err) {
            if(err) {
              return console.log(err);
            }
        });
        fs.readFile(`public/index-${req.body.tag}.html`, this);
      },
      function(err, data) {
        s3.putObject({
          Bucket: process.env.S3_BUCKET,
          Key: `${req.body.tag}.html`,
          Body: data,
          ContentType: 'text/html',
        }, this);
      },
      function(err, data) {
        if (err) {
          console.error('Error : ' + err);
          result.error++;
        }
        result.uploaded.push(JSON.stringify(data));
        this();
      });
      res.send(`Here's your ${req.body.style} website: https://s3-us-west-2.amazonaws.com/undecided-sites/${req.body.tag}.html`);
  });

  app.get('/send', function (req, res) {
    res.render('send', {results: app.get('data')});
  });

  app.get('/', function (req, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('SELECT * FROM site_table ORDER  BY ctid DESC', function(err, result) {
        done();
        if (err)
         { console.error(err); response.send("Error " + err); }
        else
         { response.render('index', {results: result.rows} ); }
      });
    });
  });
};
