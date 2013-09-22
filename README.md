# Postorder

Minimal work queue in postgres.

## Installation

    npm install postorder

## Producer usage

    var client = require('postorder').create('pg://localhost/db');
    client.send({ my: 'word' });

## Consumer usage

    var client = require('postorder').create('pg://localhost/db');
    client.listen(function (err, msg) {
      if(err) throw err;
      console.log(msg.my); //> 'word'
    });

    // you can also use shift to only take a single work item.
    client.shift(function (err, msg) { });

