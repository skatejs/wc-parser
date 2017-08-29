const cheerio = require("cheerio");
const outdent = require("outdent");
const prettier = require("prettier");
const fs = require("fs");
const objectHash = require("object-hash");
const path = require("path");
const uppercamelcase = require("uppercamelcase");

const importMap = {};
const getHash = el => objectHash(el.html()).substring(0, 7);
const getName = el => el.attr("name") || `x-${getHash(el)}`;
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
  const name = getName($element);
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

    customElements.define('${name}', ${className});
  `);
}

function parseImport($import, dirname) {
  const name = $import.attr("as");
  const src = $import.attr("src");
  const className = uppercamelcase(name || src);

  // Parse the import and map the alias to the acutal element name.
  if (name) {
    importMap[name] = getName(
      cheerio.load(fs.readFileSync(path.join(dirname, src)))("element").eq(0)
    );
  }

  return prettier.format(
    `import ${className} from '${resolve(src, dirname)}';`
  );
}

function parseElementNameFromImportSource(source) {
  const $elements = cheerio.load(source);
  return $elements.eq(0).attr("name");
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

function html(ch) {
  return ch("head").html() + ch("body").html();
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
      ${imports.toArray().map(e => parseImport($(e), dirname)).join(";\n")}
      ${scripts.toArray().map(e => parseScript($(e))).join(";\n")}
      ${elements.toArray().map(e => parseElement($(e), dirname)).join(";\n")}
    `);
  } else {
    imports.each(parseAndReplace($, dirname, parseImport));
    elements.each(parseAndReplace($, dirname, parseElement));
    body = html($);
  }

  Object.keys(importMap).forEach(key => {
    body = body.replace(
      new RegExp(`\<([\s\/]*)${key}([\s\>]*)`, "gim"),
      `<$1${importMap[key]}$2`
    );
  });

  return { body, sfc };
}

module.exports.parse = parse;
