'use strict';
var pg = require('pg');
var setupQuery = require('fs').readFileSync(require.resolve('./setup.sql')).toString('utf-8');

module.exports = Postorder;
module.exports.create = Postorder;

function errback(onError, onSuccess) {
  return function (err, result) {
    if(err && onError) return onError(err);
    else if(err) throw err;
    else if(onSuccess) onSuccess.apply(null, Array.prototype.slice.call(arguments, 1));
  };
}

function Postorder(connectionString) {
  if(!(this instanceof Postorder)) {
    return new Postorder(connectionString);
  }

  this.connectionString = connectionString;
  this.setupComplete = false;
}

Postorder.prototype.connect = function(cb) {
  var self = this;
  pg.connect(this.connectionString, errback(cb, connected));

  function connected(client, done) {
    if(self.setupComplete) return cb(null, client, done);
    client.query(setupQuery, errback(cb, function () {
      cb(null, client, done);
    }));
  }
}

Postorder.prototype.push = function send(msg, cb) {
  var sql = 'INSERT INTO postorder.work (msg) VALUES($1::json);';
  this.connect(errback(cb, send));

  function send(client, done) {
    client.query(sql, [JSON.stringify(msg)], function (err) {
      done(client);
      if(err && !cb) throw err;
      cb && cb(null, true);
    });
  };
}

Postorder.prototype.shift = function fetch(cb) {
  if(!cb) throw new Error('callback must be supplied');
  var self = this;

  this.connect(errback(cb, function (client, done) {
    client.query('SELECT postorder_work_fetch() AS msg;', function (err, value) {
      done();

      if(err) return cb(err);
      var row = value.rows[0];
      cb(null, row ? row.msg : null);
    });
  }));
}

Postorder.prototype.listen = function listen(cb) {
  if(!cb) throw new Error('callback must be supplied');
  var client, done, self = this;

  function msg(err, value) {
    if(err) cb(err);
    else if(!value) return;
    cb(null, value);
    self.shift(msg);
  }

  this.connect(errback(cb, connected));
  function connected(inClient, inDone) {
    client = inClient; done = inDone;
    self.shift(msg);
    client.on('notification', self.shift.bind(self, msg));
    client.query('LISTEN postorder_work', errback(cb));
  }
};

