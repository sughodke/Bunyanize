/*
 * Transform tool to convert our Client logs into a Bunyan log format
 *
 * Example:
 *
 *  node transform.js web-2016-03-13-09:00:19.log | 
 *    bunyan -c 'this.module == "router"'
 * 
 *  ssh -c "cat log.file" | node transform.js | bunyan
 *
 * Optional flags:
 *  --pid=-1           Overwrite the system pid, during transformation
 *  --hostname=Beaker  Overwrite the hostname, during transformation
 *  --name="WebApp"    Set the application name
 *
 */

var _ = require('underscore');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: argv.name || 'Doctor WebApp'});


function _bunyanize(item) {
  var metadata = ['module', 'event'];
  var formattedTime = new Date(item.timestamp).toUTCString()

  log[item.level.toLowerCase() || 'info'](
    // Meta Data
    _.extend(
      { time: formattedTime }, 
      _.pick(item.data, metadata),
      _.omit(argv, '_', 'name')
    ), 

    // Payload
    _.omit(item.data, metadata, 'timestamp')
  );
}

function bunyanize(fileName) {
  var input = JSON.parse( fs.readFileSync(fileName, 'utf8') );

  input.map(_bunyanize);
}

function fromStdin() {
  var stdin = process.stdin;
  var inputChunks = [];

  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', function (chunk) {
    inputChunks.push(chunk);
  });

  stdin.on('end', function () {
    var inputJSON = inputChunks.join();
    var parsedData = JSON.parse(inputJSON);

    parsedData.map(_bunyanize);
  });
}

function main() {
  return argv._.length === 0 ?
    fromStdin() :
    argv._.map(bunyanize);
}


main();
