#!/usr/bin/env node
var concat = require('concat-stream')
var mmm = require('mmmagic')
var toBuffer = require('data-uri-to-buffer')
var request = require('request')

function recurl(serviceUrl) {
  var isRequest = !!serviceUrl

  return concat(function (file) {
    var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE) // wtf?
    magic.detect(file, function (err, type) {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      var json = '{"meta":{},"content":{"data":"' +'data:' + type + ';base64,'
      json += file.toString('base64')
      json += '"}}'


      if (isRequest) {
        request.post({
          url: serviceUrl,
          json: true,
          headers: {'content-type':'application/json'},
          body: json
        }, function (e, res) {
          if (e) {
            console.error(e)
            process.exit(1)
          }
        }).pipe(process.stdout)
      }

      if (!isRequest) {
        process.stdout.write(json)
      }

    })
    

  })
}

function uncurl() {
  return concat(function (req) {
    var json = JSON.parse(req)
    process.stdout.write(toBuffer(json.content.data))
  })
}

var argv = process.argv
if (contains(argv, '-n') ||
    contains(argv, '--no') ||
    contains(argv, '--no-u')) {
  process.stdin.pipe(uncurl())
} else if (contains(argv,'-s') ||
      contains(argv,'--service')){
  // super janky for now cause recurl isnt a transform stream like it should be
  process.stdin.pipe(recurl(argv[argv.length-1]))
} else {
  process.stdin.pipe(recurl())
}

function contains(arr, x) {
  return arr.indexOf(x) !== -1
}
