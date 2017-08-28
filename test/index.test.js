const path = require("path");
const { parse } = require("..");

describe("output", () => {
  it("html", () => {
    expect(parse(path.join(__dirname, "src/index.html"))).toMatchSnapshot();
  });

  it("complex sfc", () => {
    expect(parse(path.join(__dirname, "src/world.html"))).toMatchSnapshot();
  });

  it("simple sfc", () => {
    expect(parse(path.join(__dirname, "src/hello.html"))).toMatchSnapshot();
  });
});
