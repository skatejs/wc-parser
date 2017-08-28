const cheerio = require("cheerio");
const outdent = require("outdent");
const prettier = require("prettier");
const fs = require("fs");
const path = require("path");
const uppercamelcase = require("uppercamelcase");

const imp = (i, p, d) => `import ${i} from '${resolve(p, d)}';`;
const boilerplate = dirname => `
  ${imp("{ props, withProps }", "skatejs/esnext/with-props", dirname)}
  ${imp("{ withRender }", "skatejs/esnext/with-render", dirname)}
  ${imp("{ html, render }", "lit-html", dirname)}
  function withLitHtml(Base) {
    return class extends withRender(withProps(Base || HTMLElement)) {
      rendererCallback (renderRoot, renderCallback) {
        render(renderCallback(), renderRoot);
      }
    };
  }
  const Base = withLitHtml();
`;

function resolve(modulePath, relativeTo) {
  try {
    return `./${path.relative(relativeTo, require.resolve(modulePath))}`;
  } catch (e) {
    return `./${modulePath.replace(".html", ".js")}`;
  }
}

function parseElement($element, dirname) {
  const name = $element.attr("name");
  const props = ($element.attr("props") || "").split(" ").filter(Boolean);
  const className = (name && uppercamelcase(name)) || "CustomElement";
  const imports = $element.find("import");
  const scripts = $element.find("script");

  return prettier.format(`
    ${boilerplate(dirname)}
    ${imports.toArray().map(e => parseImport($(e), dirname))}
    ${scripts.toArray().map(e => parseScript($(e))).join(";\n")}

    export default class ${className} extends Base {
      renderCallback({ ${props.map(parsePropName).join(",")} }) {
        return html\`${$element.html()}\`;
      }
    }

    ${props.length
      ? `${className}.props = { ${props.map(parseProp).join(",")} };`
      : ""}

    ${name ? `customElements.define('${name}', ${className})` : ""}
  `);
}

function parseImport($import, dirname) {
  const name = $import.attr("as");
  const src = $import.attr("src");
  const className = uppercamelcase(name || src);
  return prettier.format(`
    import ${className} from '${resolve(src, dirname)}';
    ${name ? `customElements.define('${name}', ${className});` : ""}
  `);
}

function parseScript($script, dirname) {
  return $script.html();
}

function parseProp(prop) {
  const [name, type] = prop.split(":");
  return `${name}${type ? `:props.${type || "{}"}` : ""}`;
}

function parsePropName(prop) {
  return prop.split(":")[0];
}

function parseAndReplace($, dirname, using) {
  return function(i, e) {
    const $e = $(e);
    $e.replaceWith(outdent`
      <script type="module">
      ${using($e, dirname).trim()}
      </script>
    `);
  };
}

function parse(file) {
  const dirname = path.dirname(file);
  const content = fs.readFileSync(file);
  const sfc = content.indexOf("<!DOCTYPE sfc>") > -1;
  const $ = cheerio.load(content);
  const elements = $("element");
  const imports = $("import");
  const scripts = $("script");

  if (sfc) {
    body = prettier.format(outdent`
      ${imports.toArray().map(e => parseImport($(e), dirname))}
      ${scripts.toArray().map(e => parseScript($(e))).join(";\n")}
      ${elements.toArray().map(e => parseElement($(e), dirname))}
    `);
  } else {
    imports.each(parseAndReplace($, dirname, parseImport));
    elements.each(parseAndReplace($, dirname, parseElement));
    body = $("body").html();
  }

  return { body, sfc };
}

module.exports.parse = parse;
