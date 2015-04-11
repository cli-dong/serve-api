'use strict';

var fs = require('fs')
var path = require('path')

var extend = require('extend')

function getMock(dest) {
  dest = path.join(process.cwd(), dest)

  var data = {}

  fs.readdirSync(dest).forEach(function(file) {
    if (/\.js(on)?$/.test(file)) {
     extend(data, require(path.join(dest, file)))
    }
  })

  return data
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
        data = data[req.method] || data['*']
      }

      if (data) {

        if (typeof data === 'function') {
          data = data(req.url, req.query)
        }

        if (typeof data === 'string' &&
            /^\{[\w\W]*\}|\[[\w\W]*\]$/.test(data)) {
          data = JSON.parse(data)
        }

        // REDIRECT
        //
        //   'MOCKAPI': {
        //     'redirect': 'some.url'
        //   }
        if (data.MOCKAPI && data.MOCKAPI.redirect) {
          req.url = data.MOCKAPI.redirect
          return next()
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
    } else {
      next()
    }
  }
}
