# skatejs/wc-parser

This parser will parser a glob of `html` files that contain declarative custom element definitions into `js` files. It will also replace any declarative imports and custom elements in a normal `html` file with `script` tags.

The following will parse all `html` files in `src` and put them in `out`:

```sh
wc-parser --src src/**/*.html --out out/
```
