# skatejs/wc-parser

This parser will parse a glob of `html` files that contain declarative custom element definitions into `js` files. It will also replace any declarative imports and custom elements in a normal `html` file with `script` tags.

It allows you to write something like:

```html
<element props="name:string">
  Hello, ${name}!
</element>
```

When you run the file containing that through the parser, it will output a custom element definition for it.

## Parsing

To parse a set of HTML files you pass them through the `wc-parser` command:

```sh
wc-parser --src src/**/*.html --out out/
```

## Implementation details

It uses `skatejs` and `lit-html` by default to back up the custom elements you declare. We will be looking at making this pluggable in the future.
