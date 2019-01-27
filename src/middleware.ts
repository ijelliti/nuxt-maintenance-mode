import { matchRoute } from './utils/matcher'
import { createOriginFromNuxtOptions } from './utils/createOrigin'
import { ModuleOptions } from './types/nuxt';
import { DOMWindow } from 'jsdom'

process.env.DEBUG = 'nuxt:*'

export function createMiddleware(options: ModuleOptions) {
  return async (req: any, res: any, next: () => void) => {
    const { Nuxt } = require('nuxt')
    const nuxt = new Nuxt(options.nuxt.options)
    if (options.matcher && !matchRoute(req.path, options.matcher)) {
      next()
      return
    }
    if (matchRoute(req.url, options.path || '')) {
      next()
      return
    }
    try {
      const origin = createOriginFromNuxtOptions(options.nuxt.options)
      const window = (await nuxt.renderAndGetWindow(`${origin}${options.path}`)) as DOMWindow
      const scripts = window.document.querySelectorAll('script')
      scripts.forEach((script) => {
        script.remove()
      })
      const preloads = window.document.querySelectorAll('script')
      preloads.forEach((preload) => {
        preload.remove()
      })
      res.writeHead(503, { 'Content-Type': 'text/html' })
      res.write(window.document.querySelector('html')!.outerHTML, () => {
        res.end()
        return
      })
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'text/html' })
      res.write(`<html><body>500 Internal server errror </body></html>`, () => {
        res.end()
        return
      })
    }
  }
}
