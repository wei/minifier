const packageJSON = require('./package.json'),
  micro = require('micro'),
  minify = require('html-minifier').minify

const PORT = process.env.PORT || 3500

const server = micro(async (req, res) => {
  res.setHeader('Content-Type', 'text/plain');

  if (req.url === '/version' && req.method === 'GET') {
    return packageJSON.dependencies['html-minifier']
  }

  if (req.url === '/' && req.method === 'POST') {
    let data = {}
    try {
      data = await micro.json(req, {limit: '1mb',encoding: 'utf8'})
      if (typeof data.input !== 'string') {
        throw micro.createError(400, 'Invalid Request')
      }
    } catch (err) {
      return micro.sendError(req, res, micro.createError(400, err.message))
    }

    try {
      switch (data.type) {
        case 'js':
          return minify(`<script>${data.input}</script>`, {minifyJS: data.config || true})
            .replace(/^<script>/, '')
            .replace(/<\/script>$/, '')
        case 'css':
          return minify(`<style>${data.input}</style>`, {minifyCSS: data.config || true})
            .replace(/^<style>/, '')
            .replace(/<\/style>$/, '')
        default:
          return minify(data.input, Object.assign({}, data.config))
      }
    } catch (err) {
      return micro.sendError(req, res, micro.createError(400, err.message))
    }
  }

  return micro.sendError(req, res, micro.createError(404, 'Not Found'))
})

server.listen(PORT, (err) => {
  if (err) {
    return console.error(err)
  }
  console.log(`Listening on 0.0.0.0:${PORT}`)
})
