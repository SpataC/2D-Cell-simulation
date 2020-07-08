// https://observablehq.com/@csiz/inputs@1521
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Inputs
<div style="margin-top: -3px; font-weight: 100; font-size: 1.05em;">*a.k.a “The Grand Input Bazaar”*</div>

<img width="350px" src="https://etc.usf.edu/clipart/20000/20058/capstan_20058_md.gif" />

A collection of assorted fancy inputs, odds and ends — with which to produce values to feed your burgeoning sketches. All inputs support optional **titles** and **descriptions**; where it makes sense, inputs also support a **submit** option, which allows you to prevent the value from updating until the input has been finalized.

Wares we have on offer: 
  * \`slider\`
  * \`button\`
  * \`select\`
  * \`color\`
  * \`date\`
  * \`file\`
  * \`text\`
  * \`textarea\`
  * \`radio\`
  * \`checkbox\`
  * \`number\`

*Although hopefully we’ll have a better way to send patches soon — for now, please fork and message me any improvements you’d like to see incorporated here.*`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Sliders

\`import {slider} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof a")).define("viewof a", ["slider"], function(slider){return(
slider()
)});
  main.variable(observer("a")).define("a", ["Generators", "viewof a"], (G, _) => G.input(_));
  main.variable(observer("viewof a1")).define("viewof a1", ["slider"], function(slider){return(
slider({
  min: 0, 
  max: 1, 
  step: 0.01, 
  format: ".0%",
  description: "Zero to one, formatted as a percentage"
})
)});
  main.variable(observer("a1")).define("a1", ["Generators", "viewof a1"], (G, _) => G.input(_));
  main.variable(observer("viewof a2")).define("viewof a2", ["slider"], function(slider){return(
slider({
  min: 0, 
  max: 100, 
  step: 1, 
  value: 10, 
  title: "Integers", 
  description: "Integers from zero through 100"
})
)});
  main.variable(observer("a2")).define("a2", ["Generators", "viewof a2"], (G, _) => G.input(_));
  main.variable(observer("viewof a3")).define("viewof a3", ["slider"], function(slider){return(
slider({
  min: 0.9,
  max: 1.1,
  precision: 3,
  description: "A high precision slider example"
})
)});
  main.variable(observer("a3")).define("a3", ["Generators", "viewof a3"], (G, _) => G.input(_));
  main.variable(observer("viewof a4")).define("viewof a4", ["slider"], function(slider){return(
slider({
  min: 0.9,
  max: 1.1,
  precision: 3,
  submit: true,
  description: "The same as a3, but only changes value on submit"
})
)});
  main.variable(observer("a4")).define("a4", ["Generators", "viewof a4"], (G, _) => G.input(_));
  main.variable(observer("slider")).define("slider", ["input"], function(input){return(
function slider(config = {}) {
  let {value, min = 0, max = 1, step = "any", precision = 2, title, description, format, submit} = config;
  if (typeof config == "number") value = config;
  if (value == null) value = (max + min) / 2;
  precision = Math.pow(10, precision);
  return input({
    type: "range", title, description, submit, format,
    attributes: {min, max, step, value},
    getValue: input => Math.round(input.valueAsNumber * precision) / precision
  });
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Buttons

\`import {button} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof b")).define("viewof b", ["button"], function(button){return(
button()
)});
  main.variable(observer("b")).define("b", ["Generators", "viewof b"], (G, _) => G.input(_));
  main.variable(observer()).define(["b"], function(b)
{
  b
  return !this;
}
);
  main.variable(observer("viewof b1")).define("viewof b1", ["button"], function(button){return(
button({value: "Click me", description: "We use a reference to the button below to record the time you pressed it."})
)});
  main.variable(observer("b1")).define("b1", ["Generators", "viewof b1"], (G, _) => G.input(_));
  main.variable(observer()).define(["b1"], function(b1)
{
  b1;
  return new Date(Date.now()).toUTCString()
}
);
  main.variable(observer("button")).define("button", ["input"], function(input){return(
function button(config = {}) {
  let {value, title, description, disabled} = config;
  if (typeof config == "string") value = config;
  if (!value) value = "Ok";
  const form = input({
    type: "button", title, description,
    attributes: {disabled, value}
  });
  form.output.remove();
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Dropdown Menus and Multiselects

\`import {select} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof dd")).define("viewof dd", ["select"], function(select){return(
select(["Spring", "Summer", "Fall", "Winter"])
)});
  main.variable(observer("dd")).define("dd", ["Generators", "viewof dd"], (G, _) => G.input(_));
  main.variable(observer()).define(["dd"], function(dd){return(
dd
)});
  main.variable(observer("viewof dd1")).define("viewof dd1", ["select"], function(select){return(
select({
  title: "Stooges",
  description: "Please pick your favorite stooge.",
  options: ["Curly", "Larry", "Moe", "Shemp"],
  value: "Moe"
})
)});
  main.variable(observer("dd1")).define("dd1", ["Generators", "viewof dd1"], (G, _) => G.input(_));
  main.variable(observer()).define(["dd1"], function(dd1){return(
dd1
)});
  main.variable(observer("viewof dd2")).define("viewof dd2", ["select"], function(select){return(
select({
  description: "As a child, which vegetables did you refuse to eat?",
  options: ["Spinach", "Broccoli", "Brussels Sprouts", "Cauliflower", "Kale", "Turnips", "Green Beans", "Asparagus"],
  multiple: true
})
)});
  main.variable(observer("dd2")).define("dd2", ["Generators", "viewof dd2"], (G, _) => G.input(_));
  main.variable(observer()).define(["dd2"], function(dd2){return(
dd2
)});
  main.variable(observer("select")).define("select", ["input","html"], function(input,html){return(
function select(config = {}) {
  let {value: formValue, title, description, submit, multiple, size, options} = config;
  if (Array.isArray(config)) options = config;
  options = options.map(o => typeof o === "string" ? {value: o, label: o} : o);
  const form = input({
    type: "select", title, description, submit, 
    getValue: input => {
      const selected = Array.prototype.filter.call(input.options, i => i.selected).map(i => i.value);
      return multiple ? selected : selected[0];
    },
    form: html`
      <form>
        <select name="input" ${multiple ? `multiple size="${size || options.length}"` : ""}>
          ${options.map(({value, label}) => `
            <option value="${value}" ${value === formValue ? "selected" : ""}>${label}</option>
          `)}
        </select>
      </form>
    `
  });
  form.output.remove();
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Color Pickers

*value: a hexadecimal string: * \`"#bada55"\` 

\`import {color} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof c")).define("viewof c", ["color"], function(color){return(
color()
)});
  main.variable(observer("c")).define("c", ["Generators", "viewof c"], (G, _) => G.input(_));
  main.variable(observer("viewof c1")).define("viewof c1", ["color"], function(color){return(
color({
  value: "#0000ff",
  title: "Background Color",
  description: "This color picker starts out blue"
})
)});
  main.variable(observer("c1")).define("c1", ["Generators", "viewof c1"], (G, _) => G.input(_));
  main.variable(observer("color")).define("color", ["input"], function(input){return(
function color(config = {}) {
  let {value, title, description, submit} = config;
  if (typeof config == "string") value = config;
  if (value == null) value = '#000000';
  const form = input({
    type: "color", title, description, submit,
    attributes: {value}
  });
  if (title || description) form.input.style.margin = "5px 0";
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md` ---
## Dates

