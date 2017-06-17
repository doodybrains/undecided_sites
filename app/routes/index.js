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
        if(err) { return console.error('error running query', err); }

        var s3 = new aws.S3(),
          file = "views/send.ejs",
          result = {
            error: 0,
            uploaded: []
          };

        flow.exec(
          function() {
            response.render('send',{links:req.body.links});
          },
          function() {
            fs.readFile("views/send.ejs", this);
          },
          function(err, data) {
            s3.putObject({
              Bucket: process.env.S3_BUCKET,
              Key: 'test',
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
          },
          function() {
            response.render("result", {
              title: "Upload Result",
              message: result.error > 0 ? "Something is wroing, Check your server log" : "Success!!",
              entitiyIDs: result.uploaded
            });
          });
      });
    });
  });

  app.get('/send', function (req, res) {
    res.render('send');
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
