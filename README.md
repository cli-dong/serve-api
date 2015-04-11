# serve-api

[![NPM version](https://img.shields.io/npm/v/serve-api.svg?style=flat-square)](https://npmjs.org/package/serve-api)

> Serve middleware for mocking api

## Usage
```
var express = require('express')
var serveApi = require('serve-api')

var app = express()

app.use(serveApi('dir/to/api', {'log': true}))
app.listen(3000)
```

## Mocking

> Searching for js and json files in the directory

### Pattern

```json
{
  "<URL>": {
    "<METHOD>": "<VALUE>"
  }
}
```

- `<URL>`: Request URL, without query string.
- `<METHOD>`: RESTful request method，such as `POST|PATCH|PUT|DELETE|GET`, and `*` matches all methods.
- `<VALUE>`: Response text, could be json or string.

### Examples

```js
module.exports = {
  '/foo/bar': {
    'GET': function(url, query) {
      // do something with url and query
      return {
        code: 0,
        message: 'ok'
      };
    }
  }
};
```

```js
module.exports = {
  '/foo/bar': {
    '*': {
      code: 0,
      message: 'ok'
    }
  }
};
```

```json
{
  "/foo/bar": {
    "*": {
      "code": 0,
      "message": "ok"
    }
  }
}
```

```json
// for redirect
{
  "/foo/bar": {
    "*": {
     "MOCKAPI": {
       "redirect": "some.url"
     }
    }
  }
}
```
