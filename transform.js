/*
 * Transform tool to convert our Client logs into a Bunyan log format
 *
 * Example:
 *
 *  node transform.js log-2016-03-13-09:00:19.doctor_web.log | 
 *    bunyan -c 'this.module == "router"'
 * 
 */

var _ = require('underscore');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: argv.name || 'Doctor WebApp'});


function _bunyanize(l) {
  var metadata = ['module', 'event'];
  var formattedTime = new Date(l.timestamp).toUTCString()

  log[l.level.toLowerCase() || 'info'](
      // Meta Data
      _.extend(
        { time: formattedTime }, 
        _.pick(l.data, metadata),
        _.omit(argv, '_', 'name')
      ), 

      // Payload
      _.omit(l.data, metadata, 'timestamp')
  );
}

function bunyanize(fileName) {
  var input = JSON.parse( fs.readFileSync(fileName, 'utf8') );

  input.map(_bunyanize);
}

function fromStdin() {
  var stdin = process.stdin,
      inputChunks = [];

  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', function (chunk) {
    inputChunks.push(chunk);
  });

  stdin.on('end', function () {
    var inputJSON = inputChunks.join(),
        parsedData = JSON.parse(inputJSON);

    parsedData.map(_bunyanize);
  });
}

function main() {
  return argv._.length === 0 ?
    fromStdin() :
    argv._.map(bunyanize);
}


main();
