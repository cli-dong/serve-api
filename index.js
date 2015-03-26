'use strict';

var fs = require('fs')
var path = require('path')

var chalk = require('chalk')
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

module.exports = function(mock, options) {
  var mock
  var data
  var log = options && options.log

  return function(req, res, next) {
    if (/^(POST|PATCH|PUT|DELETE|GET)$/.test(req.method)) {

      if (!mock) {
        mock = getMock(mock)
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

        if (log) {
          console.log(chalk.white(chalk.blue('  [API 200]') + ' %s'), req.url)
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
        if (log && req.headers['x-requested-with'] === 'XMLHttpRequest') {
          console.log(chalk.white(chalk.red('  [API 404]') + ' %s'), req.url)
        }

        next()
      }
    } else {
      next()
    }
  }
}
