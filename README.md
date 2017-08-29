# skatejs/wc-parser

`wc-parser` is a parser that allows you to declaratively define custom elements using `<element />` inside `.html` files. It will transpile them accordingly in a format that can be passed through Babel and other tools.

It allows you to write something like:

```html
<!DOCTYPE sfc>
<import src="./path/to/helper.html" as="helper">
<element name="x-hello" props="name:string">
  Hello, <helper>${name}</helper>!
</element>
```

When you run the file containing that through the parser, it will output something like:

```js
// Assume skatejs and lit-html helpers are already compiled in.

// Contains a custom element definition for <x-helper />.
import './path/to/helper.js';

class XHello extends withLitHtml() {
  renderCallback() {
    return html`Hello, <x-helper>${name}</x-helper>!`;
  }
}

XHello.props = {
  name: props.string
};

customElements.define('x-hello', XHello);
```

## Custom elements

Custom elements are defined using SkateJS with a LitHTML renderer. This means that your custom elements inherit all of the semantics that Skate provides and your templates are just LitHTML templates rendered with Skate.

### Single-file components

A single-file component assumes that you're only defining a single component inside of a single HTML file. This has benefits because this file can be imported and the custom element defined within can be aliased by the import. If you define multiple elements, then what you're aliasing is ambiguous, thus not allowed.

To define a single-file component, you must add the correct `DOCTYPE` directive:

```html
<!DOCTYPE sfc>
```

Files containing this doctype are transpiled to `.js` files and will contain only a single custom element definintion. They will also `export default` the custom element definition.

### Standard HTML files

You may contain custom element definitions in standard HTML files. the only difference is that you cannot reuse them outside of that file. The definitions are transformed in place, and though they can import other files, they cannot be imported themselves.

This might look something like:

```html
<div>
  <element name="x-hello" props="name:string">
    Hello, ${name}!
  </element>
  <x-hello name="Bob" />
  <x-hello name="Jane" />
</div>
```

Unlike SFCs, elements defined in an HTML file require a `name` be specified and you cannot specifiy custom behaviour via scripts.

### Defining a name

Defining a name for the custom element is optional, however, this gives you better debuggability when inspecting your document tree in dev tools. To do this, simply define the `name` attribute:

```html
<!DOCTYPE sfc>
<element name="my-element" />
```

### Declaring attributes / properties

SkateJS is used underneath the hood to provide meaningful attribute and property semantics. This means, that you declare the names and types of the properties - separated by a colon (`:`) - that should cause the component to render.

```html
<!DOCTYPE sfc>
<element props="name:string isVisible:boolean" />
```

- Attributes are automatically reflected to the property for all built-in types that Skate provides. This means a `setAttribute()` will trigger a property update for the corresponding property.
- Properties that are `camelCase` will have a correspnding attributes that are `dash-case`.

You may also provide custom property definitions in a script tag:

```html
<!DOCTYPE sfc>
<element props="name:customProp" />
<script>
  const customProp = {};
</script>
```

*If you do not specify a custom property definition within the scope of the element, then it will result in an undefined runtime error.*

## Imports

Imports allow you to import an HTML file that are parsed according to the custom element semantics defined above.

Imports require you specify a `src`:

```html
<import src="./my/import.html" />
```

If you want to alias the custom element that's created inside the import, then you can specify the `as` option:

```html
<import src="./my/import.html" as="my-import" />
```

This allows you to use the name *you* provide instead of the one that may have been provided as the `name` option to the custom element in the file. If a name is *not* specified, then it is *required* you specify `as`.

## Parsing

To parse a set of HTML files you pass them through the `wc-parser` command:

```sh
wc-parser --src src/**/*.html --out out/
```
