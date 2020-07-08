// https://observablehq.com/@spatac/cell-settling@3380
import define1 from "./1455ca0594a10c61@1521.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Cell Settling

We simulate mono-layer cell behaviour when pressure is uniformly applied.

Initially the cells are randomly placed in the environment using a Voronoi 
tesselation. Membrane behaviour uses a hybrid model between vertex and 
deformable polygons [&lbrack;1&rbrack;][1], [&lbrack;2&rbrack;][2]. The 
simulation begins with a relaxation phase allowing the cells to obtain 
their desired shape. We then apply pressure uniformly, polarizing the 
cells in a randomly generated direction, and forcing them to expand 
in the planar section due to orthogonal compression. The simulation 
continues looping between relaxation and pressure phases.

Although pressure is applied uniformly the cells form contracting and expanding groups due to the
arbitrary alignment of cell polarization; and the groups migrate around the environment.

#### Authors
[Calin Mocanu][calin], [Dung Nguyen][dung], [Catalina Spatarelu][cata]

[calin]: mailto:calin.mocanu+cellsettling@gmail.com
[dung]: mailto:dung.t.nguyen0728@gmail.com
[cata]: mailto:catalina-paula.spatarelu.th@dartmouth.edu

[1]: https://journals.aps.org/prx/abstract/10.1103/PhysRevX.6.021011
[2]: https://arxiv.org/abs/1801.06150
`
)});
  main.variable(observer()).define(["d3","DOM","setup_display","env_size","radio","slider","equilibrium_area","polarization_factor","run_loop","init_physics","polarized_initial_cells","visibility","periodic_boundaries","lennard_jones_max_distance","paint_cells","paint_actins","paint_polarization","paint_details","apply_membrane_forces","apply_membrane_stiffness","apply_nucleus_forces","apply_intercell_forces","advance_physics","tick_duration","invalidation","record_canvas"], function(d3,DOM,setup_display,env_size,radio,slider,equilibrium_area,polarization_factor,run_loop,init_physics,polarized_initial_cells,visibility,periodic_boundaries,lennard_jones_max_distance,paint_cells,paint_actins,paint_polarization,paint_details,apply_membrane_forces,apply_membrane_stiffness,apply_nucleus_forces,apply_intercell_forces,advance_physics,tick_duration,invalidation,record_canvas)
{
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  let canvas = div.append(() => display.canvas);
  
  // User interface
  // ==============
  
  const button_style = "margin: 0 0.75em 0 0;";
  const info_style = "font-size: 0.85rem; font-style: italic;";
        
  // Easy Mode Control
  // -----------------
  
  let mode_radio = div.append(() => radio({
    title: "Simulation Modes",
    description: "Example running states. Set to manual to control pressure and polarization using the sliders below.",
    options: [
      {label: "Manual", value: "manual"},
      {label: "Relax", value: "relax"},
      {label: "Pressure", value: "press"},
      {label: "Relax & Pressure Loop", value: "loop"},
    ],
    value: "loop"
  }));
  
  function select_radio_value(radio, value) {
    radio.selectAll("input").each(function(){
      let self = d3.select(this);
      if (self.attr("value") === value) self.property("checked", true);
    });
    radio.node().onchange();
  }
  
  
  // Equilibrium Area
  // ----------------
  
  let compressed = 3.0;
  let uncompressed = 1.1;
  
  let compression_slider = div.append(() => slider({
    min: 0.5,
    max: 4.0,
    value: uncompressed,
    precision: 1,
    title: "Compression Factor",
    description: "How much we compress the cells height wise (thus increasing their desired area).",
  }));
  
  let sim_equilibrium_area;
  let compression;
  function set_compression() {
    compression = compression_slider.node().value
    sim_equilibrium_area = compression * equilibrium_area;
  }
  set_compression();
  
  compression_slider.on("input", set_compression);
  
  // Polarization
  // ------------
  let polarized = polarization_factor;
  let unpolarized = 0.0;
  
  let polarization_slider = div.append(() => slider({
    min: 0.0,
    max: 1.0,
    value: unpolarized,
    precision: 1,
    title: "Polarization Factor",
    description: "How strongly the osmosis pressure is polarized.",
  }));
  
  let sim_polarization_factor;
  function set_polarization() {
    sim_polarization_factor = polarization_slider.node().value;
  }
  set_polarization();
  
  polarization_slider.on("input", set_polarization);
  
  
  // Manual control
  // --------------
  
  function enable_sliders(enable=true) {
    compression_slider.selectAll("input").property("disabled", !enable);
    polarization_slider.selectAll("input").property("disabled", !enable);
    
    compression_slider.style("color", enable ? null : "lightgray");
    polarization_slider.style("color", enable ? null : "lightgray");
  }
  
  enable_sliders(false);
  
  function set_slider_value(slider, value) {
    slider.node().input.value = value;
    slider.node().oninput();
    slider.node().dispatchEvent(new CustomEvent("input"));
  }

  function set_pressured() {
    set_slider_value(polarization_slider, polarized);
    set_slider_value(compression_slider, compressed);
  }
  
  function set_relaxed() {
    set_slider_value(polarization_slider, unpolarized);
    set_slider_value(compression_slider, uncompressed);
  }
  
  // Reset Button
  // ------------
  let reset_form = div.append("form");
  let reset_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Restart");
  let reset_to_loop_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Reset & Loop");
  let reset_record_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Restart & Record");
  let reset_zoom_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Reset Zoom");
  reset_form.append("div")
    .attr("style", info_style)
    .text("Restart the simulation; or reset to initial loop.");
  
  // Video Recording
  // ---------------
  
  let record_text = "Save the simulation to video.";
  let record_default_filename = "cell-simulation";
  
  let record_form = div.append("form");
  let record_button = record_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Record");
  let record_save = record_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Stop & Save")
    .property("disabled", true);
  record_form.append("span").attr("style", info_style).text("Save as:");
  let record_filename = record_form.append("input")
    .attr("type", "text")
    .attr("placeholder", "Recording filename")
    .attr("value", record_default_filename);
  let record_info = record_form.append("div")
    .attr("style", info_style)
    .text(record_text);
  
  
  record_save.on("click", complete_recording);
  
  
  let recorder = null;
  
  function reset_recorder() {
    record_info.text(record_text).style("color", null).style("font-weight", "normal");
    if (recorder !==  null) recorder.discard();
    recorder = null;
    record_save.property("disabled", true);
  }
  
  function recorder_error(error) {
    record_info.text(error).style("color", "red").style("font-weight", "bold");
    recorder = null;
  }
  
  function complete_recording() {
    let typed_name = record_filename.node().value;
    let name = (typed_name && typed_name.length > 0) ? typed_name : record_default_filename;
    recorder.complete(name);
    reset_recorder();
  }
  
  // Zoomies
  // -------

  let transform;
  
  let zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", () => {transform = d3.event.transform;});
  
  canvas.call(zoom).call(zoom.transform, d3.zoomIdentity);
  
  
  // Simulation Loop
  // ---------------
  
  let loop = run_loop({
    
    setup: function () {
      // Initialize physics for all cells.
      let cells = init_physics(polarized_initial_cells);
      let time = 0.0;
      
      // Start in relax mode.
      let phase = "relax";
      
      return {cells, time, phase};
    },
    
    update: async function({cells, time, phase}, {fps}) {
      // Only update while the cell is visible or recording.   
      if (recorder === null) await visibility();
      
      // Get all current cells + cell images on the boundaries; we shouldn't apply any
      // forces on these cells though. We can show them on screen though.
      let all_cells = periodic_boundaries(cells, lennard_jones_max_distance);
      
      
      // Display
      // -------
      
      let {context, canvas} = display;

      // Apply zoomies.
      context.save();
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      // Paint cells.
      paint_cells(all_cells, display);
      paint_actins(cells, 7, display);
      paint_polarization(cells, sim_polarization_factor, display);

      // Reset to no zoom.
      context.restore();

      // Paint info.
      paint_details({time, fps, compression, polarization: sim_polarization_factor, transform}, display);

      
      // Maybe record frame.
      if (recorder !== null) recorder.save_frame();
      
      
      // Physics
      // -------
      
      // Compute physics for next tick.
      apply_membrane_forces(
        cells, 
        {
          equilibrium_area: sim_equilibrium_area, 
          polarization_factor: sim_polarization_factor,
        });
      
      apply_membrane_stiffness(cells);
      apply_nucleus_forces(cells);
      apply_intercell_forces(cells, all_cells);
      advance_physics(cells, tick_duration);
      time += tick_duration;
      
      
      // Phase Progress
      // --------------
      
      if (phase === "relax" && time > 60) {
        phase = "press";
        time = 0.0;
        set_pressured();
      }
      if (phase === "press" && time > 120) {
        phase = "relax";
        time = 0;
        set_relaxed();
        if (recorder !== null) complete_recording();
      }
      
      // Return the new state.
      return {cells, time, phase};
    },
  });
  
  // Loop Control
  // ------------
  
  invalidation.then(() => {
    loop.stop();
    if (recorder !== null) reset_recorder();
  });
  
  function set_mode() {
    let mode = mode_radio.node().value;
    
    // Enable sliders if we switched to manual.
    enable_sliders(mode === "manual");
    
    // Start looping in relax phase; or stop looping if a different mode.
    if (mode === "loop") {
      loop.set(state => { state.phase = "relax"; state.time = 0.0; return state; });
      set_relaxed();
    } else {
      loop.set(state => { state.phase = null; return state; });
    }
    
    if (mode === "press") set_pressured();
    if (mode === "relax") set_relaxed();
    
    // Cross fingers.
  }
  
  mode_radio.on("input", set_mode);

  function start_recording() {
    record_save.property("disabled", false);
    
    recorder = record_canvas(display.canvas, recorder_error);
    
    if (recorder) {
      recorder.start();
      record_info.text("Recording...").style("color", null).style("font-weight", "bold");
    }
    
    // Reset simulation time to 0.
    loop.set(state => { state.time = 0.0; return state;});
  }
  
  function reset_zoom() {
    canvas.call(zoom.transform, d3.zoomIdentity);
  }
  
  function reset() {
    // Reset the state.
    loop.reset();
    
    // Stop recorder.
    if (recorder !== null) reset_recorder();
    
    // Need to reset the mode too.
    set_mode();
    
    reset_zoom();
  }
  
  reset_button.on("click", reset);
  reset_to_loop_button.on("click", () => {
    select_radio_value(mode_radio, "loop");
    reset();
  });
  reset_record_button.on("click", () => {
    reset();
    start_recording();
  });
  reset_zoom_button.on("click", reset_zoom);
  
  record_button.on("click", start_recording);
  
  return div.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`## Simulation Setup

In this section we describe how we set up the cell environment: 
* the amount and placement of cells
* typical distance between cells
* cell membrane approximation
* forces within the cell membrane
* nucleus-membrane connections
* intercellular forces
* polarization
* environment boundaries
`
)});
  main.variable(observer()).define(["md","tex","n_cells","pretty_float","env_size"], function(md,tex,n_cells,pretty_float,env_size){return(
md`### Cell Placement

