# serve-api
serve mock api middleware

## Usage
```
var express = require('express')
var serveApi = require('serve-api')

var app = express()

app.use(serveApi('dir/to/api', {'log': true}))
app.listen(3000)
```
