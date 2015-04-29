'use strict';

var fs = require('fs')
var path = require('path')

var extend = require('extend')
var watch = require('watch')

var mocks = {}

function getMock(dest) {
  dest = path.join(process.cwd(), dest)

  function read(dest) {
    fs.readdirSync(dest).forEach(function(file) {
      var filePath = path.join(dest, file);
      var stats = fs.statSync(filePath)

      if (stats.isFile()) {
        if (/\.js(on)?$/.test(file)) {
          // delete require cache
          delete require.cache[path.resolve(filePath)];
          extend(mocks, require(filePath))
        }
      } else if (stats.isDirectory()) {
        read(filePath)
      }
    })
  }

  function make() {
    Object.keys(mocks).forEach(function(key) {
      delete mocks[key]
    })

    read(dest)
  }

  watch.createMonitor(dest, function (monitor) {
    monitor.on('created', function () {
      make()
    })
    monitor.on('changed', function () {
      make()
    })
    monitor.on('removed', function () {
      make()
    })
  })

  make()

  return mocks
}

module.exports = function(dest) {
  var mock
  var data

  return function(req, res, next) {
    if (/^(POST|PATCH|PUT|DELETE|GET)$/.test(req.method)) {

      if (!mock) {
        mock = getMock(dest)
      }

      data = mock[req.url]

      if (data) {
        data = (req.method in data) ? data[req.method] : data['*']
      }

      if (typeof data === 'undefined') {
        return next()
      }

      // CUSTOMIZE
      //
      //   'MOCKAPI': {
      //     'redirect': 'some.url'
      //     'status': '201'
      //     'response': 'created'
      //   }
      if (data.MOCKAPI) {
        // redirect
        if (data.MOCKAPI.redirect) {
          req.url = data.MOCKAPI.redirect
          return next()
        }
        // statusCode
        if (data.MOCKAPI.status) {
          res.statusCode = data.MOCKAPI.status
        }
        // responseText
        if (data.MOCKAPI.response) {
          data = data.MOCKAPI.response
        }
      }

      if (typeof data === 'function') {
        data = data(req.url, req.query)
      }

      if (typeof data === 'string' &&
          /^\{[\w\W]*\}|\[[\w\W]*\]$/.test(data)) {
        data = JSON.parse(data)
      }

      // json
      if (typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
      }

      res.write(typeof data === 'object' ?  JSON.stringify(data) : data)
      res.end()
    } else {
      next()
    }
  }
}