*value: a YYYY-MM-DD formatted string: * \`"2016-11-08"\` 

\`import {date} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof d")).define("viewof d", ["date"], function(date){return(
date()
)});
  main.variable(observer("d")).define("d", ["Generators", "viewof d"], (G, _) => G.input(_));
  main.variable(observer("viewof d1")).define("viewof d1", ["date"], function(date){return(
date({
  title: "2017", 
  min: "2017-01-01",
  max: "2017-12-31",
  value: "2017-01-01",
  description: "Only dates within the 2017 calendar year are allowed"
})
)});
  main.variable(observer("d1")).define("d1", ["Generators", "viewof d1"], (G, _) => G.input(_));
  main.variable(observer("date")).define("date", ["input"], function(input){return(
function date(config = {}) {
  let {min, max, value, title, description} = config;
  if (typeof config == "string") value = config;
  return input({
    type: "date", title, description,
    attributes: {min, max, value}
  });
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## File Upload
*Use the JavaScript [File API](https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications) to work with uploaded file contents.*

\`import {file} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof e")).define("viewof e", ["file"], function(file){return(
file()
)});
  main.variable(observer("e")).define("e", ["Generators", "viewof e"], (G, _) => G.input(_));
  main.variable(observer("viewof e1")).define("viewof e1", ["file"], function(file){return(
file({
  title: "Photographs",
  description: "Only .jpg files are allowed in this example. Choose some images, and they’ll appear in the cell below.",
  accept: ".jpg",
  multiple: true,
})
)});
  main.variable(observer("e1")).define("e1", ["Generators", "viewof e1"], (G, _) => G.input(_));
  main.variable(observer()).define(["html","e1","Files"], async function(html,e1,Files)
{
  const div = html`<div>`;
  for (var j = 0; j < e1.length; j++) {
    let file = e1[j];
    let img = html`<img height="125px" />`
    img.src = await Files.url(e1[j]);
    div.append(img);
  }
  return div;
}
);
  main.variable(observer("file")).define("file", ["input"], function(input){return(
function file(config = {}) {
  let {multiple, accept, title, description} = config;
  const form = input({
    type: "file", title, description,
    attributes: {multiple, accept},
    action: form => {
      form.input.onchange = () => {
        form.value = multiple ? form.input.files : form.input.files[0];
        form.dispatchEvent(new CustomEvent("input"));
      };
    }
  });
  form.output.remove();
  form.input.onchange();
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Text Inputs

\`import {text} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof f")).define("viewof f", ["text"], function(text){return(
text()
)});
  main.variable(observer("f")).define("f", ["Generators", "viewof f"], (G, _) => G.input(_));
  main.variable(observer("viewof f1")).define("viewof f1", ["text"], function(text){return(
text({title: "A Text Input", placeholder: "Placeholder text", description: "Note that text inputs don’t show output on the right"})
)});
  main.variable(observer("f1")).define("f1", ["Generators", "viewof f1"], (G, _) => G.input(_));
  main.variable(observer()).define(["f1"], function(f1){return(
f1
)});
  main.variable(observer("viewof f2")).define("viewof f2", ["text"], function(text){return(
text({placeholder: "Placeholder text", description: "This input only changes value on submit", submit: "Go"})
)});
  main.variable(observer("f2")).define("f2", ["Generators", "viewof f2"], (G, _) => G.input(_));
  main.variable(observer()).define(["f2"], function(f2){return(
f2
)});
  main.variable(observer("text")).define("text", ["input"], function(input){return(
function text(config = {}) {
  const {value, title, description, autocomplete, maxlength, minlength, pattern, placeholder, size, submit} = config;
  if (typeof config == "string") value = config;
  const form = input({
    type: "text", title, description, submit,
    attributes: {value, autocomplete, maxlength, minlength, pattern, placeholder, size}
  });
  form.output.remove();
  form.input.style.fontSize = "1em";
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Textareas

\`import {textarea} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof g")).define("viewof g", ["textarea"], function(textarea){return(
textarea()
)});
  main.variable(observer("g")).define("g", ["Generators", "viewof g"], (G, _) => G.input(_));
  main.variable(observer()).define(["g"], function(g){return(
g
)});
  main.variable(observer("viewof g1")).define("viewof g1", ["textarea"], function(textarea){return(
textarea({title: "Your Great American Novel", placeholder: "Insert story here...", spellcheck: true, submit: "Publish"})
)});
  main.variable(observer("g1")).define("g1", ["Generators", "viewof g1"], (G, _) => G.input(_));
  main.variable(observer()).define(["g1"], function(g1){return(
g1
)});
  main.variable(observer("textarea")).define("textarea", ["input","html"], function(input,html){return(
function textarea(config = {}) {
  let {value, title, description, autocomplete, cols = 45, rows = 3, maxlength, placeholder, spellcheck, wrap, submit} = config;
  if (typeof config == "string") value = config;
  if (value == null) value = "";
  const form = input({
    form: html`<form><textarea style="display: block; font-size: 0.8em;" name=input>${value}</textarea></form>`, 
    title, description, submit,
    attributes: {autocomplete, cols, rows, maxlength, placeholder, spellcheck, wrap}
  });
  form.output.remove();
  if (submit) form.submit.style.margin = "0";
  if (title || description) form.input.style.margin = "3px 0";
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Radio Buttons

\`import {radio} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof r")).define("viewof r", ["radio"], function(radio){return(
radio(["Lust", "Gluttony", "Greed", "Sloth", "Wrath", "Envy", "Pride"])
)});
  main.variable(observer("r")).define("r", ["Generators", "viewof r"], (G, _) => G.input(_));
  main.variable(observer()).define(["r"], function(r){return(
r
)});
  main.variable(observer("viewof r1")).define("viewof r1", ["radio"], function(radio){return(
radio({
  title: 'Contact Us',
  description: 'Please select your preferred contact method',
  options: [
    { label: 'By Email', value: 'email' },
    { label: 'By Phone', value: 'phone' },
    { label: 'By Pager', value: 'pager' },
  ],
  value: 'pager'
})
)});
  main.variable(observer("r1")).define("r1", ["Generators", "viewof r1"], (G, _) => G.input(_));
  main.variable(observer()).define(["r1"], function(r1){return(
r1
)});
  main.variable(observer("radio")).define("radio", ["input","html"], function(input,html){return(
function radio(config = {}) {
  let {value: formValue, title, description, submit, options} = config;
  if (Array.isArray(config)) options = config;
  options = options.map(o => typeof o === "string" ? {value: o, label: o} : o);
  const form = input({
    type: "radio", title, description, submit, 
    getValue: input => {
      const checked = Array.prototype.find.call(input, radio => radio.checked);
      return checked ? checked.value : undefined;
    }, 
    form: html`
      <form>
        ${options.map(({value, label}) => `
          <label style="display: inline-block; margin: 5px 10px 3px 0; font-size: 0.85em;">
           <input type=radio name=input value="${value}" ${value === formValue ? 'checked' : ''} style="vertical-align: baseline;" />
           ${label}
          </label>
        `)}
      </form>
    `
  });
  form.output.remove();
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Checkboxes

\`import {checkbox} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof ch")).define("viewof ch", ["checkbox"], function(checkbox){return(
checkbox(["Lust", "Gluttony", "Greed", "Sloth", "Wrath", "Envy", "Pride"])
)});
  main.variable(observer("ch")).define("ch", ["Generators", "viewof ch"], (G, _) => G.input(_));
  main.variable(observer()).define(["ch"], function(ch){return(
ch
)});
  main.variable(observer("viewof ch1")).define("viewof ch1", ["checkbox"], function(checkbox){return(
checkbox({
  title: 'Colors',
  description: 'Please select your favorite colors',
  options: [
    { value: 'r', label: 'Red', color: "red"},
    { value: 'o', label: 'Orange', color: "orange" },
    { value: 'y', label: 'Yellow', color: "yellow" },
    { value: 'g', label: 'Green', color: "green" },
    { value: 'b', label: 'Blue', color: "blue" },
    { value: 'i', label: 'Indigo', color: "indigo" },
    { value: 'v', label: 'Violet', color: "violet" },
  ],
  value: ['r','g','b']
})
)});
  main.variable(observer("ch1")).define("ch1", ["Generators", "viewof ch1"], (G, _) => G.input(_));
  main.variable(observer()).define(["ch1"], function(ch1){return(
ch1
)});
  main.variable(observer("viewof ch3")).define("viewof ch3", ["checkbox"], function(checkbox){return(
checkbox({
  description: 'Just a single checkbox to toggle',
  options: [
    { value: 'toggle', label: 'On' }
  ],
  value: 'toggle'
})
)});
  main.variable(observer("ch3")).define("ch3", ["Generators", "viewof ch3"], (G, _) => G.input(_));
  main.variable(observer()).define(["ch3"], function(ch3){return(
ch3
)});
  main.variable(observer("checkbox")).define("checkbox", ["input","html"], function(input,html){return(
function checkbox(config = {}) {
  let {value: formValue, title, description, submit, options} = config;
  if (Array.isArray(config)) options = config;
  
  let default_options = {color: "black"};
  options = options
    // Accept stringy options, in which case set both label and value to the string.
    .map(o => typeof o === "string" ? {value: o, label: o} : o)
    // To the exapnded options, add the defaults.
    .map(o => Object.assign({}, default_options, o));
    
  const form = input({
    type: "checkbox", title, description, submit, 
    getValue: input => {
      if (input.length) return Array.prototype.filter.call(input, i => i.checked).map(i => i.value);
      return input.checked ? input.value : undefined;
    }, 
    form: html`
      <form>
        ${options.map(({value, label, color}) => `
          <label style="display: inline-block; margin: 5px 10px 3px 0; font-size: 0.85em; color: ${color};">
           <input type=checkbox name=input value="${value || "on"}" ${(formValue || []).indexOf(value) > -1 ? 'checked' : ''} style="vertical-align: baseline;" />
           ${label}
          </label>
        `)}
      </form>
    `
  });
  form.output.remove();
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Numbers

\`import {number} from "@jashkenas/inputs"\``
)});
  main.variable(observer("viewof h")).define("viewof h", ["number"], function(number){return(
number()
)});
  main.variable(observer("h")).define("h", ["Generators", "viewof h"], (G, _) => G.input(_));
  main.variable(observer()).define(["h"], function(h){return(
h
)});
  main.variable(observer("viewof h1")).define("viewof h1", ["number"], function(number){return(
number({placeholder: "13+", title: "Your Age", submit: true})
)});
  main.variable(observer("h1")).define("h1", ["Generators", "viewof h1"], (G, _) => G.input(_));
  main.variable(observer()).define(["h1"], function(h1){return(
h1
)});
  main.variable(observer("number")).define("number", ["input"], function(input){return(
function number(config = {}) {
  const {value, title, description, placeholder, submit, step, min, max} = config;
  if (typeof config == "number") value = config;
  const form = input({
    type: "number", title, description, submit,
    attributes: {value, placeholder, step, min, max},
    getValue: (input) => input.valueAsNumber
  });
  form.output.remove();
  form.input.style.width = "auto";
  form.input.style.fontSize = "1em";
  return form;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## TK (Patches welcome!)

* 2D coordinate input (using a &lt;canvas>)
* 3D coordinate input (for say, positioning a camera in a WebGL sketch)
* Degrees or radians input, for circular things.`
)});
  main.variable(observer("input")).define("input", ["html","d3format"], function(html,d3format){return(
function input(config) {
  let {form, type = "text", attributes = {}, action, getValue, title, description, format, submit, options} = config;
  if (!form) form = html`<form>
	<input name=input type=${type} />
  </form>`;
  const input = form.input;
  Object.keys(attributes).forEach(key => {
    const val = attributes[key];
    if (val != null) input.setAttribute(key, val);
  });
  if (submit) form.append(html`<input name=submit type=submit style="margin: 0 0.75em" value="${typeof submit == 'string' ? submit : 'Submit'}" />`);
  form.append(html`<output name=output style="font: 14px Menlo, Consolas, monospace; margin-left: 0.5em;"></output>`);
  if (title) form.prepend(html`<div style="font: 700 0.9rem sans-serif;">${title}</div>`);
  if (description) form.append(html`<div style="font-size: 0.85rem; font-style: italic;">${description}</div>`);
  if (format) format = d3format.format(format);
  if (action) {
    action(form);
  } else {
    const verb = submit ? "onsubmit" : type == "button" ? "onclick" : type == "checkbox" || type == "radio" ? "onchange" : "oninput";
    form[verb] = (e) => {
      e && e.preventDefault();
      const value = getValue ? getValue(input) : input.value;
      if (form.output) form.output.value = format ? format(value) : value;
      form.value = value;
      if (verb !== "oninput") form.dispatchEvent(new CustomEvent("input"));
    };
    if (verb !== "oninput") input.oninput = e => e && e.stopPropagation() && e.preventDefault();
    if (verb !== "onsubmit") form.onsubmit = (e) => e && e.preventDefault();
    form[verb]();
  }
  return form;
}
)});
  main.variable(observer("d3format")).define("d3format", ["require"], function(require){return(
require("d3-format")
)});
  main.variable(observer()).define(["md"], function(md){return(
md`*Clip art courtesy [ClipArt ETC](https://etc.usf.edu/clipart/), radio buttons and checkboxes courtesy [Amit Sch](https://beta.observablehq.com/@meetamit/multiple-choice-inputs).*`
)});
  return main;
}
