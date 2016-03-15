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


function bunyanize(fileName) {
  var input = JSON.parse( fs.readFileSync(fileName, 'utf8') );

  input.map(function(l) {
    var metadata = ['module', 'event'];
    var formattedTime = new Date(l.timestamp).toUTCString()

    // Log Level is the function-name
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
  });
}

argv._.map(bunyanize);
