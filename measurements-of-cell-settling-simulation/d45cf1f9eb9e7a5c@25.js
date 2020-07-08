// https://observablehq.com/@csiz/vega@25
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Vega

Convenience wrapper for a more recent vegalite version. See https://github.com/observablehq/vega.`
)});
  main.variable(observer("vega_lib")).define("vega_lib", ["require"], function(require){return(
require("vega@4.4")
)});
  main.variable(observer("vegalite_lib")).define("vegalite_lib", ["require"], function(require){return(
require("vega-lite@3.0.0-rc10")
)});
  main.variable(observer("vegalite")).define("vegalite", ["vega_lib","vegalite_lib"], function(vega_lib,vegalite_lib){return(
function vegalite(spec) {
  var div = document.createElement("div");
  var view = div.value = new vega_lib.View(vega_lib.parse(vegalite_lib.compile(spec).spec));
  return view.initialize(div).runAsync().then(function() { return div; });
}
)});
  main.variable(observer("vega")).define("vega", ["vega_lib"], function(vega_lib){return(
vega_lib
)});
  return main;
}