Define the centers of ${tex`n = ${n_cells}`} cells randomly placed in our simulation environment of size ${pretty_float(env_size.width)}μm by ${pretty_float(env_size.height)}μm. We then compute the Vornoi diagram for the set of cells. The result is ${n_cells} polygons where the points within each polygon's area are closest to their respective cell center.`
)});
  main.variable(observer("viewof n_cells")).define("viewof n_cells", ["slider"], function(slider){return(
slider({
  min: 3,
  max: 200,
  value: 50,
  step: 1,
  title: "Number of Cells",
  description: "The number of cells to simulate.",
})
)});
  main.variable(observer("n_cells")).define("n_cells", ["Generators", "viewof n_cells"], (G, _) => G.input(_));
  main.variable(observer("viewof generate_cells")).define("viewof generate_cells", ["button"], function(button){return(
button({value: "Regenerate cells", description: "Compute a new set of random cell centers."})
)});
  main.variable(observer("generate_cells")).define("generate_cells", ["Generators", "viewof generate_cells"], (G, _) => G.input(_));
  main.variable(observer()).define(["paint_cells","init_physics","initial_cell_polygons","env_size"], function(paint_cells,init_physics,initial_cell_polygons,env_size){return(
paint_cells(init_physics(initial_cell_polygons), env_size)
)});
  main.variable(observer()).define(["md","shrink_distance","tex"], function(md,shrink_distance,tex){return(
md`### Cell Separation

We separate the polygons by bringing each edge closer to the center of its cell by ${shrink_distance}μm. Note that the separation between cells is ${tex`2 \times d = ${2*shrink_distance}μm`}.`
)});
  main.variable(observer("viewof shrink_distance")).define("viewof shrink_distance", ["slider","lennard_jones_distance","min_nucleus_separation"], function(slider,lennard_jones_distance,min_nucleus_separation){return(
slider({
  min: lennard_jones_distance / 2.5,
  max: min_nucleus_separation / 2.0,
  value: lennard_jones_distance / 2.0,
  precision: 1,
  title: "Cell Shrinking",
  description: "How much to shrink each cell from its initial Voronoi tesselation.",
})
)});
  main.variable(observer("shrink_distance")).define("shrink_distance", ["Generators", "viewof shrink_distance"], (G, _) => G.input(_));
  main.variable(observer()).define(["paint_cells","init_physics","shrunk_cell_polygons","env_size"], function(paint_cells,init_physics,shrunk_cell_polygons,env_size){return(
paint_cells(init_physics(shrunk_cell_polygons), env_size)
)});
  main.variable(observer()).define(["md","n_points"], function(md,n_points){return(
md`### Membrane Approximation

To simulate the membrane of each cell we place ${n_points} points around the cell perimeter. We will simulate the forces on these points to approximate real behaviour.`
)});
  main.variable(observer("viewof n_points")).define("viewof n_points", ["slider"], function(slider){return(
slider({
  min: 4,
  max: 40,
  value: 20,
  step: 1,
  title: "Points on Membrane",
  description: "How many points to use to approximate the cell membrane.",
})
)});
  main.variable(observer("n_points")).define("n_points", ["Generators", "viewof n_points"], (G, _) => G.input(_));
  main.variable(observer()).define(["paint_cells","init_physics","initial_cells","env_size"], function(paint_cells,init_physics,initial_cells,env_size){return(
paint_cells(init_physics(initial_cells), env_size)
)});
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`### Cell Membrane Behaviour

Between each neighbouring cell membrane points ${tex`i, j`} at positions ${tex`r_i, r_j`}, with distance between them ${tex`l_{ij}`}, separating at speed ${tex`\frac{dl_{ij}}{dt} = v_{ij}`} we apply the following forces to approximate membrane behaviour:

1. Elastic force ${tex`F^e_{i,j} = -k_e (l_{ij} - l_0) u_{ij}`}; where ${tex`l_0`} is the equilibrium separation distance and ${tex`u_{ij} = \frac{r_j - r_i}{l_{ij}}`} is the unit vector.

2. Damping force ${tex`F^d_{i,j} = -\gamma v_{ij}`}.

3. Osmosis pressure force ${tex`F^a_{i,j,k} = k_a (a_m - a_0) * n_{ik}`}; where ${tex`a_m`} is the current cell area, ${tex`a_0`} is the equilibrium area and we use the convention that ${tex`n_{ik}`} is the unit surface normal pointing towards the center of the cell.

The parameters affecting the forces are:
1. Elastic constant ${tex`k_e`}.
2. Damping constant ${tex`\gamma`}.
3. Pressure constant ${tex`k_a`}.
`
)});
  main.variable(observer()).define(["perimeter_points","n_points","d3","DOM","setup_display","checkbox","forces_options","run_loop","init_physics","visibility","center_of_mass_nucleus","apply_membrane_forces","paint_cells","paint_forces","paint_details","advance_physics","tick_duration","clear_forces","invalidation"], function(perimeter_points,n_points,d3,DOM,setup_display,checkbox,forces_options,run_loop,init_physics,visibility,center_of_mass_nucleus,apply_membrane_forces,paint_cells,paint_forces,paint_details,advance_physics,tick_duration,clear_forces,invalidation)
{
  const env_size = {width: 40.0, height: 20.0};
  let example_cell = [
    [ 7.0,  7.0],
    [ 7.0, 13.0],
    [13.0, 13.0],
    [13.0,  7.0],
  ];
  example_cell.data = [10.0, 10.0];
  example_cell = perimeter_points(example_cell, n_points)
  
  // Setup display.
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  div.append(() => display.canvas);
  
  
  let membrane_forces_to_display = checkbox({
    title: "Membrane Forces",
    description: "The checked forces will be shown on the simulation.",
    options: [
      {value: "elastic", label: "Elastic Force", color: forces_options["elastic"].color},
      {value: "damping", label: "Damping Force", color: forces_options["damping"].color},
      {value: "osmosis", label: "Osmosis Pressure", color: forces_options["osmosis"].color},
    ],
    value: ["osmosis"],
  });
  
  div.append(() => membrane_forces_to_display);
  

  // Simulation loop.
  let loop = run_loop({
    
    setup: function () {

      let cells = init_physics([example_cell]);

      let time = 0.0;
      
      return {cells, time};
    },
    
    update: async function({cells, time}, {fps}) {
      await visibility();
      
      center_of_mass_nucleus(cells);
      
      apply_membrane_forces(cells, {store_forces: true});
      
      // Display the cells and current time/fps.
      paint_cells(cells, display);
      paint_forces(cells, membrane_forces_to_display.value, display);
      paint_details({time, fps}, display);
      
      
      // Compute physics for next tick.
      advance_physics(cells, tick_duration);
      time += tick_duration;
      clear_forces(cells);
      
      // Return the new state.
      if (time > 30) return loop.reset();
      return {cells, time};
    },
  });
  
  invalidation.then(loop.stop);
  
  return div.node();
}
);
  main.variable(observer("viewof elastic_constant")).define("viewof elastic_constant", ["slider"], function(slider)
{
  const value = 2.5e-1;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 2,
    title: "Elastic Constant",
    description: "How strongly points on the membrane attract/repel each other.",
  });
}
);
  main.variable(observer("elastic_constant")).define("elastic_constant", ["Generators", "viewof elastic_constant"], (G, _) => G.input(_));
  main.variable(observer("viewof damping_constant")).define("viewof damping_constant", ["slider"], function(slider)
{
  const value = 5e-0;
  
  return slider({
    min: value * 0.2,
    max: value * 2.0,
    value: value,
    step: value * 0.2,
    precision: 1,
    title: "Damping Constant",
    description: "Control dampening of relative movement between membrane points.",
  });
}
);
  main.variable(observer("damping_constant")).define("damping_constant", ["Generators", "viewof damping_constant"], (G, _) => G.input(_));
  main.variable(observer("viewof osmosis_constant")).define("viewof osmosis_constant", ["slider"], function(slider)
{
  const value = 1.0e-3;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 4,
    title: "Osmosis Constant",
    description: "How quickly the membrane reaches its desired area.",
  });
}
);
  main.variable(observer("osmosis_constant")).define("osmosis_constant", ["Generators", "viewof osmosis_constant"], (G, _) => G.input(_));
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`#### Membrane Stiffness



4. Stiffness force ${tex`F^s_{jk} = - \theta_{i,j,k} * k_s / l_{jk}`}; where ${tex`\theta_{i,j,k}`} is the angle between the segment ${tex`\overline{jk}`} and ${tex`\overline{ij}`}.

*The figure below compares the behaviour of a deformed cell with (left) and without (right) membrane stiffness.*
`
)});
  main.variable(observer()).define(["perimeter_points","n_points","d3","DOM","setup_display","checkbox","forces_options","run_loop","init_physics","visibility","center_of_mass_nucleus","apply_membrane_forces","apply_membrane_stiffness","paint_cells","paint_forces","paint_details","advance_physics","tick_duration","clear_forces","invalidation"], function(perimeter_points,n_points,d3,DOM,setup_display,checkbox,forces_options,run_loop,init_physics,visibility,center_of_mass_nucleus,apply_membrane_forces,apply_membrane_stiffness,paint_cells,paint_forces,paint_details,advance_physics,tick_duration,clear_forces,invalidation)
{
  const env_size = {width: 40.0, height: 20.0};
  let example_cell = [
    [ 7.0,  5.0],
    [ 7.0, 15.0],
    [ 9.0, 15.0],
    [ 8.0, 10.0],
    [11.0, 15.0],
    [13.0, 15.0],
    [13.0,  5.0],
  ];
  example_cell.data = [10.0, 10.0];
  example_cell = perimeter_points(example_cell, n_points);
  
  let reference_offset = 20;
  let example_cell_reference = Array.from(example_cell, p => [p[0] + reference_offset, p[1]]);
  example_cell_reference.data = [example_cell.data[0] + reference_offset, example_cell.data[1]];
  
  // Setup display.
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  div.append(() => display.canvas);
  
  
  let membrane_forces_to_display = checkbox({
    title: "Membrane Forces",
    description: "The checked forces will be shown on the simulation.",
    options: [
      {value: "elastic", label: "Elastic Force", color: forces_options["elastic"].color},
      {value: "damping", label: "Damping Force", color: forces_options["damping"].color},
      {value: "osmosis", label: "Osmosis Pressure", color: forces_options["osmosis"].color},
      {value: "stiffness", label: "Stiffness", color: forces_options["stiffness"].color},
    ],
    value: ["stiffness"],
  });
  
  div.append(() => membrane_forces_to_display);
  

  // Simulation loop.
  let loop = run_loop({
    
    setup: function () {

      let cells = init_physics([example_cell, example_cell_reference]);

      let time = 0.0;
      
      return {cells, time};
    },
    
    update: async function({cells, time}, {fps}) {
      await visibility();
      
      center_of_mass_nucleus(cells);
      
      apply_membrane_forces(cells, {store_forces: true});
      apply_membrane_stiffness([cells[0]], {store_forces: true});
      
      // Display the cells and current time/fps.
      paint_cells(cells, display);
      paint_forces(cells, membrane_forces_to_display.value, display);
      paint_details({time, fps}, display);
      
      
      // Compute physics for next tick.
      advance_physics(cells, tick_duration);
      time += tick_duration;
      clear_forces(cells);
      
      // Return the new state.
      if (time > 30) return loop.reset();
      return {cells, time};
    },
  });
  
  invalidation.then(loop.stop);
  
  return div.node();
}
);
  main.variable(observer("viewof stiffness_constant")).define("viewof stiffness_constant", ["slider"], function(slider)
{
  const value = 2.0e-2;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 3,
    title: "Stiffness Constant",
    description: "How quickly segments align.",
  });
}
);
  main.variable(observer("stiffness_constant")).define("stiffness_constant", ["Generators", "viewof stiffness_constant"], (G, _) => G.input(_));
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`### Nucleus-Membrane Interaction

We apply the damped-elastic force between the nucleus and every point of the membrane as well.

Similar to the membrane forces, but using different coefficients:
1. Elastic constant ${tex`k_{en}`}.
2. Damping constant ${tex`\gamma_n`}.

*Note, the figure below omits the osmosis force.*
`
)});
  main.variable(observer()).define(["perimeter_points","n_points","d3","DOM","setup_display","checkbox","forces_options","run_loop","init_physics","visibility","apply_membrane_forces","apply_nucleus_forces","paint_cells","paint_actins","paint_forces","paint_details","advance_physics","tick_duration","clear_forces","invalidation"], function(perimeter_points,n_points,d3,DOM,setup_display,checkbox,forces_options,run_loop,init_physics,visibility,apply_membrane_forces,apply_nucleus_forces,paint_cells,paint_actins,paint_forces,paint_details,advance_physics,tick_duration,clear_forces,invalidation)
{
  const env_size = {width: 40.0, height: 20.0};
  let example_cell = [
    [ 7.0,  7.0],
    [ 7.0, 13.0],
    [13.0, 13.0],
    [13.0,  7.0],
  ];
  example_cell.data = [10.0, 10.0];
  example_cell = perimeter_points(example_cell, n_points)
  
  // Setup display.
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  div.append(() => display.canvas);
  
  
  let membrane_forces_to_display = checkbox({
    title: "Nucleus & Membrane Forces",
    description: "The checked forces will be shown on the simulation.",
    options: [
      {value: "elastic", label: "Elastic Force", color: forces_options["elastic"].color},
      {value: "damping", label: "Damping Force", color: forces_options["damping"].color},
      {value: "elastic-actin", label: "Elastic-Actin Force", color: forces_options["elastic-actin"].color},
      {value: "damping-actin", label: "Damping-Actin Force", color: forces_options["damping-actin"].color},
    ],
    value: ["elastic-actin"],
  });
  
  div.append(() => membrane_forces_to_display);
  

  // Simulation loop.
  let loop = run_loop({
    
    setup: function () {

      let cells = init_physics([example_cell]);

      let time = 0.0;
      
      return {cells, time};
    },
    
    update: async function({cells, time}, {fps}) {
      await visibility();
      
      apply_membrane_forces(cells, {store_forces: true, osmosis_constant: 0.0});
      apply_nucleus_forces(cells, {store_forces: true});
      
      // Display the cells and current time/fps.
      paint_cells(cells, display);
      paint_actins(cells, n_points, display);
      paint_forces(cells, membrane_forces_to_display.value, display);
      paint_details({time, fps}, display);
      
      
      // Compute physics for next tick.
      advance_physics(cells, tick_duration);
      time += tick_duration;
      clear_forces(cells);
      
      // Return the new state.
      if (time > 30) return loop.reset();
      return {cells, time};
    },
  });
  
  invalidation.then(loop.stop);
  
  return div.node();
}
);
  main.variable(observer("viewof nucleus_elastic_constant")).define("viewof nucleus_elastic_constant", ["slider"], function(slider)
{
  const value = 2.5e-2;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 4,
    title: "Nucleus Elastic Constant",
    description: "How strongly points on the membrane attract/repel the nucleus.",
  });
}
);
  main.variable(observer("nucleus_elastic_constant")).define("nucleus_elastic_constant", ["Generators", "viewof nucleus_elastic_constant"], (G, _) => G.input(_));
  main.variable(observer("viewof nucleus_damping_constant")).define("viewof nucleus_damping_constant", ["slider"], function(slider)
{
  const value = 5e-1;
  
  return slider({
    min: value * 0.2,
    max: value * 2.0,
    value: value,
    step: value * 0.2,
    precision: 3,
    title: "Nucleus Damping Constant",
    description: "Control dampening of relative movement between membrane and nucleus.",
  });
}
);
  main.variable(observer("nucleus_damping_constant")).define("nucleus_damping_constant", ["Generators", "viewof nucleus_damping_constant"], (G, _) => G.input(_));
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`### Cell Interactions

The membrane of different cells interact via the [Lennard-Jones potential](https://en.wikipedia.org/wiki/Lennard-Jones_potential): ${tex`k_{LJ}((\frac{r_0}{r})^{12} - 2(\frac{r_0}{r})^6) \frac{1}{r^2}`}; where ${tex`r`} is the
distance from a membrane point to one on another cell, ${tex`r_0`} and ${tex`k_{LJ}`} are constants, and the term ${tex`\frac{1}{r^2}`} turns the potential into a force.`
)});
  main.variable(observer()).define(["circle_poly","n_points","d3","DOM","setup_display","checkbox","forces_options","run_loop","init_physics","visibility","apply_membrane_forces","apply_nucleus_forces","apply_intercell_forces","paint_cells","paint_actins","paint_forces","paint_details","advance_physics","tick_duration","clear_forces","invalidation"], function(circle_poly,n_points,d3,DOM,setup_display,checkbox,forces_options,run_loop,init_physics,visibility,apply_membrane_forces,apply_nucleus_forces,apply_intercell_forces,paint_cells,paint_actins,paint_forces,paint_details,advance_physics,tick_duration,clear_forces,invalidation)
{
  const env_size = {width: 40.0, height: 20.0};
  const example_cells = [
    circle_poly([ 8.0, 10.0], 3.7, n_points),
    circle_poly([16.0, 10.0], 3.7, n_points),
    circle_poly([24.0, 10.0], 3.7, n_points),
    circle_poly([32.0, 10.0], 3.7, n_points),
  ];

  
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  div.append(() => display.canvas);
  
  let membrane_forces_to_display = checkbox({
    title: "Forces",
    description: "The checked forces will be shown on the simulation.",
    options: [
      {value: "lennard-jones", label: "Lennard-Jones Potential", color: forces_options["lennard-jones"].color},
      {value: "elastic", label: "Elastic Force", color: forces_options["elastic"].color},
      {value: "damping", label: "Damping Force", color: forces_options["damping"].color},
      {value: "elastic-actin", label: "Elastic-Actin Force", color: forces_options["elastic-actin"].color},
      {value: "damping-actin", label: "Damping-Actin Force", color: forces_options["damping-actin"].color},
      {value: "osmosis", label: "Osmosis Pressure", color: forces_options["osmosis"].color},
    ],
    value: ["lennard-jones"],
  });
  
  div.append(() => membrane_forces_to_display);
  
  
  
  let loop = run_loop({
    
    setup: function () {

      let cells = init_physics(example_cells);
      
      let time = 0.0;
      
      return {cells, time};
    },
    update: async function({cells, time}, {fps}) {

      await visibility();
      
      apply_membrane_forces(cells, {store_forces: true});
      
      apply_nucleus_forces(cells, {store_forces: true});
      
      apply_intercell_forces(cells, cells, {store_forces: true});

      // Display.
      paint_cells(cells, display);
      paint_actins(cells, 7, display);
      paint_forces(cells, membrane_forces_to_display.value, display);
      paint_details({time, fps}, display);
      
      // Advance physics a tick.
      advance_physics(cells, tick_duration);
      time += tick_duration;
      clear_forces(cells);
      
      
      // Return the new state.
      if (time > 20) return loop.reset();
      return {cells, time};
    },
  });

  invalidation.then(loop.stop);
  
  return div.node();
}
);
  main.variable(observer("viewof lenard_jones_strength")).define("viewof lenard_jones_strength", ["lennard_jones_distance","slider"], function(lennard_jones_distance,slider)
{
  const value = 5.0e-2 * lennard_jones_distance**2;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 4,
    title: "Lennard Jones Coefficient",
    description: "How strongly different membranes repel each other.",
  });
}
);
  main.variable(observer("lenard_jones_strength")).define("lenard_jones_strength", ["Generators", "viewof lenard_jones_strength"], (G, _) => G.input(_));
  main.variable(observer("viewof lennard_jones_distance")).define("viewof lennard_jones_distance", ["slider"], function(slider)
{
  const value = 1.0;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 1,
    title: "Lennard Jones Distance",
    description: "Roughly the distance at which the membranes repel.",
  });
}
);
  main.variable(observer("lennard_jones_distance")).define("lennard_jones_distance", ["Generators", "viewof lennard_jones_distance"], (G, _) => G.input(_));
  main.variable(observer("lennard_jones_min_distance")).define("lennard_jones_min_distance", ["lennard_jones_distance"], function(lennard_jones_distance){return(
lennard_jones_distance * 0.4
)});
  main.variable(observer("lennard_jones_max_distance")).define("lennard_jones_max_distance", ["lennard_jones_distance"], function(lennard_jones_distance){return(
lennard_jones_distance * 1.3
)});
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`### Membrane Polarization

To simulate polarization we increase the activity of the surface of the cell on one side and decrease it on the other. The osmosis force is modified by a polarization factor as in the equation below:

${tex`F^a_{i,j,k} = k_a (a_m - a_0) * n_{ik} * (1 - p (n_{ik} \cdot n_p))`}; where ${tex`n_p`} is the polarization direction and ${tex`p`} is the polarization factor.

The minus sign is due to our convention that ${tex`n_{ik}`} is the unit surface normal pointing **towards** the center of the cell. If we define ${tex`\theta_n`} as the angle to the polarization direction, then a clearer way to phrase the polarization term would be: ${tex`1 + p \cos \theta_n`}.
`
)});
  main.variable(observer()).define(["circle_poly","n_points","d3","DOM","setup_display","checkbox","forces_options","run_loop","init_physics","visibility","apply_membrane_forces","polarization_factor","apply_nucleus_forces","apply_intercell_forces","paint_cells","paint_actins","paint_polarization","paint_forces","paint_details","advance_physics","tick_duration","clear_forces","invalidation"], function(circle_poly,n_points,d3,DOM,setup_display,checkbox,forces_options,run_loop,init_physics,visibility,apply_membrane_forces,polarization_factor,apply_nucleus_forces,apply_intercell_forces,paint_cells,paint_actins,paint_polarization,paint_forces,paint_details,advance_physics,tick_duration,clear_forces,invalidation)
{
  const env_size = {width: 40.0, height: 20.0};
  const example_cells = [
    circle_poly([ 8.0, 10.0], 3.7, n_points),
    circle_poly([16.0, 10.0], 3.7, n_points),
    circle_poly([24.0, 10.0], 3.7, n_points),
    circle_poly([32.0, 10.0], 3.7, n_points),
  ];
  
  example_cells[0].pole = Math.floor(n_points * 0 / 4);
  example_cells[1].pole = Math.floor(n_points * 1 / 8);
  example_cells[2].pole = Math.floor(n_points * 5 / 8);
  example_cells[3].pole = Math.floor(n_points * 2 / 4);

  
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  div.append(() => display.canvas);
  
  let membrane_forces_to_display = checkbox({
    title: "Forces",
    description: "The checked forces will be shown on the simulation.",
    options: [
      {value: "lennard-jones", label: "Lennard-Jones Potential", color: forces_options["lennard-jones"].color},
      {value: "elastic", label: "Elastic Force", color: forces_options["elastic"].color},
      {value: "damping", label: "Damping Force", color: forces_options["damping"].color},
      {value: "elastic-actin", label: "Elastic-Actin Force", color: forces_options["elastic-actin"].color},
      {value: "damping-actin", label: "Damping-Actin Force", color: forces_options["damping-actin"].color},
      {value: "osmosis", label: "Osmosis Pressure", color: forces_options["osmosis"].color},
    ],
    value: ["osmosis"],
  });
  
  div.append(() => membrane_forces_to_display);
  
  
  
  let loop = run_loop({
    
    setup: function () {

      let cells = init_physics(example_cells);
      
      let time = 0.0;
      
      return {cells, time};
    },
    update: async function({cells, time}, {fps}) {

      await visibility();
      
      apply_membrane_forces(cells, {store_forces: true, polarization_factor});
      
      apply_nucleus_forces(cells, {store_forces: true, actin_polarization_factor: 0.0});
            
      apply_intercell_forces(cells, cells, {store_forces: true});

      // Display.
      paint_cells(cells, display);
      paint_actins(cells, 7, display);
      paint_polarization(cells, polarization_factor, display);
      paint_forces(cells, membrane_forces_to_display.value, display);
      paint_details({time, fps}, display);
      
      // Advance physics a tick.
      advance_physics(cells, tick_duration);
      time += tick_duration;
      clear_forces(cells);
      
      
      // Return the new state.
      if (time > 30) return loop.reset();
      return {cells, time};
    },
  });

  invalidation.then(loop.stop);
  
  return div.node();
}
);
  main.variable(observer("viewof polarization_factor")).define("viewof polarization_factor", ["slider"], function(slider)
{
  return slider({
    min: 0.1,
    max: 1.5,
    value: 0.5,
    step: 0.1,
    precision: 1,
    title: "Polarization Factor",
    description: "Increase in osmosis pressure on the leading edge; and decrease on the trailing edge.",
  });
}
);
  main.variable(observer("polarization_factor")).define("polarization_factor", ["Generators", "viewof polarization_factor"], (G, _) => G.input(_));
  main.variable(observer("viewof generate_polarization")).define("viewof generate_polarization", ["button"], function(button){return(
button({value: "Regenerate polarization", description: "Compute another set of random polarization."})
)});
  main.variable(observer("generate_polarization")).define("generate_polarization", ["Generators", "viewof generate_polarization"], (G, _) => G.input(_));
  main.variable(observer()).define(["setup_display","env_size","init_physics","polarized_initial_cells","paint_cells","paint_polarization","polarization_factor"], function(setup_display,env_size,init_physics,polarized_initial_cells,paint_cells,paint_polarization,polarization_factor)
{
  let display = setup_display(env_size);
  let cells = init_physics(polarized_initial_cells);
  paint_cells(cells, display);
  paint_polarization(cells, polarization_factor, display);
  return display.canvas;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### Periodic Boundaries

To stop cells from flying out of the simulation area we need to define the environment
boundaries. A common technique are [periodic boundaries](https://en.wikipedia.org/wiki/Periodic_boundary_conditions)
where cells passing through one side of the simulation environment appear and interact 
on the other side. The intetion is to simulate cells as if they're surrounded by other
cells, and it allows cells to move freely through the environment borders.

Note that as an optimization we only create cell images if they are near enough to the 
simulation area that they can interact with active cells.`
)});
  main.variable(observer()).define(["init_physics","initial_cells","center_of_mass_nucleus","periodic_boundaries","lennard_jones_max_distance","setup_display","env_size","paint_cells"], function(init_physics,initial_cells,center_of_mass_nucleus,periodic_boundaries,lennard_jones_max_distance,setup_display,env_size,paint_cells)
{
  let cells = init_physics(initial_cells);
  center_of_mass_nucleus(cells);
  let image_cells = periodic_boundaries(cells, lennard_jones_max_distance);
  let display = setup_display(env_size);
  let {context, canvas: {width, height}} = display;
  context.translate(width * 0.25, height * 0.25);
  context.scale(0.5, 0.5);
  paint_cells(image_cells, display);
  return display.canvas;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`## Setup Details`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Using **μm** units for length.`
)});
  main.variable(observer("equilibrium_area")).define("equilibrium_area", function(){return(
100.0
)});
  main.variable(observer("equilibrium_diameter")).define("equilibrium_diameter", ["equilibrium_area"], function(equilibrium_area){return(
2 * Math.sqrt(equilibrium_area / Math.PI)
)});
  main.variable(observer("equilibrium_distance")).define("equilibrium_distance", ["equilibrium_diameter","n_points"], function(equilibrium_diameter,n_points)
{
  // Distance between n points evenly on the perimeter.
  return Math.PI * equilibrium_diameter / n_points;
}
);
  main.variable(observer("nucleus_equilibrium_distance")).define("nucleus_equilibrium_distance", ["equilibrium_diameter"], function(equilibrium_diameter){return(
equilibrium_diameter / 2.0
)});
  main.variable(observer("initial_cell_centers")).define("initial_cell_centers", ["generate_cells","generate_poison_disc_cell_centers","env_size","min_nucleus_separation","n_cells"], function(generate_cells,generate_poison_disc_cell_centers,env_size,min_nucleus_separation,n_cells)
{
  generate_cells;
  return generate_poison_disc_cell_centers({env_size, min_nucleus_separation, n_cells});
}
);
  main.variable(observer("generate_random_cell_centers")).define("generate_random_cell_centers", ["d3","distance"], function(d3,distance){return(
function generate_random_cell_centers({env_size, min_nucleus_separation, n_cells, random=Math.random}){
  let points = [];
  
  let random_x = d3.randomUniform.source(random)(min_nucleus_separation, env_size.width - min_nucleus_separation);
  let random_y = d3.randomUniform.source(random)(min_nucleus_separation, env_size.height - min_nucleus_separation);
  
  let tries = 0;
  while (points.length < n_cells && tries++ < 100000)
  {
    let candidate = [random_x(), random_y()];
    
    // Try again if the `candidate` isn't at least `min_distance` from the others.
    if (points.some(p => distance(p, candidate) < min_nucleus_separation)) continue;
    
    points.push(candidate);
  }
  return points;
}
)});
  main.variable(observer("generate_poison_disc_cell_centers")).define("generate_poison_disc_cell_centers", ["poissonDiscSampler"], function(poissonDiscSampler){return(
function generate_poison_disc_cell_centers({env_size, min_nucleus_separation, n_cells, random=Math.random}) {
  
  function generate_candidate() {
    // Poison Disk sampling takes a radius instead of number of cells. I'll approximate the radius such
    // that I get the approximate number of cells. For sampling with radius 1 the packing density is 0.6967, from:
    // https://mathoverflow.net/questions/238661/formula-for-density-of-maximal-poisson-disk-sampling-of-radius-1

    const packing_density = 0.6967;

    // Keep at least min separation from edges.
    let width = env_size.width - 2*min_nucleus_separation;
    let height = env_size.height - 2* min_nucleus_separation;

    let poisson_radius = Math.sqrt(width * height * packing_density / n_cells);

    let points = [];

    let sample = poissonDiscSampler(width, height, poisson_radius, random);

    while (true) {
      let s = sample();

      if (!s) return points;

      points.push([s[0]+min_nucleus_separation, s[1]+min_nucleus_separation]);
    }
  }
  
  const max_tries = 10000;
  
  for(let i = 0; i < max_tries; ++i) {
    let points = generate_candidate();
    if (Math.abs(points.length - n_cells) / n_cells < 0.01) return points;
  }
  
  throw `Couldn't generate the requested amount of cells after ${max_tries}`; 
}
)});
  main.variable(observer("initial_cell_polygons")).define("initial_cell_polygons", ["compute_voronoi_polygons","initial_cell_centers","env_size"], function(compute_voronoi_polygons,initial_cell_centers,env_size){return(
compute_voronoi_polygons({cell_centers: initial_cell_centers, env_size})
)});
  main.variable(observer("compute_voronoi_polygons")).define("compute_voronoi_polygons", ["d3"], function(d3){return(
function compute_voronoi_polygons({cell_centers, env_size}) {
  const voronoi = d3.voronoi()
    .extent([[0, 0], [env_size.width, env_size.height]]);
  
  const diagram = voronoi(cell_centers);
  
  return diagram.polygons();
}
)});
  main.variable(observer("shrunk_cell_polygons")).define("shrunk_cell_polygons", ["initial_cell_polygons","shrink_poly","shrink_distance"], function(initial_cell_polygons,shrink_poly,shrink_distance){return(
initial_cell_polygons.map(poly => shrink_poly(poly, shrink_distance))
)});
  main.variable(observer("initial_cells")).define("initial_cells", ["shrunk_cell_polygons","perimeter_points","n_points"], function(shrunk_cell_polygons,perimeter_points,n_points){return(
shrunk_cell_polygons.map(poly => perimeter_points(poly, n_points))
)});
  main.variable(observer("polarized_initial_cells")).define("polarized_initial_cells", ["generate_polarization","generate_random_polarization","initial_cells"], function(generate_polarization,generate_random_polarization,initial_cells)
{
  generate_polarization;
  return generate_random_polarization(initial_cells);
}
);
  main.variable(observer("generate_random_polarization")).define("generate_random_polarization", function(){return(
function generate_random_polarization(cells, random=Math.random){
  return cells.map(cell => {
    // Clone the cell so we don't modify the original.
    let clone = cell.slice();
    clone.data = cell.data;
    clone.pole = Math.floor(random() * clone.length);
    return clone;
  });
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Because we shrink the cell polygons we need a minium separation between the initial cell positions.`
)});
  main.variable(observer("min_nucleus_separation")).define("min_nucleus_separation", ["lennard_jones_distance"], function(lennard_jones_distance){return(
2.0 * lennard_jones_distance
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Environment size in **μm** to accomodate the cells.`
)});
  main.variable(observer("env_size")).define("env_size", ["n_cells","equilibrium_area"], function(n_cells,equilibrium_area)
{
  let ratio = 2.0;
  let env_area = n_cells * equilibrium_area;
  
  // To compute the environment size we want:
  // width * height == env_area;
  // width == height * ratio;
  
  let height = Math.sqrt(env_area / ratio);
  let width = height * ratio;
  
  return {width, height};
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`How much to advance physics each tick (in seconds). Note that the display updates roughly 60 times a second.`
)});
  main.variable(observer("tick_duration")).define("tick_duration", function()
{
  // Aim for `x` simulation seconds per real seconds.
  
  let x = 5;
  
  return x * (1.0 / 60.0);
}
);
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`### Physics

To simulate the physics of the problem we integrate forces with the Semi-implicit Euler method:

${tex`v_{t+\Delta t} = v_t + a_t \Delta t \newline x_{t+\Delta t} = x_t + v_{t+\Delta t} \Delta t`}

As shown in [this article](https://gafferongames.com/post/integration_basics/) the results are close to the 4th order Runge-Kutta method but it's much easier to implement. Additionally unlike RK4, Semi-implicit Euler conserves the energy in the system better, however for oscillators it doesn't match the frequency of an anaylitical solution.
`
)});
  main.variable(observer("init_physics")).define("init_physics", ["d3","center_of_mass_nucleus"], function(d3,center_of_mass_nucleus){return(
function init_physics(polygons) {
  // Initialize physics for the list of polygons.
  
  let cells = polygons.map((polygon, i) => {
    // Copy all positions.
    let cell = Array.from(polygon, p => p.slice());
    
    // Store the cell index.
    cell.i = i;
    
    // Store the pole if any.
    cell.pole = polygon.pole;
    cell.theta = polygon.theta;
    
    // Store the index of each point within the cell, and a reference to the cell.
    // We need these to recover the cell from the point when using d3-quadree.
    cell.forEach((p, i) => {p.cell = cell; p.i = i;});
    
    // And the center point.
    cell.data = polygon.data.slice();
    
    // Initialize velocities and acceleration with 0s.
    cell.v = Array.from(polygon, () => [0, 0]);
    cell.a = Array.from(polygon, () => [0, 0]);
    // And for each point create an empty list of stored forces.
    cell.f = Array.from(polygon, () => []);
    
    // Initialize nucleus physics too.
    cell.data_v = [0, 0];
    cell.data_a = [0, 0];
    cell.data_f = [];
    
    
    // Set the color of the cells.
    cell.color = d3.schemeCategory10[i%10];
      
    return cell;
  });
  
  // Set the nucleus to the initial proper position, instead of the voronoi center.
  center_of_mass_nucleus(cells);
                           
  return cells;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Unfortunately we still pick up energy over time; to fix it we apply a decay factor to the velocities every physics tick.`
)});
  main.variable(observer("default_physics_options")).define("default_physics_options", function(){return(
{
  velocity_decay: 1e-3,
}
)});
  main.variable(observer("advance_physics")).define("advance_physics", ["default_physics_options"], function(default_physics_options){return(
function advance_physics(objects, timestep, options={}){
  let {
    velocity_decay,
  } = {...default_physics_options, ...options};
  
  let velocity_γ = 1.0 - velocity_decay;
  
  // Consume the active forces to change velocities and position for all objects.
  for (let o of objects) {
    for (let i = 0; i < o.length; ++i) {
      // Advance velocity first.
      o.v[i][0] = o.v[i][0] * velocity_γ + o.a[i][0] * timestep;
      o.v[i][1] = o.v[i][1] * velocity_γ + o.a[i][1] * timestep;

      // Advance positions usig the new velocities.
      o[i][0] += o.v[i][0] * timestep;
      o[i][1] += o.v[i][1] * timestep;
      
      // We consumed all forces / acceleration for this step.
      o.a[i][0] = 0;
      o.a[i][1] = 0;
    }
    
    // Do the same for the nucleus.
    o.data_v[0] = o.data_v[0] * velocity_γ + o.data_a[0] * timestep;
    o.data_v[1] = o.data_v[1] * velocity_γ + o.data_a[1] * timestep;
    
    o.data[0] += o.data_v[0] * timestep;
    o.data[1] += o.data_v[1] * timestep;
    
    o.data_a[0] = 0;
    o.data_a[1] = 0;
  }
}
)});
  main.variable(observer("clear_forces")).define("clear_forces", function(){return(
function clear_forces(objects){
  for (let o of objects) {
    for (let i = 0; i < o.length; ++i) {
      o.f[i] = [];
    }
    o.data_f = [];
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### Forces`
)});
  main.variable(observer("elastic_force")).define("elastic_force", ["elastic_constant","equilibrium_distance"], function(elastic_constant,equilibrium_distance){return(
function elastic_force(r_i, r_j, k_e=elastic_constant, l_0=equilibrium_distance) {
  // Un-optimzed
  // -----------
  
  // let r_ij = sub2d(r_j, r_i);
  // let l_ij = magnitude(r_ij);
  // let u_ij = mul2d(r_ij, 1.0/l_ij);
  // return mul2d(u_ij, - elastic_constant * (l_ij - equilibrium_distance));
  
  
  // Optimized
  // ---------
  // Avoid creating temporary arrays and compute the force locally.
  
  let dx = r_j[0] - r_i[0];
  let dy = r_j[1] - r_i[1];
  
  let l_ij = Math.sqrt(dx*dx + dy*dy);
  
  let f = - k_e * (l_ij - l_0);
  
  return [f * dx / l_ij, f * dy / l_ij];
}
)});
  main.variable(observer("damping_force")).define("damping_force", ["damping_constant"], function(damping_constant){return(
function damping_force(r_i, r_j, v_i, v_j, γ=damping_constant) {
  // Un-optimized
  // ------------
  
  // let v_ij = sub2d(v_j, v_i);
  // let r_ij = sub2d(r_j, r_i);
  
  // let l_ij = magnitude(r_ij);
  // let u_ij = mul2d(r_ij, 1.0/l_ij);
  
  // // Compute the projection of the speed onto the membrane, this is what we can dampen.
  // let pv = dot2d(v_ij, u_ij);

  // return mul2d(u_ij, - damping_constant * pv);
  
    
  // Optimized
  // ---------
  // Avoid creating temporary arrays and compute the force locally.
  
  let dx = r_j[0] - r_i[0];
  let dy = r_j[1] - r_i[1];
  
  let dvx = v_j[0] - v_i[0];
  let dvy = v_j[1] - v_i[1];
  
  // Avoid the square root since because we'll use the projection of v on the 
  // full length r, insted of the unit r/l. Thus we'll have to divide by l squared.
  let inv_lsq_ij = 1.0 / (dx*dx + dy*dy);
  // Force magnitude times the distance l.
  let f_times_l = - γ * (dvx*dx + dvy*dy);
  
  return [f_times_l * dx * inv_lsq_ij, f_times_l * dy * inv_lsq_ij];
}
)});
  main.variable(observer("osmosis_force")).define("osmosis_force", ["equilibrium_area","osmosis_constant","unit_normal","dot2d","inplace_mul2d"], function(equilibrium_area,osmosis_constant,unit_normal,dot2d,inplace_mul2d){return(
function osmosis_force(r_i, r_k, a_m, polarization=null, a_0=equilibrium_area, k_a=osmosis_constant) {
  let n_ik = unit_normal(r_i, r_k);
  let magnitude = k_a * (a_m - a_0);
  if (polarization) magnitude *= (1 - dot2d(polarization, n_ik));
  
  return inplace_mul2d(n_ik, magnitude);
}
)});
  main.variable(observer("default_membrane_options")).define("default_membrane_options", ["elastic_constant","equilibrium_distance","damping_constant","osmosis_constant","equilibrium_area","polarization_factor","stiffness_constant"], function(elastic_constant,equilibrium_distance,damping_constant,osmosis_constant,equilibrium_area,polarization_factor,stiffness_constant){return(
{
  // Elastic
  elastic_constant,
  equilibrium_distance,
  // Damping
  damping_constant,
  // Osmosis
  osmosis_constant,
  equilibrium_area,
  polarization_factor,
  // Stiffness
  stiffness_constant,
  // Other
  store_forces: false,
}
)});
  main.variable(observer("apply_membrane_forces")).define("apply_membrane_forces", ["default_membrane_options","d3","mul2d","unit","elastic_force","inplace_add2d","damping_force","osmosis_force"], function(default_membrane_options,d3,mul2d,unit,elastic_force,inplace_add2d,damping_force,osmosis_force){return(
function apply_membrane_forces(cells, options={}) {
  // Merge the passed in options with the defaults and unpack them.
  let {
    elastic_constant,
    equilibrium_distance,
    damping_constant,
    osmosis_constant,
    equilibrium_area,
    polarization_factor,
    store_forces,
  } = {...default_membrane_options, ...options};

  
  
  for (let c of cells) {
    let cell_area = d3.polygonArea(c);
    
    // Get the polarization vector for the cell, from the center to the pole * polarization factor.
    let polarization = (!polarization_factor || c.pole === undefined) ? null :
      mul2d(unit(c.data, c[c.pole]), polarization_factor);

    for (let i = 0; i < c.length; ++i) {
      let j = (i + 1) % c.length;
      let k = (i + 2) % c.length;
      
      // Apply elastic force on j from both neighbours.
      let elastic_0 = elastic_force(c[i], c[j], elastic_constant, equilibrium_distance);
      let elastic_1 = elastic_force(c[k], c[j], elastic_constant, equilibrium_distance);
      inplace_add2d(c.a[j], elastic_0);
      inplace_add2d(c.a[j], elastic_1);
      
      // Apply damping force on j from both neighbours.
      let damping_0 = damping_force(c[i], c[j], c.v[i], c.v[j], damping_constant);
      let damping_1 = damping_force(c[k], c[j], c.v[k], c.v[j], damping_constant);
      inplace_add2d(c.a[j], damping_0);
      inplace_add2d(c.a[j], damping_1);
      
      // Apply osmosis pressure on j, using ik to define the normal.
      let osmosis = osmosis_force(c[i], c[k], cell_area, polarization, equilibrium_area, osmosis_constant);
      inplace_add2d(c.a[j], osmosis);
      
      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.f[j].push({kind: "elastic", force: elastic_0});
        c.f[j].push({kind: "elastic", force: elastic_1});
        
        c.f[j].push({kind: "damping", force: damping_0});
        c.f[j].push({kind: "damping", force: damping_1});
        
        c.f[j].push({kind: "osmosis", force: osmosis});
      }
    }
  }
}
)});
  main.variable(observer("stiffness_moment")).define("stiffness_moment", ["stiffness_constant"], function(stiffness_constant){return(
function stiffness_moment(r_i, r_j, r_k, k_s=stiffness_constant) {
  let theta = (
    Math.atan2(r_j[1] - r_i[1], r_j[0] - r_i[0]) - 
    Math.atan2(r_k[1] - r_j[1], r_k[0] - r_j[0])
  );
  
  // Make sure theta is between - Pi and + PI.
  theta = (theta + 3*Math.PI) % (2 * Math.PI) - Math.PI;
  
  return - theta * k_s;
}
)});
  main.variable(observer("apply_membrane_stiffness")).define("apply_membrane_stiffness", ["default_membrane_options","stiffness_moment","mul2d","unit_normal","distance","inplace_add2d","inplace_sub2d"], function(default_membrane_options,stiffness_moment,mul2d,unit_normal,distance,inplace_add2d,inplace_sub2d){return(
function apply_membrane_stiffness(cells, options={}) {
  // Merge the passed in options with the defaults and unpack them.
  let {
    stiffness_constant,
    store_forces,
  } = {...default_membrane_options, ...options};
  
  for (let c of cells) {

    for (let i = 0; i < c.length; ++i) {
      let j = (i + 1) % c.length;
      let k = (i + 2) % c.length;
      
      // Compute stiffness moment for the j joint.
      let stiffness = stiffness_moment(c[i], c[j], c[k], stiffness_constant);
      
      // Stiffness acts in the normal direction with strength proportional to the length.
      let stiffness_ij = mul2d(unit_normal(c[j], c[i]), - stiffness * distance(c[j], c[i]));
      let stiffness_jk = mul2d(unit_normal(c[j], c[k]), + stiffness * distance(c[j], c[k]));

      inplace_add2d(c.a[k], stiffness_jk);
      inplace_sub2d(c.a[j], stiffness_jk);
      inplace_add2d(c.a[i], stiffness_ij);
      inplace_sub2d(c.a[j], stiffness_ij);

      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.f[k].push({kind: "stiffness", force: stiffness_jk});
        c.f[j].push({kind: "stiffness", force: mul2d(stiffness_jk, -1)});
        
        c.f[i].push({kind: "stiffness", force: stiffness_ij});
        c.f[j].push({kind: "stiffness", force: mul2d(stiffness_ij, -1)});
      }
    }
  }
}
)});
  main.variable(observer("lennard_jones_force")).define("lennard_jones_force", ["lenard_jones_strength","lennard_jones_distance","lennard_jones_min_distance","lennard_jones_max_distance","sub2d","closest_point_on_segment","magnitude","mul2d"], function(lenard_jones_strength,lennard_jones_distance,lennard_jones_min_distance,lennard_jones_max_distance,sub2d,closest_point_on_segment,magnitude,mul2d){return(
function lennard_jones_force(
 r_i, r_j, p,
 k_lj=lenard_jones_strength, 
 r_0=lennard_jones_distance, 
 r_0_min=lennard_jones_min_distance, 
 r_0_max=lennard_jones_max_distance) {
      
  // We compute the lennard jones force to the closest point on the segment
  // `r_i`, `r_j` relative to the point `p` on the other membrane. Since
  // the force is short distance, this helps prevent the membranes passing
  // through eachother.
  
  // Get the vector from the closest point to the membrane point.
  let v = sub2d(p, closest_point_on_segment(r_i, r_j, p));
  let r = magnitude(v);
  
  // If r is infinitesimally close, we don't know which way it should point,
  // return 0 to avoid infinities when computing the unit direction vector.
  if (r < 1e-10) return null;
  
  // Check if it's within max distance, again, and quickly return if not.
  if (r > r_0_max) return null;
    
  // Compute the unit direction.
  let u = mul2d(v, 1.0/r);
  
  // Cap r to the minimum distance so we don't get infinite forces.
  if (r < r_0_min) r = r_0_min;

  // Compute the magnitude of the force.
  // let lj = k_lj * ((r_0 / r)**8 - (r_0 / r)**4) / r**2;
  let lj = k_lj * ((r_0 / r)**2 - 1.0) / r**2;
   
  // Return the force with magnituze `lj` in direction `u`.
  return mul2d(u, lj);
}
)});
  main.variable(observer("default_intercell_options")).define("default_intercell_options", ["lenard_jones_strength","lennard_jones_distance","lennard_jones_min_distance","lennard_jones_max_distance"], function(lenard_jones_strength,lennard_jones_distance,lennard_jones_min_distance,lennard_jones_max_distance){return(
{
  // Lennard jones constants
  lenard_jones_strength,
  lennard_jones_distance,
  lennard_jones_min_distance,
  lennard_jones_max_distance,
  // Whether to interact with own membrane
  self_interact: true,
  // Other
  store_forces: false,
}
)});
  main.variable(observer("apply_intercell_forces")).define("apply_intercell_forces", ["default_intercell_options","d3","lennard_jones_force","inplace_add2d"], function(default_intercell_options,d3,lennard_jones_force,inplace_add2d){return(
function apply_intercell_forces(cells, interact_cells, options={}) {
  
  // Merge the passed in options with the defaults and unpack them.
  let {  
    lenard_jones_strength,
    lennard_jones_distance,
    lennard_jones_min_distance,
    lennard_jones_max_distance,
    self_interact,
    store_forces,
  } = {...default_intercell_options, ...options};
  
  // We apply the forces on `cells` but allow them to interact with any of `interact_cells`. The
  // purpose is to allow interactions with cell images, but not to apply the forces on the images
  // themselves.
  
  // Create a quadtree with all original cell positions.
  let quadtree = d3.quadtree();
  for (let cell of cells) quadtree.addAll(cell);
  
  for (let interact_cell of interact_cells) {
    // Remember the index of the cell so we avoid self interactions. Cell images (those that 
    // have an original_i can interact with all original cells, we use the -1 sentinel.
    let interact_i = interact_cell.original_i === undefined ? interact_cell.i : -1;
    
    // For all segments on the interact cell.
    let r0, r1 = interact_cell[interact_cell.length - 1];
    for (let i = 0; i < interact_cell.length; ++i) {
      r0 = r1;
      r1 = interact_cell[i];
      
      // Only cells within `lennard_jones_max_distance` of the box containing `r0`,`r1` could
      // interact with the segment. Find those points using the quadtree.
      
      let min_x = Math.min(r0[0], r1[0]) - lennard_jones_max_distance;
      let max_x = Math.max(r0[0], r1[0]) + lennard_jones_max_distance;
      let min_y = Math.min(r0[1], r1[1]) - lennard_jones_max_distance;
      let max_y = Math.max(r0[1], r1[1]) + lennard_jones_max_distance;
      
      // Find the nodes within the specified rectangle.
      quadtree.visit(function(node, x0, y0, x1, y1) {
        if (!node.length) {
          do {
            let p = node.data;
            let cell = p.cell;
            let p_i = p.i;
            
            // Avoid interactions between points and the segment to which that point 
            // belongs to on the same cell. We can also avoid self interactions here.
            if (interact_i === cell.i) {
              // Ignore all self interactions.
              if (!self_interact) continue;
              // Allow self interactions but not with a point on the same segment.
              if (p_i === i || (p_i + 1) % interact_cell.length === i) continue;
            }

            // Compute the Lennard Jones force.
            let f_p = lennard_jones_force(
              r0, r1, p,
              lenard_jones_strength, 
              lennard_jones_distance,
              lennard_jones_min_distance,
              lennard_jones_max_distance);

            // Skip if null, as in the case when p is too far.
            if (f_p === null) continue;

            inplace_add2d(cell.a[p_i], f_p);

            // For speed we don't store forces for each node by default.
            if (store_forces) {
              cell.f[p_i].push({kind: "lennard-jones", force: f_p});
            }
            
          } while (node = node.next);
        }
        
        // If this node doesn't contain any part of the search box, then skip searching it.
        return x0 >= max_x || y0 >= max_y || x1 < min_x || y1 < min_y;
      });
    }
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### Nuclei Handling

There 2 methods which we can use to determine the position of the nucleus:

1. We can treat it as connected to the membrane with actin fibers. These are simulated by damped oscilators similar to the membrane, but parametrised separately. The method is implemented as \`apply_nucleus_forces\`.

2. We define the nucleus as the center of mass of the cell polygon; implemented by \`center_of_mass_nucleus\`.

In both cases we also compute the maximum radius of the cell to optimize the run time.
We define the maximum radius of the cell as the largest distance from a membrane
point to the cell nucleus. This helps us optimize distance checks; using the distance
between the nuclei and the radius of the cells, we can quickly check if the membranes
might be close to each-other.
`
)});
  main.variable(observer("default_nucleus_options")).define("default_nucleus_options", ["nucleus_elastic_constant","nucleus_equilibrium_distance","nucleus_damping_constant","default_intercell_options"], function(nucleus_elastic_constant,nucleus_equilibrium_distance,nucleus_damping_constant,default_intercell_options){return(
{
  // Elastic
  nucleus_elastic_constant,
  nucleus_equilibrium_distance,
  // Damping
  nucleus_damping_constant,
  
  // Bring in the intercel option so we can reuse LJ to keep the nucleus inside the cell.
  ...default_intercell_options,
  
  // Other
  store_forces: false,
}
)});
  main.variable(observer("apply_nucleus_forces")).define("apply_nucleus_forces", ["default_nucleus_options","elastic_force","inplace_add2d","damping_force","lennard_jones_force","compute_maximum_radius"], function(default_nucleus_options,elastic_force,inplace_add2d,damping_force,lennard_jones_force,compute_maximum_radius){return(
function apply_nucleus_forces(cells, options={}) {
  // Merge the passed in options with the defaults and unpack them.
  let {
    nucleus_elastic_constant,
    nucleus_equilibrium_distance,
    nucleus_damping_constant,
    store_forces,
    
    lenard_jones_strength,
    lennard_jones_distance,
    lennard_jones_min_distance,
    lennard_jones_max_distance,
  } = {...default_nucleus_options, ...options};
  
  for (let c of cells) {

    for (let i = 0; i < c.length; ++i) {
      
      // Apply elastic force between i and nucleus.
      let elastic_n = elastic_force(c[i], c.data, nucleus_elastic_constant, nucleus_equilibrium_distance);
      let elastic_i = elastic_force(c.data, c[i], nucleus_elastic_constant, nucleus_equilibrium_distance);
      inplace_add2d(c.data_a, elastic_n);
      inplace_add2d(c.a[i], elastic_i);
      
      // Apply damping force between i and nucleus.
      let damping_n = damping_force(c[i], c.data, c.v[i], c.data_v, nucleus_damping_constant);
      let damping_i = damping_force(c.data, c[i], c.data_v, c.v[i], nucleus_damping_constant);
      inplace_add2d(c.data_a, damping_n);
      inplace_add2d(c.a[i], damping_i);
      
      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.data_f.push({kind: "elastic-actin", force: elastic_n});
        c.f[i].push({kind: "elastic-actin", force: elastic_i});
        
        c.data_f.push({kind: "damping-actin", force: damping_n});
        c.f[i].push({kind: "damping-actin", force: damping_i});
      }
    }
    
    // For all segments on the cell.
    let r0, r1 = c[c.length - 1];
    for (let i = 0; i < c.length; ++i) {
      r0 = r1;
      r1 = c[i];
      
      // Compute the Lennard Jones force.
      let f_p = lennard_jones_force(
        r0, r1, c.data,
        lenard_jones_strength * 2.0, 
        lennard_jones_distance * 0.5,
        lennard_jones_min_distance * 0.5,
        lennard_jones_max_distance * 0.5);

      // Skip if null, as in the case when p is too far.
      if (f_p === null) continue;

      inplace_add2d(c.data_a, f_p);

      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.data_f.push({kind: "lennard-jones", force: f_p});
      }
    }
            
  }
  
  compute_maximum_radius(cells);
}
)});
  main.variable(observer("center_of_mass_nucleus")).define("center_of_mass_nucleus", ["d3","compute_maximum_radius"], function(d3,compute_maximum_radius){return(
function center_of_mass_nucleus(cells){
  for (let cell of cells) {
    cell.data = d3.polygonCentroid(cell);
  }
  
  compute_maximum_radius(cells);
}
)});
  main.variable(observer("compute_maximum_radius")).define("compute_maximum_radius", ["distance"], function(distance){return(
function compute_maximum_radius(cells) {
  for (let cell of cells) {
    cell.max_radius = 0.0;
    for (let p of cell) {
      let dist = distance(p, cell.data);
      if (dist > cell.max_radius) cell.max_radius = dist;
    }
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### Wrap-around Boundaries`
)});
  main.variable(observer("make_cell_image")).define("make_cell_image", function(){return(
function make_cell_image(cell) {

  // Copy all positions.
  let image = Array.from(cell, p => p.slice());
  
  // Remember the index to the original cell.
  image.original_i = cell.i;
  image.original = cell;
  
  // And the center point.
  image.data = cell.data.slice();
  // And velocities.
  image.v = Array.from(cell.v, v => v.slice());
  
  // And nucleus velocity.
  image.data_v = cell.data_v.slice();
  
  // Do not copy acceleration or forces!

  return image;
}
)});
  main.variable(observer("move_cell_to")).define("move_cell_to", ["sub2d","inplace_add2d"], function(sub2d,inplace_add2d){return(
function move_cell_to(cell, new_center) {
  let v = sub2d(new_center, cell.data);
  for (let p of cell) {
    inplace_add2d(p, v);
  }
  inplace_add2d(cell.data, v);
}
)});
  main.variable(observer("periodic_boundaries")).define("periodic_boundaries", ["env_size","modulo","move_cell_to","add2d","make_cell_image"], function(env_size,modulo,move_cell_to,add2d,make_cell_image){return(
function periodic_boundaries(cells, max_interaction_distance) {
  // Move cells that passed through the boundary on the other side.
  for (let cell of cells) {
    let outside = (
      cell.data[0] < 0 ||
      cell.data[0] > env_size.width ||
      cell.data[1] < 0 ||
      cell.data[1] > env_size.height
    );
    if (outside) {
      let loop_around_position = [
        modulo(cell.data[0], env_size.width), 
        modulo(cell.data[1], env_size.height),
      ];
      move_cell_to(cell, loop_around_position);
    }
  }
  
  // Now all simulated cells centers are within the environment boundaries. But
  // their membranes might be outside; find out the maximum limits.
  let env_limits = {
    min_x: 0.0,
    max_x: env_size.width,
    min_y: 0.0,
    max_y: env_size.height,
  };
  for (let cell of cells) {
    let cell_min_x = cell.data[0] - cell.max_radius;
    let cell_max_x = cell.data[0] + cell.max_radius;
    let cell_min_y = cell.data[1] - cell.max_radius;
    let cell_max_y = cell.data[1] + cell.max_radius;
    
    if (cell_min_x < env_limits.min_x) env_limits.min_x = cell_min_x;
    if (cell_max_x > env_limits.max_x) env_limits.max_x = cell_max_x;
    if (cell_min_y < env_limits.min_y) env_limits.min_y = cell_min_y;
    if (cell_max_y > env_limits.max_y) env_limits.max_y = cell_max_y;
  }
  
  // Check if it can interact with the environment limits above.
  function interacts(center, max_radius) {
    if (center[0] + max_radius + max_interaction_distance < env_limits.min_x) return false;
    if (center[0] - max_radius - max_interaction_distance > env_limits.max_x) return false;
    if (center[1] + max_radius + max_interaction_distance < env_limits.min_y) return false;
    if (center[1] - max_radius - max_interaction_distance > env_limits.max_y) return false;
    
    return true;
  }
  
  // Create the cell images along the borders.
  let images = [
    [-1, +1], [ 0, +1], [+1, +1],
    [-1,  0],           [+1,  0],
    [-1, -1], [ 0, -1], [+1, -1],
  ];
  
  let image_cells = [];
  
  for (let image of images) {
    let image_displacement = [
      image[0] * env_size.width,
      image[1] * env_size.height,
    ];
    
    for (let cell of cells) {
      let image_center = add2d(cell.data, image_displacement);
      
      // Only add the image if it might interact with the environment.
      if (interacts(image_center, cell.max_radius)) {
        
        let image_cell = make_cell_image(cell);
        move_cell_to(image_cell, image_center);
        
        image_cells.push(image_cell);
      }
    }
  }
  
  // Concatenate the original cells with the boundary images.
  return cells.concat(image_cells);
}
)});
  main.variable(observer("modulo")).define("modulo", function(){return(
function modulo(x, d) {
  // Javascript's % handles signed values differently than mathy modulo.
  return (x % d + d) % d;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### ~~Prevent Collisions~~

~~Due to our simulation running at discrete timesteps it might be the case that 2 cells 
can end up overlapping. In that case the repulsive force keeping the cells apart will
flip direction and make them further overlap. To solve this problem we can either 
prevent cell collisions, or ensure the repulsive force always pushes outside of a cell.~~

**As seen below, fixing collisions distorts the cells too much so we won't use it.**
`
)});
  main.variable(observer()).define(["d3","DOM","setup_display","slider","min_nucleus_separation","init_physics","circle_poly","center_of_mass_nucleus","fix_cell_collisions","paint_cells","join_data"], function(d3,DOM,setup_display,slider,min_nucleus_separation,init_physics,circle_poly,center_of_mass_nucleus,fix_cell_collisions,paint_cells,join_data)
{
  const env_size = {width: 20.0, height: 10.0};
  
  let div = d3.select(DOM.element("div"));
  
  // Setup display for the example, a canas with svg overlayed.
  let container = d3.select(DOM.element("div"));
  container.style("position", "relative");
  
  let display = setup_display(env_size);
  container.append(() => display.canvas).style("position", "absolute");
  
  let gui = d3.select(DOM.svg(display.canvas.width, display.canvas.height));
  container.append(() => gui.node()).style("position", "absolute");
  
  container.style("width", `${display.canvas.width}px`).style("height", `${display.canvas.height}px`);
  
  div.append(() => container.node());
  
  let min_distance_slider = div.append(() => slider({
    min: 0.0,
    max: min_nucleus_separation,
    value: 0.03,
    precision: 2,
    title: "Minimum Membrane Separation (Unused)",
    description: "The cell walls in the example below will be separated by at least this distance.",
  }));
  
  let example_min_distance = min_distance_slider.node().value;
  
  min_distance_slider.on("input", () => { 
    example_min_distance = min_distance_slider.node().value;
    draw();
  });


  let centers = [
    [ 4.0,  4.0],
    [ 7.0,  4.0],
    [ 5.5,  7.0],
  ];
  
  function dragged(c, i) {
    centers[i][0] = display.xscale.invert(d3.event.x);
    centers[i][1] = display.yscale.invert(d3.event.y);
    draw();
  }
  
  function draw() {
    let cells = init_physics([
      circle_poly(centers[0], 3.0, 20),
      circle_poly(centers[1], 2.5, 20),
      circle_poly(centers[2], 1.5, 20),
    ]);
    
    center_of_mass_nucleus(cells);
    fix_cell_collisions(cells, example_min_distance);

    paint_cells(cells, display);
    
    join_data({
      root: gui,
      type: "circle",
      name: "center-point",
      data: centers,
      create: function(c, i) {
        d3.select(this)
          .attr("r", 16)
          .attr("fill", d3.schemeCategory10[i%10])
          .style("cursor", "move");
      },
      created_call: d3.drag().on("drag", dragged),
      state: function([x, y], i) {
        d3.select(this)
          .attr("cx", display.xscale(x))
          .attr("cy", display.yscale(y));
      },
    });
  }
  
  draw();
  
  return div.node();
}
);
  main.variable(observer("fix_cell_collisions")).define("fix_cell_collisions", ["distance","d3","point_average","unit","mul2d","inplace_add2d","sub2d","dot2d","signed_projected_distance"], function(distance,d3,point_average,unit,mul2d,inplace_add2d,sub2d,dot2d,signed_projected_distance){return(
function fix_cell_collisions(cells, min_distance) {
  
  min_distance = 0;
  
  // Check for collisions
  // --------------------
  
  // Do a quick pass for all possibly colliding cells, if the cell centers
  // aren't within the maximum radius than no way they can collide.
  let possibly_colliding = [];
  
  for (let j = 0; j < cells.length; ++j) {
    for (let i = 0; i < j; ++i) {
      let intercell_dist = distance(cells[i].data, cells[j].data);
      let collission_threshold = cells[i].max_radius + cells[j].max_radius + min_distance;
      if (intercell_dist < collission_threshold) possibly_colliding.push([i, j]);
    }
  }
  
  
  // Store cells definitely colliding, this time we also store exactly the points
  // that are inside the other cell.
  let collisions = [];
  
  for (let [a, b] of possibly_colliding) {
    let cell_a = cells[a];
    let cell_b = cells[b];
    
    // Expand the cells by epsilon distance (think of it as the cell membrane thickness).
    
    // TODO?
    // let expanded_cell_a = translate_poly_lines(cell_a, -min_distance);
    // let expanded_cell_b = translate_poly_lines(cell_b, -min_distance);
    
    // Store the indexes to the points that are colliding with the other cell.
    let colliding_a = [];

    for (let i = 0; i < cell_a.length; ++i) {
      let p = cell_a[i];
      // Again, we can skip by a quicker check.
      if (distance(p, cell_b.data) >= cell_b.max_radius + min_distance) continue;
      // Now do the more expensive check.
      if (d3.polygonContains(cell_b, p)) colliding_a.push(i);
      
      // TODO
      // if (d3.polygonContains(expanded_cell_b, p)) colliding_a.push(i);
    }
    
    // Same for points in b.
    let colliding_b = [];
    
    for (let i = 0; i < cell_b.length; ++i) {
      let p = cell_b[i];
      // Again, we can skip by a quicker check.
      if (distance(p, cell_a.data) >= cell_a.max_radius + min_distance) continue;
      // Now do the more expensive check.
      if (d3.polygonContains(cell_a, p)) colliding_b.push(i);
      
      // TODO
      // if (d3.polygonContains(expanded_cell_a, p)) colliding_b.push(i);
    }
    
    
    // If none of the points actually collided, we're good.
    if (colliding_a.length === 0 && colliding_b.length === 0) continue;
    
    // Use the center of mass of the intersection points to figure out how to separate
    // the 2 cells.
    let collision_center = point_average(Array.prototype.concat(
      colliding_a.map(i => cell_a[i]), colliding_b.map(i => cell_b[i])));
    
    // TODO
    // colliding_a.map(i => expanded_cell_a[i]), colliding_b.map(i => expanded_cell_b[i])));
    
    // Save collision data for the fixing step.
    collisions.push({
      a,
      b,
      colliding_a,
      colliding_b,
      collision_center,
    });
  }
  
  // Fix collisions
  // --------------
  
  let fixed = [];
  let unfixable = [];
  
  for (let {a, b, colliding_a, colliding_b, collision_center} of collisions) {
    let cell_a = cells[a];
    let cell_b = cells[b];
    
    // Get the direction from center of a to center of b and viceversa.
    let u_ab = unit(cell_a.data, cell_b.data);
    let u_ba = mul2d(u_ab, -1.0);
    
    // Applying a pi/2 rotation to the above points.
    let n_ab = [u_ab[1], -u_ab[0]];
    let n_ba = [u_ba[1], -u_ba[0]];
    
    // Translate them with respect to the collision center. The line `(collision_center, n_ab)`
    // is then normal to the line `(a, b)` and passes through the `collision_center`.
    inplace_add2d(n_ab, collision_center);
    inplace_add2d(n_ba, collision_center);
    
    
    // We fix cells by bringing the membrane closer to the center. If the center is on
    // the wrong side of the collision center than we can't fix anything.
    let ca = sub2d(cell_a.data, collision_center);
    let cb = sub2d(cell_b.data, collision_center);
    
    if (dot2d(ca, u_ba)  <= min_distance * 0.5 || dot2d(cb, u_ab) <= min_distance * 0.5) {
      unfixable.push([a, b]);
      continue;
    }
    
    
    // Fix all points from both cells, see function below.
    for (let i of colliding_a) fix_point(i, cell_a, u_ba, n_ba, collision_center);
    for (let i of colliding_b) fix_point(i, cell_b, u_ab, n_ab, collision_center);

    fixed.push([a, b]);
  }
  
  // Translate each point towards its cell center until is passes the line 
  // `(collision_center, n_ab)` by at least `min_distance * 0.5`.
  function fix_point(i, cell, direction, center_normal, collision_center) {
    let p = cell[i];
    
    let dist = signed_projected_distance(collision_center, center_normal, p) + min_distance * 0.5;

    // It might be that the point is on the correct side already.
    if (dist <= 0.0) return;

    let u_pc = unit(p, cell.data);

    let move_dist = dist / dot2d(u_pc, direction);

    inplace_add2d(cell[i], mul2d(u_pc, move_dist));
  }
  
  return {fixed, unfixable};
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### ~~Fix Repulsive Force~~

~~Instead of actually correcting the points, we can fix the Lennard Jones force so
it always acts as if the point is outside the cell, pushing it outwards if too close.
Note that we don't actually move the point, we just pretend it's outside whilst
computing the repulsive force.~~

**As seen below, we can't do this because a point inside the cell is inside for
all walls, so we don't know in which direction to push the inside point.**
`
)});
  main.variable(observer()).define(["d3","DOM","setup_display","circle_poly","forces_options","paint_cells","init_physics","point_outside_cell","add2d","mul2d","sub2d","paint_arrows","set_opacity"], function(d3,DOM,setup_display,circle_poly,forces_options,paint_cells,init_physics,point_outside_cell,add2d,mul2d,sub2d,paint_arrows,set_opacity)
{
  const env_size = {width: 20.0, height: 10.0};
  
  // Setup display for the example, a canas with svg overlayed.
  let div = d3.select(DOM.element("div"));
  div.style("position", "relative");
  
  let display = setup_display(env_size);
  div.append(() => display.canvas).style("position", "absolute");
  
  let gui = d3.select(DOM.svg(display.canvas.width, display.canvas.height));
  div.append(() => gui.node()).style("position", "absolute");
  
  div.style("width", `${display.canvas.width}px`).style("height", `${display.canvas.height}px`);
  
  
  // Setup an example cell and draw it on the canvas.
  let cell = circle_poly([env_size.width * 0.5, env_size.height * 0.5], env_size.width * 0.2, 20);
  
  // Use an example membrane point to illustrate the fixed force.
  let example_point = [env_size.width * (0.5 + 0.1), env_size.height * 0.5];
  
  
  let color = forces_options["lennard-jones"].color;
  
  function draw(){
    paint_cells(init_physics([cell]), display);
  
    // Compute the virtual points, and membrane to point lines.
    let virtual_points = [];
    let virtual_lines = [];
    let p0, p1 = cell[cell.length - 1];
    for (let i = 0; i < cell.length; ++i) {
      p0 = p1;
      p1 = cell[i];
      let virtual_point = point_outside_cell(p0, p1, example_point, cell);
      if (virtual_point !== example_point) {
        virtual_points.push(virtual_point);
        
        let mid_segment = add2d(p0, mul2d(sub2d(p1, p0), 0.5));
        virtual_lines.push([mid_segment[0], mid_segment[1], virtual_point[0], virtual_point[1]]); 
      }
    }
    
    
    // Draw the virutal points.
    const tau = 2 * Math.PI;
    let {context, xscale: x, yscale: y} = display;
    
    context.save();
    
    context.strokeStyle = color;
    
    for (let p of virtual_points) {
      let cx = x(p[0]), cy = y(p[1]);
      context.beginPath();
      context.moveTo(cx + 8, cy);
      context.arc(cx, cy, 8, 0, tau);
      context.stroke();
    }
    
    paint_arrows(virtual_lines, display, {stroke: color, fill: set_opacity(color, 0.5)});
  }
  
  
  let example_circle = gui.append("circle")
    .classed("example-point", true)
    .attr("cx", display.xscale(example_point[0]))
    .attr("cy", display.yscale(example_point[1]))
    .attr("r", 16)
    .attr("fill", d3.schemeCategory10[1])
    .attr("stroke-width", 2)
    .attr("stroke", color)
    .call(d3.drag().on("drag", dragged))
    .style("cursor", "move");
  
  function dragged(){
    let x = display.xscale.invert(d3.event.x);
    let y = display.yscale.invert(d3.event.y);
    
    example_point[0] = x;
    example_point[1] = y;
    
    example_circle
      .attr("cx", display.xscale(example_point[0]))
      .attr("cy", display.yscale(example_point[1]));
    
    draw();
  }
  
  draw();
  
  return div.node();
}
);
  main.variable(observer("point_outside_cell")).define("point_outside_cell", ["projected_distance","translate_poly_lines","d3","add2d","mul2d","unit_normal"], function(projected_distance,translate_poly_lines,d3,add2d,mul2d,unit_normal){return(
function point_outside_cell(r_i, r_j, r_o, ij_cell) {
  let epsilon_distance = 1e-6;
  
  // Test whether the point r_o is within the cell generating the potential.
  let distance_within_edge = projected_distance(r_i, r_j, r_o) + epsilon_distance;
  
  // If it's on the wrong side of the line, we need to do a more expensive
  // computation to determine if it's also on the inside of the cell.
  if (distance_within_edge > 0) {
    
    // Expand the cell by epsilon distance (think of it as the cell membrane thickness).
    let cell_and_thickness = translate_poly_lines(ij_cell, -epsilon_distance);
    if (d3.polygonContains(cell_and_thickness, r_o)) {
      
      // The point r_o is within the cell, which is a bit problematic. Fix the force
      // by pretending the point is just outside of the cell.
      
      r_o = add2d(r_o, mul2d(unit_normal(r_i, r_j), -distance_within_edge));
    }
  }
  
  return r_o;
}
)});
  main.variable(observer()).define(["md","n_points"], function(md,n_points){return(
md`### 2D Geometry

To set up the problem we need to perform the steps:
1. Generate Vornoi diagram given the intial cell positions.
2. Shrink the initial Voronoi polygons by a set distance.
3. Place ${n_points} points along the polygon perimeter.
`
)});
  main.variable(observer()).define(["md","example_n_points"], function(md,example_n_points){return(
md`#### Perimeter Points

We approximate cell membrane by placing ${example_n_points} points along the perimeter; trying to keep the
distance between them similar.`
)});
  main.variable(observer("viewof example_n_points")).define("viewof example_n_points", ["slider","n_points"], function(slider,n_points){return(
slider({
  min: 3,
  max: 200,
  value: n_points,
  step: 1,
  title: "Example Points on Membrane",
  description: "How many points to use to approximate the cell membrane.",
})
)});
  main.variable(observer("example_n_points")).define("example_n_points", ["Generators", "viewof example_n_points"], (G, _) => G.input(_));
  main.variable(observer()).define(["perimeter_points","example_poly","example_n_points","paint_cells","init_physics"], function(perimeter_points,example_poly,example_n_points,paint_cells,init_physics)
{
  let perimeter_poly = perimeter_points(example_poly, example_n_points);
  
  return paint_cells(init_physics([perimeter_poly]));
}
);
  main.variable(observer("perimeter_points")).define("perimeter_points", ["d3","distance","mul2d","sub2d","add2d"], function(d3,distance,mul2d,sub2d,add2d){return(
function perimeter_points(polygon, n) {
  let n_left = n;
  let perimeter_left = d3.polygonLength(polygon);
  
  let new_poly = [];
  new_poly.data = polygon.data;
  
  let p0, p1 = polygon[polygon.length - 1];
  for (let i = 0; i < polygon.length && n_left; ++i) {
    p0 = p1;
    p1 = polygon[i];
    
    let length = distance(p0, p1);
    
    let line_n = Math.round(n_left * length / perimeter_left);
    
    let line_direction = mul2d(sub2d(p1, p0), 1.0 / length);
    
    for (let j = 0; j < line_n; ++j) {
      new_poly.push(
        add2d(
          p0, 
          mul2d(line_direction, j * length / line_n)));
    }
    n_left -= line_n;
    perimeter_left -= length;
  }
  
  return new_poly;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`#### Polygon Shrinking

To shrink a Voronoy polygon we can translate all edges towards the center. 
However if we move the edges too much, we can end up with a non-convex polygon.
To fix it we have to remove all points outside the convex subset of the polygon.

To see this use the slider below to shrink an example polygon. Whilst shrinking
some patches turn inside out. The orange patch represents the convex subset which
contains the center.`
)});
  main.variable(observer("viewof example_distance")).define("viewof example_distance", ["slider"], function(slider){return(
slider({
  min: 0,
  max: 1.5,
  value: 1.2,
  precision: 2,
  title: "Example Cell Shrinking",
  description: "How much to shrink each cell from its initial Voronoi tesselation.",
})
)});
  main.variable(observer("example_distance")).define("example_distance", ["Generators", "viewof example_distance"], (G, _) => G.input(_));
  main.variable(observer()).define(["paint_cells","init_physics","translate_poly_lines","example_poly","example_distance","shrink_poly"], function(paint_cells,init_physics,translate_poly_lines,example_poly,example_distance,shrink_poly){return(
paint_cells(init_physics([
  translate_poly_lines(example_poly, example_distance),
  shrink_poly(example_poly, example_distance),
]))
)});
  main.variable(observer("example_poly")).define("example_poly", function()
{
  let poly = [
    [2.0, 2.0],
    [2.0, 8.0],
    [2.2, 8.3],
    [3.0, 8.0],
    [8.0, 2.0],
  ];
  poly.data = [4.0, 4.0];
  return poly;
}
);
  main.variable(observer("shrink_poly")).define("shrink_poly", ["convex_subset","translate_poly_lines"], function(convex_subset,translate_poly_lines){return(
function shrink_poly(polygon, distance) {
  return convex_subset(translate_poly_lines(polygon, distance));
}
)});
  main.variable(observer("convex_subset")).define("convex_subset", ["signed_projected_distance","line_intersection"], function(signed_projected_distance,line_intersection){return(
function convex_subset(polygon) {
  // All triangles are convex.
  if (polygon.length <= 3) return polygon;

  let center = polygon.data;

  // When a line goes outside the convex subset of the vornoi cell it flips
  // direction. Then its normal points opposite the center and the distance
  // turns negative. The convex polygon shouldn't include these lines.
  function is_good(a, b) {
    return signed_projected_distance(a, b, center) >= 0;
  };
  
  let good_edges = [];
  let any_bad = false;
  
  let p0, p1 = polygon[polygon.length - 1];
  
  for (let i = 0; i < polygon.length; ++i) {
    // Advance the current line using the 2 neighbouring points on the polygon.
    p0 = p1;
    p1 = polygon[i];

    if (is_good(p0, p1)) {
      good_edges.push([p0, p1]);
    } else {
      any_bad = true;
    }
  }

  
  // Now walk the good edges and compute the points of the polygon.
  let new_poly = [];
  new_poly.data = center;

  let e0, e1 = good_edges[good_edges.length - 1];
  
  for (let i = 0; i < good_edges.length; ++i) {
    e0 = e1;
    e1 = good_edges[i];
    new_poly.push(line_intersection(e0[0], e0[1], e1[0], e1[1]));
  }

  // If any edge was bad, we might've created another bad edge when computing
  // the new polygon, repeat until all edges are good.
  return any_bad ? convex_subset(new_poly) : new_poly;
}
)});
  main.variable(observer("translate_poly_lines")).define("translate_poly_lines", ["mul2d","unit_normal","add2d","line_intersection"], function(mul2d,unit_normal,add2d,line_intersection){return(
function translate_poly_lines(polygon, distance) {
  let shrunk_poly = [];
  shrunk_poly.data = polygon.data;
  
  let n = polygon.length;
  
  for (
    let left_i = n-1, i = 0, right_i = 1; 
    i < polygon.length; 
    ++i, left_i = (left_i+1)%n, right_i = (right_i+1)%n) {
    // For each 3 neighbouring points on the polygon.
    let p0 = polygon[left_i];
    let p1 = polygon[i];
    let p2 = polygon[right_i];
    
    // Compute the 2 normals towards the center with `distance` length.
    let n1 = mul2d(unit_normal(p0, p1), distance);
    let n2 = mul2d(unit_normal(p1, p2), distance);
    
    // Shift the lines of the polygon towards the center using the normals.
    let s1 = add2d(p0, n1);
    let s2 = add2d(p1, n1);
    let s3 = add2d(p1, n2);
    let s4 = add2d(p2, n2);
    
    // Get the point of intersection of these lines.
    let p = line_intersection(s1, s2, s3, s4);
    
    // This is on the new polygon.
    shrunk_poly.push(p);
  }
  
  return shrunk_poly;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## References

Cell Literature:
1. [Motility-Driven Glass and Jamming Transitions in Biological Tissues](https://journals.aps.org/prx/abstract/10.1103/PhysRevX.6.021011)
2. [Jamming of Deformable Polygons](https://arxiv.org/abs/1801.06150)

Tools:
* https://beta.observablehq.com
* https://github.com/d3/d3-voronoi
* https://github.com/d3/d3-quadtree
* https://github.com/d3/d3-delaunay#voronoi_index
* https://beta.observablehq.com/@jashkenas/inputs
* https://bl.ocks.org/mbostock/19168c663618b7f07158

Explanatory:
* https://beta.observablehq.com/@mbostock/to-infinity-and-back-again
* https://beta.observablehq.com/@mbostock/sutherland-hodgman-clipping
* https://gafferongames.com/post/integration_basics/
* https://bl.ocks.org/mbostock/4343214

Wikipedia:
* https://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
* https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
* https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
* https://en.wikipedia.org/wiki/Leapfrog_integration
* https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods
* https://en.wikipedia.org/wiki/Lennard-Jones_potential
* https://en.wikipedia.org/wiki/Periodic_boundary_conditions
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Appendix`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Geometric Functions`
)});
  main.variable(observer("circle_poly")).define("circle_poly", function(){return(
function circle_poly([x, y], radius, n) {
  let poly = [];
  poly.data = [x, y];
  
  for (let i = 0; i < n; ++i) {
    // Negative because we need to make a clockwise polygon; as that's the 
    // convention that d3 uses.
    let angle = - (2 * Math.PI * i / n);
    
    poly.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return poly;
}
)});
  main.variable(observer("magnitude")).define("magnitude", function(){return(
function magnitude(p) {
  return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
}
)});
  main.variable(observer("square_magnitude")).define("square_magnitude", function(){return(
function square_magnitude(p) {
  return p[0]**2 + p[1]**2;
}
)});
  main.variable(observer("distance")).define("distance", function(){return(
function distance(p1, p2) {
  return Math.sqrt( (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 );
}
)});
  main.variable(observer("square_distance")).define("square_distance", function(){return(
function square_distance(p1, p2) {
  return (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2;
}
)});
  main.variable(observer("projected_distance")).define("projected_distance", ["signed_projected_distance"], function(signed_projected_distance){return(
function projected_distance(p1, p2, o) {
  return Math.abs(signed_projected_distance(p1, p2, o));
}
)});
  main.variable(observer("signed_projected_distance")).define("signed_projected_distance", ["distance"], function(distance){return(
function signed_projected_distance(p1, p2, o) {
  // Copied from: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
  return ( (p2[1]-p1[1])*o[0] - (p2[0]-p1[0])*o[1] + p2[0]*p1[1] - p2[1]*p1[0] ) / distance(p1, p2);
}
)});
  main.variable(observer("is_clockwise")).define("is_clockwise", function(){return(
function is_clockwise([x0, y0], [x1, y1], [x2, y2]) {
  return (x1 - x0) * (y2 - y0) < (y1 - y0) * (x2 - x0);
}
)});
  main.variable(observer("unit")).define("unit", ["sub2d","inplace_mul2d","magnitude"], function(sub2d,inplace_mul2d,magnitude){return(
function unit(p1, p2) {
  let v = sub2d(p2, p1);
  return inplace_mul2d(v, 1.0 / magnitude(v));
}
)});
  main.variable(observer("unit_normal")).define("unit_normal", function(){return(
function unit_normal(p1, p2) {
  let dx = p2[0] - p1[0];
  let dy = p2[1] - p1[1];
  
  // let m = magnitude([dx, dy]);
  
  // Avoid creating a temporary array.
  let m = Math.sqrt(dx*dx + dy*dy);
  
  // Applying a pi/2 rotation.
  return [dy / m, -dx / m]; 
}
)});
  main.variable(observer("add2d")).define("add2d", function(){return(
function add2d(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]];
}
)});
  main.variable(observer("inplace_add2d")).define("inplace_add2d", function(){return(
function inplace_add2d(p1, p2) {
  p1[0] += p2[0];
  p1[1] += p2[1];
}
)});
  main.variable(observer("sub2d")).define("sub2d", function(){return(
function sub2d(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
}
)});
  main.variable(observer("inplace_sub2d")).define("inplace_sub2d", function(){return(
function inplace_sub2d(p1, p2) {
  p1[0] -= p2[0];
  p1[1] -= p2[1];
}
)});
  main.variable(observer("mul2d")).define("mul2d", function(){return(
function mul2d(p, a) {
  return [p[0]*a, p[1]*a];
}
)});
  main.variable(observer("inplace_mul2d")).define("inplace_mul2d", function(){return(
function inplace_mul2d(p, a) {
  p[0] *= a;
  p[1] *= a;
  return p;
}
)});
  main.variable(observer("dot2d")).define("dot2d", function(){return(
function dot2d(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1];
}
)});
  main.variable(observer("line_intersection")).define("line_intersection", function(){return(
function line_intersection([x1, y1], [x2, y2], [x3, y3], [x4, y4]) {
  // Snipped from: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  return [
    ( (x1*y2 - y1*x2) * (x3-x4) - (x1-x2) * (x3*y4 - y3*x4) ) / denom,
    ( (x1*y2 - y1*x2) * (y3-y4) - (y1-y2) * (x3*y4 - y3*x4) ) / denom,
  ];
}
)});
  main.variable(observer("point_average")).define("point_average", function(){return(
function point_average(points) {
  if (points.length === 0) return null;
  let x_sum = 0.0;
  let y_sum = 0.0;
  for (let p of points) {
    x_sum += p[0];
    y_sum += p[1];
  }
  return [x_sum / points.length, y_sum / points.length];
}
)});
  main.variable(observer("closest_point_on_segment")).define("closest_point_on_segment", ["sub2d","dot2d","square_magnitude","add2d","mul2d"], function(sub2d,dot2d,square_magnitude,add2d,mul2d){return(
function closest_point_on_segment(a, b, p) {
  // Compute the closest point on the segment `ab` from the point `p`.
  
  // Get the vector ab.
  let ab = sub2d(b, a);
  // And ap.
  let ap = sub2d(p, a);
  
  // Find out the fraction `k` where the projection of p lines on the segment ab.
  let k = dot2d(ab, ap) / square_magnitude(ab);
  
  // If `k` is greater than 1 then it's b is closest, if less than 0 than a is closest.
  if (k < 0.0) return a;
  if (k > 1.0) return b;
  
  // Otherwise it's `k` fraction of `ab` relative to `a`.
  return add2d(a, mul2d(ab, k));
}
)});
  main.variable(observer("rot2d")).define("rot2d", function(){return(
function rot2d(v, θ) {
  let cosθ = Math.cos(θ);
  let sinθ = Math.sin(θ);
  
  return [
    v[0] * cosθ - v[1] * sinθ,
    v[0] * sinθ + v[1] * cosθ,
  ];
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Display Functions`
)});
  main.variable(observer("viewof details_to_show")).define("viewof details_to_show", ["checkbox"], function(checkbox){return(
checkbox({
  title: "Details",
  description: "Detail options to show.",
  options: [
    {value: "fps", label: "Frames per Second"},
    {value: "axes", label: "Axis Lines"},
    {value: "compression", label: "Compression Factor"},
    {value: "polarization", label: "Polarization Factor"},
  ],
  value: ["compression", "polarization"],
})
)});
  main.variable(observer("details_to_show")).define("details_to_show", ["Generators", "viewof details_to_show"], (G, _) => G.input(_));
  main.variable(observer("run_loop")).define("run_loop", function(){return(
function run_loop({setup, update}) {
  // Run the async `update` function in a loop. Update receives the `state` as output 
  // by `setup` and running details like `fps`. It should return the new state.

  let running;
  let state;
  let frame;
  
  function run() {
    // Initialize the state.
    state = setup();
    
    running = true;

    // Keep track of how an exponential average of ticks and time passed for ticks/second.
    let exp_decay_tick = 0.0;
    let exp_decay_time = 0.0;
    let exp_decay_alpha = 0.95;
    let last_frame_time = performance.now();

    // Manually run the loop using requestAnimationFrame and observablehq's visibility promise. 
    async function tick(frame_time) {
      if (!running) return;

      // Track ticks/second.
      let frame_time_passed = Math.max((frame_time - last_frame_time) * 0.001, 1e-9);
      last_frame_time = frame_time;
      exp_decay_time *= exp_decay_alpha;
      exp_decay_tick *= exp_decay_alpha;
      exp_decay_time += frame_time_passed;
      exp_decay_tick += 1;
      
      let fps = exp_decay_tick / exp_decay_time;
      
      state = await update(state, {fps});
      
      // Stop if null state.
      if (!state) return;
      
      // Schedule the next tick at the next frame draw.
      frame = window.requestAnimationFrame(tick);
    }
    
    // Start ticking, from `frame_time = now`.
    tick(performance.now());
  }
  
  function stop() {
    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
      frame = undefined;
    }
    running = false;
  }
  
  function reset() {
    stop();
    run();
  }
  
  function set(func) {
    state = func(state);
  }
  
  function get() {
    return state;
  }
  
  run();
  
  return {stop, reset, set, get};
}
)});
  main.variable(observer("stroke_fill_arrow")).define("stroke_fill_arrow", function(){return(
function stroke_fill_arrow(context, [x0, y0, x1, y1]) {
  // Draw all lines first.
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.stroke();

  // Now draw all the end arrow bits.
  context.save();
  context.translate(x1, y1);

  context.rotate(Math.atan2(y1-y0, x1-x0));
  context.beginPath();

  context.moveTo(0, 0);

  context.lineTo(-2, 2);
  context.lineTo(4, 0);
  context.lineTo(-2, -2);

  context.closePath();
  context.stroke();
  context.fill();

  context.restore();
}
)});
  main.variable(observer("paint_arrows")).define("paint_arrows", ["stroke_fill_arrow"], function(stroke_fill_arrow){return(
function paint_arrows(arrows, display, {stroke="black", fill="black"}={}) {
  const {context, canvas, xscale: x, yscale: y} = display;
  
  context.save();
  
  context.strokeStyle = stroke;
  context.fillStyle = fill;
  context.lineWidth = 1.5;
  
  let arrow_coords = arrows.map(([x0, y0, x1, y1]) => [x(x0), y(y0), x(x1), y(y1)]);
  
  // Draw all lines first.
  for (let arrow of arrow_coords) {
    stroke_fill_arrow(context, arrow);
  }
  
  context.restore();
}
)});
  main.variable(observer("paint_forces")).define("paint_forces", ["forces_options","paint_arrows","set_opacity"], function(forces_options,paint_arrows,set_opacity){return(
function paint_forces(cells, forces_to_show, display) {

  let equiv_duration = 8;
  let strength = equiv_duration**2 / 2;
  
  // Create an array of arrows to show for each force.
  let force_arrows = new Map();
  for (let f of forces_to_show) force_arrows.set(f, []);
  
  // For all cells...
  for (let cell of cells) {
    // For all points on the cell...
    for (let i = 0; i < cell.length; ++i) {
      let [x, y] = cell[i];
      // For all forces on each point on the cell...
      for (let {kind, force: [fx, fy]} of cell.f[i]) {
        let arrows = force_arrows.get(kind);
        if (arrows === undefined) continue;
        // Add an arrow from the point to the direction the force is moving it in.
        arrows.push([x, y, x + fx * strength, y + fy * strength]);
      }
    }
    
    // Do the same for the nucleus forces.
    let [x, y] = cell.data;

    for (let {kind, force: [fx, fy]} of cell.data_f) {
      let arrows = force_arrows.get(kind);
      if (arrows === undefined) continue;
      arrows.push([x, y, x + fx * strength, y + fy * strength]);
    }
  }
  
  // Paint them on the canvas.
  for (let [force, arrows] of force_arrows) {
    let color = forces_options[force].color;
    paint_arrows(arrows, display, {stroke: color, fill: set_opacity(color, 0.5)});
  }
}
)});
  main.variable(observer("paint_details")).define("paint_details", ["pretty_float","details_to_show","set_opacity","paint_axes"], function(pretty_float,details_to_show,set_opacity,paint_axes){return(
function paint_details({time, fps, compression=undefined, polarization=undefined, transform=undefined}, display) {
  let {canvas, context, xscale, yscale} = display;
  
  let [left, right] = xscale.range();
  let [bottom, top] = yscale.range();
  
  const font_size = 14;
  
  let lines = [`time = ${pretty_float(time)}s`];
  if (compression !== undefined && details_to_show.some(o => o === "compression")) lines.push(`compression = ${pretty_float(compression)}`);
  if (polarization !== undefined && details_to_show.some(o => o === "polarization")) lines.push(`polarization = ${pretty_float(polarization)}`);
  if (details_to_show.some(o => o === "fps")) lines.push(`fps = ${pretty_float(fps)}`);
  
  context.save();
  context.font = `italic ${font_size}px sans-serif`;
  context.textAlign = "right";
  context.textBaseline = "hanging";
  
  let text_width = 0.0;
  for (let line of lines) text_width = Math.max(context.measureText(line).width, text_width);
  let text_height = lines.length * font_size;
  
  context.fillStyle = set_opacity("white", 0.6);
  context.fillRect(
    right - text_width - 8,
    top,
    text_width + 8,
    text_height + 8,
  );
  
  context.fillStyle = "black";
  for (let i = 0; i < lines.length; ++i) {
    context.fillText(lines[i], right - 4, top + 4 + i*(font_size+1));
  }
  
  context.restore();
  
  if (details_to_show.some(o => o === "axes")) paint_axes(display, transform);
}
)});
  main.variable(observer("paint_axes")).define("paint_axes", ["d3"], function(d3){return(
function paint_axes(display, transform={x: 0, y: 0, k: 1}) {
  const {context, canvas, xscale: original_x, yscale: original_y} = display;

  // To apply zoom we scale the canvas, but when drawing the drawing the grid
  // we want keep the original scale (so the text doesn't zoom in for no reason).
  
  // We need to find where the initial range is in view now.
  function undo_transform(x, offset, scale) {
    return (x - offset) / scale;
  }
  
  let view_xrange = [
    undo_transform(original_x.range()[0], transform.x, transform.k),
    undo_transform(original_x.range()[1], transform.x, transform.k),
  ];
  
  let view_yrange = [
    undo_transform(original_y.range()[0], transform.y, transform.k),
    undo_transform(original_y.range()[1], transform.y, transform.k),
  ];
  
  // Resize the axis so it shows everything in view.
  let x = d3.scaleLinear()
    .domain([original_x.invert(view_xrange[0]), original_x.invert(view_xrange[1])])
    .range(original_x.range());
  
  let y = d3.scaleLinear()
    .domain([original_y.invert(view_yrange[0]), original_y.invert(view_yrange[1])])
    .range(original_y.range());
  
  
  const [left, right] = original_x.range();
  const [bottom, top] = original_y.range();
  
  context.save();
  yAxis();
  xAxis();
  context.restore();
  
  // Snipped from: https://bl.ocks.org/mbostock/1550e57e12e73b86ad9e
  
  function yAxis() {
    var tickCount = 10,
        tickSize = 6,
        tickPadding = 3,
        ticks = y.ticks(tickCount),
        tickFormat = y.tickFormat(tickCount);

    context.beginPath();
    ticks.forEach(function(d) {
      context.moveTo(left, y(d));
      context.lineTo(left-6, y(d));
    });
    context.strokeStyle = "black";
    context.stroke();

    context.save();
    context.beginPath();
    context.moveTo(left-tickSize, top);
    context.lineTo(left, top);
    context.lineTo(left, bottom);
    context.lineTo(left-tickSize, bottom);
    context.strokeStyle = "black";
    context.lineWidth = 0.5;
    context.stroke();
    context.restore();

    context.textAlign = "right";
    context.textBaseline = "middle";
    ticks.forEach(function(d) {
      context.fillText(tickFormat(d), left - tickSize - tickPadding, y(d));
    });

    context.save();
    context.translate(left+10, top+10);
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "bold 10px sans-serif";
    context.fillText("μm", 0, 0);
    context.restore();
  }
  
  function xAxis() {
    var tickCount = 10,
        tickSize = 6,
        ticks = x.ticks(tickCount),
        tickFormat = x.tickFormat();

    context.beginPath();
    ticks.forEach(function(d) {
      context.moveTo(x(d), bottom);
      context.lineTo(x(d), bottom + tickSize);
    });
    context.strokeStyle = "black";
    context.stroke();
    
    context.save();
    context.beginPath();
    context.moveTo(left, bottom+tickSize);
    context.lineTo(left, bottom);
    context.lineTo(right, bottom);
    context.lineTo(right, bottom+tickSize);
    context.strokeStyle = "black";
    context.lineWidth = 0.5;
    context.stroke();
    context.restore();

    context.textAlign = "center";
    context.textBaseline = "top";
    ticks.forEach(function(d) {
      context.fillText(tickFormat(d), x(d), bottom + tickSize);
    });
    
    context.save();
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.font = "bold 10px sans-serif";
    context.fillText("μm", right-10, bottom-10);
    context.restore();
  }
}
)});
  main.variable(observer("paint_polarization")).define("paint_polarization", ["set_opacity","unit","distance","mul2d","stroke_fill_arrow"], function(set_opacity,unit,distance,mul2d,stroke_fill_arrow){return(
function paint_polarization(cells, polarization_factor, display) {
  let {context, xscale: x, yscale: y} = display;
  
  if (!polarization_factor) return;
  
  context.save();
  
  cells.forEach((cell, i) => {
    // If the cells have an index assigned, set it to that.
    if (cell.i !== undefined) i = cell.i;
    
    let color = cell.color;
    
    let edge_color = set_opacity(color, 1.0);
    let inner_color = set_opacity(color, 0.5);
    
    // Draw the polarization direction.
    if (cell.pole !== undefined) {
      context.fillStyle = inner_color;
      context.strokeStyle = edge_color;
      context.lineWidth = 1.5;
      
      let pole_dir = unit(cell.data, cell[cell.pole]);
      let pole_size = distance(cell.data, cell[cell.pole]) * polarization_factor;
      let pole_vec = mul2d(pole_dir, pole_size);
      let pole_arrow = [
        x(cell.data[0]), y(cell.data[1]), 
        x(cell.data[0] + pole_vec[0]), y(cell.data[1] + pole_vec[1]),
      ];
      
      stroke_fill_arrow(context, pole_arrow);
    }
  });
  
  context.restore();
}
)});
  main.variable(observer("paint_actins")).define("paint_actins", ["set_opacity"], function(set_opacity){return(
function paint_actins(cells, n_actins, display) {
  let {context, xscale: x, yscale: y} = display;

  context.save();
  
  cells.forEach((cell, i) => {
    // If the cells have an index assigned, set it to that.
    if (cell.i !== undefined) i = cell.i;
    
    let color = cell.color;
    
    let edge_color = set_opacity(color, 0.3);

    // Skip this many membrane points so we only draw n_actins.
    let skip = Math.floor(cell.length / n_actins);
    
    context.strokeStyle = edge_color;
    context.lineWidth = 1.0;

    context.beginPath();
    
    for (let j = i % skip; j < cell.length; j += skip)
    {

      context.moveTo(x(cell.data[0]), y(cell.data[1]));
      context.lineTo(x(cell[j][0]), y(cell[j][1]));
    }
    
    context.closePath();
    context.stroke();
  });
  
  context.restore();
}
)});
  main.variable(observer("paint_cells")).define("paint_cells", ["setup_display","set_opacity"], function(setup_display,set_opacity){return(
function paint_cells(cells, display={}) {
  // Setup default context if not given.
  if (display.context === undefined) display = setup_display(display);
  const {context, canvas, xscale: x, yscale: y} = display;
  
  context.save();
  
  // Clear
  context.fillStyle = "white";
  context.fillRect(0.0, 0.0, canvas.width, canvas.height);
  
  // Constants
  const tau = 2 * Math.PI;
  
  cells.forEach((cell, i) => {
    
    // If the cells have an index assigned, set it to that.
    if (cell.i !== undefined) i = cell.i;
    
    // Check whether the cell is an boundary image of a real cell or an original.
    let is_original = cell.original_i === undefined;
    let color = is_original ? cell.color : cell.original.color;
    
    let edge_color = set_opacity('black', is_original ? 1.0 : 0.5);
    let point_color = set_opacity(color, is_original ? 1.0 : 0.5);
   // let inner_color = set_opacity(color, is_original ? 0.5 : 0.2);
    let inner_color = set_opacity(color, is_original ? 0.8: 0.4);
    // Draw the polygon outline and fill.
    context.strokeStyle = edge_color;
    context.fillStyle = inner_color;
    
    context.beginPath();
    context.moveTo(x(cell[0][0]), y(cell[0][1]));
    for (let p_i = 1; p_i < cell.length; ++p_i) {
      context.lineTo(x(cell[p_i][0]), y(cell[p_i][1]));
    }
    context.closePath();
    context.fill();
    context.stroke();
    
    // Draw the circles on the polygon points.
    context.fillStyle = point_color;
    context.beginPath();
    for (let p of cell) {
      let cx = x(p[0]), cy = y(p[1]);
      context.moveTo(cx + 2, cy);
      context.arc(cx, cy, 2, 0, tau);
    }

    // ... and the center.
    let cx = x(cell.data[0]), cy = y(cell.data[1]);
    context.moveTo(cx + 4, cy);
    context.arc(cx, cy, 4, 0, tau);
    
    context.fill();
  });
  
  context.restore();
  
  return canvas;
}
)});
  main.variable(observer("setup_display")).define("setup_display", ["width","DOM","d3"], function(width,DOM,d3){return(
function setup_display(size={}, options={}) {
  const {width: env_width = 20.0, height: env_height = 10.0} = size;
  const {margin=30, view_width=width*0.8} = options;
  
  const view_height = env_height * view_width / env_width;
  const context = DOM.context2d(view_width, view_height);
  
  const xscale = d3.scaleLinear().domain([0, env_width]).range([margin, view_width - margin]);
  const yscale = d3.scaleLinear().domain([0, env_height]).range([view_height - margin, margin]);
  
  return {canvas: context.canvas, context, xscale, yscale};
}
)});
  main.variable(observer("set_opacity")).define("set_opacity", ["d3"], function(d3){return(
function set_opacity(color, opacity=1.0) {
  let c = d3.color(color);
  c.opacity = opacity;
  return c.toString();
}
)});
  main.variable(observer("join_data")).define("join_data", function(){return(
function join_data({root, name, type, data, create, state, created_call}) {
  let data_join = root.selectAll(`${type}.${name}`).data(data);
  let created = data_join.enter().append(type).classed(name, true).each(create);
  if (created_call) created.call(created_call);
  let current = created.merge(data_join);
  data_join.exit().remove();
  current.each(state);
}
)});
  main.variable(observer("record_canvas")).define("record_canvas", function(){return(
function record_canvas(canvas, onerror) {
  const video_type = "webm"; // webm; mp4 doesn't seem to be suported
  const codec = "vp9";
  
  const options = {
    mimeType: `video/${video_type};codecs=${codec}`,
    videoBitsPerSecond: 8 * 1024**2, // x Mbps
  };
  
  let stream = canvas.captureStream(0);
  
  let recorded_blobs = [];
  
  let ok = true;

  let recorder;
  try {
    recorder = new window.MediaRecorder(stream, options);
  } catch (err) {
    onerror(`Failed to start media recorder: ${err}`);
    return null;
  }
  
  recorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) recorded_blobs.push(event.data);
  };
  
  recorder.onerror = event => {
    onerror(`Encountered error whilst recording: ${event.error}`);
    discard();
  };
  
  function discard() {
    if (recorder.state !== "inactive") {
      ok = false;
      recorder.stop();
    }
  }
  
  function complete(name) {
    recorder.stop();
    if (ok) {
      download(recorded_blobs, name);
    }
  }
  
  function start() {
    // Record chunks every 2 seconds.
    recorder.start(2000);
  }
  
  function save_frame(){
    stream.getVideoTracks()[0].requestFrame();
  }
  
  function download(webm_blobs, name) {
    // Create the data and an invisible link so we can set the name.
    let blob = new Blob(webm_blobs, {type: `video/${video_type}`});
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    
    a.style = "display: none";
    document.body.appendChild(a);
    
    a.href = url;
    a.download = `${name}.${video_type}`;
    a.click();
    
    // Cleanup the URL and the invisible link.
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  return {
    start, 
    save_frame,
    discard, 
    complete,
  };
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Misc`
)});
  main.variable(observer("forces_options")).define("forces_options", function(){return(
{
  "elastic": {color: "red"},
  "elastic-actin": {color: "crimson"},
  "damping": {color: "purple"},
  "damping-actin": {color: "rebeccapurple"},
  "osmosis": {color: "chocolate"},
  "lennard-jones": {color: "lime"},
  "stiffness": {color: "cadetblue"},
}
)});
  main.variable(observer("pretty_float")).define("pretty_float", function(){return(
function pretty_float(x, decimals=1, width=4) {
  return Number.parseFloat(x).toFixed(decimals).padStart(width);
}
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3")
)});
  const child1 = runtime.module(define1);
  main.import("checkbox", child1);
  main.import("slider", child1);
  main.import("radio", child1);
  main.import("button", child1);
  main.import("text", child1);
  main.variable(observer("poissonDiscSampler")).define("poissonDiscSampler", function(){return(
function poissonDiscSampler(width, height, radius, random) {
  var k = 30, // maximum number of samples before rejection
      radius2 = radius * radius,
      R = 3 * radius2,
      cellSize = radius * Math.SQRT1_2,
      gridWidth = Math.ceil(width / cellSize),
      gridHeight = Math.ceil(height / cellSize),
      grid = new Array(gridWidth * gridHeight),
      queue = [],
      queueSize = 0,
      sampleSize = 0;

  return function() {
    if (!sampleSize) return sample(random() * width, random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      var i = random() * queueSize | 0,
          s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (var j = 0; j < k; ++j) {
        var a = 2 * Math.PI * random(),
            r = Math.sqrt(random() * R + radius2),
            x = s[0] + r * Math.cos(a),
            y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x, y) {
    var i = x / cellSize | 0,
        j = y / cellSize | 0,
        i0 = Math.max(i - 2, 0),
        j0 = Math.max(j - 2, 0),
        i1 = Math.min(i + 3, gridWidth),
        j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      var o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        if (s = grid[o + i]) {
          var s,
              dx = s[0] - x,
              dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x, y) {
    var s = [x, y];
    queue.push(s);
    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}
)});
  return main;
}
