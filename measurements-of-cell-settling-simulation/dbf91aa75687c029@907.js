// https://observablehq.com/@spatac/cell-migration-simulation_version-3@907
import define1 from "./1455ca0594a10c61@1521.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Cell Migration Simulation_Version 3`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Initial Parameters
Using **μm** units for length.`
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
  main.variable(observer("viewof lenard_jones_strength")).define("viewof lenard_jones_strength", ["lennard_jones_distance","slider"], function(lennard_jones_distance,slider)
{
  const value = 3.0e-1 * lennard_jones_distance**2;
  
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
  main.variable(observer("lennard_jones_min_distance")).define("lennard_jones_min_distance", ["lennard_jones_distance"], function(lennard_jones_distance){return(
lennard_jones_distance * 0.4
)});
  main.variable(observer("lennard_jones_max_distance")).define("lennard_jones_max_distance", ["lennard_jones_distance"], function(lennard_jones_distance){return(
lennard_jones_distance * 1.3
)});
  main.variable(observer("tick_duration")).define("tick_duration", function()
{
  // Aim for `x` simulation seconds per real seconds.
  
  let x = 5;
  
  return x * (1.0 / 60.0);
}
);
  main.variable(observer("env_center_radius")).define("env_center_radius", function(){return(
10
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
  main.variable(observer("min_nucleus_separation")).define("min_nucleus_separation", ["lennard_jones_distance"], function(lennard_jones_distance){return(
2.0 * lennard_jones_distance
)});
  main.variable(observer("border")).define("border", ["min_nucleus_separation"], function(min_nucleus_separation){return(
{width: min_nucleus_separation, height: min_nucleus_separation}
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
md`## Important Step: Running the Simulation`
)});
  main.variable(observer()).define(["d3","DOM","setup_display","env_size","slider","equilibrium_area","polarization_factor","run_loop","init_physics","polarized_initial_cells","visibility","periodic_boundaries","lennard_jones_max_distance","paint_cells","paint_cell_cell_junctions","paint_polarization","paint_details","apply_membrane_forces","apply_membrane_stiffness","apply_nucleus_forces","apply_intercell_forces","apply_cell_cell_adhesion_forces","advance_physics","tick_duration","invalidation","record_canvas"], function(d3,DOM,setup_display,env_size,slider,equilibrium_area,polarization_factor,run_loop,init_physics,polarized_initial_cells,visibility,periodic_boundaries,lennard_jones_max_distance,paint_cells,paint_cell_cell_junctions,paint_polarization,paint_details,apply_membrane_forces,apply_membrane_stiffness,apply_nucleus_forces,apply_intercell_forces,apply_cell_cell_adhesion_forces,advance_physics,tick_duration,invalidation,record_canvas)
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
  
  function select_radio_value(radio, value) {
    radio.selectAll("input").each(function(){
      let self = d3.select(this);
      if (self.attr("value") === value) self.property("checked", true);
    });
    radio.node().onchange();
  }
  
  
  // Equilibrium Area
  // ----------------
  
  let compressed = 2.0;
  let uncompressed = 1.1;
  
  let compression_slider = div.append(() => slider({
    min: 0.5,
    max: 4.0,
    value: compressed,
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
    max: 5.0,
    value: polarized,
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
  
  // Reset Button
  // ------------
  let reset_form = div.append("form");
  let reset_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Restart");
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

      // Paint cells.
      paint_cells(all_cells, display);
      paint_cell_cell_junctions(cells, display);
      paint_polarization(cells, sim_polarization_factor, display);

      // Reset to no zoom.
      context.restore();

      // Paint info.
      paint_details({time, fps, compression, polarization: sim_polarization_factor}, display);

      
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
      apply_cell_cell_adhesion_forces(cells, all_cells);
      advance_physics(cells, tick_duration);
      time += tick_duration;
      
      
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
  
    function reset() {
    // Reset the state.
    loop.reset();
    
    // Stop recorder.
    if (recorder !== null) reset_recorder();
        
  }
  
  reset_button.on("click", reset);
      
  record_button.on("click", start_recording);
  
  return div.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`## Generating Cells`
)});
  main.variable(observer("viewof generate_cells")).define("viewof generate_cells", ["button"], function(button){return(
button({value: "Regenerate cells", description: "Compute a new set of random cell centers."})
)});
  main.variable(observer("generate_cells")).define("generate_cells", ["Generators", "viewof generate_cells"], (G, _) => G.input(_));
  main.variable(observer()).define(["paint_cells","init_physics","initial_cells","env_size"], function(paint_cells,init_physics,initial_cells,env_size){return(
paint_cells(init_physics(initial_cells), env_size)
)});
  main.variable(observer("generate_poison_disc_cell_centers")).define("generate_poison_disc_cell_centers", ["poissonDiscSampler"], function(poissonDiscSampler){return(
function generate_poison_disc_cell_centers({env_size, border, min_nucleus_separation, n_cells, random=Math.random}) {
  
  function generate_candidate() {
    // Poison Disk sampling takes a radius instead of number of cells. I'll approximate the radius such
    // that I get the approximate number of cells. For sampling with radius 1 the packing density is 0.6967, from:
    // https://mathoverflow.net/questions/238661/formula-for-density-of-maximal-poisson-disk-sampling-of-radius-1

    const packing_density = 0.6967;

    // Keep at least min separation from edges.
    let width = env_size.width - 2 * border.width;
    let height = env_size.height - 2 * border.height;

    let poisson_radius = Math.sqrt(width * height * packing_density / n_cells);

    let points = [];

    let sample = poissonDiscSampler(width, height, poisson_radius, random);

    while (true) {
      let s = sample();

      if (!s) return points;

      points.push([s[0]+border.width, s[1]+border.height]);
    }
  }
  
  
  const max_tries = 1000;
  
  // The poison disc sampler doesn't always get exactly the amount of points
  // we ask it. We'll sample a few times and pick the first good solution.
  for(let i = 0; i < max_tries; ++i) {
    let points = generate_candidate();
    // Accept if the number of points is within 5% relative to the request.
    if (Math.abs(points.length - n_cells) / n_cells < 0.05) return points;
  }
  
  throw `Couldn't generate the requested amount of cells after ${max_tries} tries.`; 
}
)});
  main.variable(observer("initial_cell_centers")).define("initial_cell_centers", ["generate_cells","generate_poison_disc_cell_centers","env_size","border","min_nucleus_separation","n_cells"], function(generate_cells,generate_poison_disc_cell_centers,env_size,border,min_nucleus_separation,n_cells)
{
  generate_cells;
  
  return generate_poison_disc_cell_centers({env_size, border, min_nucleus_separation, n_cells});
}
);
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
  main.variable(observer("initial_cells")).define("initial_cells", ["shrunk_cell_polygons","perimeter_points","n_points"], function(shrunk_cell_polygons,perimeter_points,n_points){return(
shrunk_cell_polygons.map(poly => perimeter_points(poly, n_points))
)});
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
md`## Physics`
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
    
    // Initialize cell-cell adhesion junctions with 0s.
    cell.ccj = Array.from(polygon, () => null);
    
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
  main.variable(observer("default_physics_options")).define("default_physics_options", function(){return(
{
  velocity_decay: 1e-3,
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
md`## Applying Force Functions`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Constants for Force Functions`
)});
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
  main.variable(observer("viewof stiffness_constant")).define("viewof stiffness_constant", ["slider"], function(slider)
{
  const value = 24.0e-2;
  
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
  main.variable(observer("viewof cell_cell_constant")).define("viewof cell_cell_constant", ["slider"], function(slider)
{
  const value = 48e-2;
  
  return slider({
    min: value * 0.2,
    max: value * 5.0,
    value: value,
    step: value * 0.2,
    precision: 3,
    title: " Cell-cell Adhesion Constant",
    description: "Maintaining cell-cell adhesion sites.",
  });
}
);
  main.variable(observer("cell_cell_constant")).define("cell_cell_constant", ["Generators", "viewof cell_cell_constant"], (G, _) => G.input(_));
  main.variable(observer("viewof polarization_factor")).define("viewof polarization_factor", ["slider"], function(slider)
{
  return slider({
    min: 0.1,
    max: 5,
    value: 1,
    step: 0.1,
    precision: 1,
    title: "Polarization Factor",
    description: "Increase in osmosis pressure on the leading edge; and decrease on the trailing edge.",    
  });
}
);
  main.variable(observer("polarization_factor")).define("polarization_factor", ["Generators", "viewof polarization_factor"], (G, _) => G.input(_));
  main.variable(observer("viewof polarization_angle")).define("viewof polarization_angle", ["slider"], function(slider)
{
  return slider({
    min: 0,
    max: 360,
    value: 90,
    step: 1,
    precision: 1,
    title: "Polarization Angle",
    description: "Angle of the polarization direction",    
  });
}
);
  main.variable(observer("polarization_angle")).define("polarization_angle", ["Generators", "viewof polarization_angle"], (G, _) => G.input(_));
  main.variable(observer("polarization_factor_constant")).define("polarization_factor_constant", ["polarization_factor"], function(polarization_factor){return(
polarization_factor / 10
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
  main.variable(observer()).define(["md"], function(md){return(
md`### Defining Force functions`
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
  main.variable(observer("osmosis_force")).define("osmosis_force", ["equilibrium_area","osmosis_constant","unit","n_points","inplace_mul2d"], function(equilibrium_area,osmosis_constant,unit,n_points,inplace_mul2d){return(
function osmosis_force(r_i, cell_center, a_m, a_0=equilibrium_area, k_a=osmosis_constant) {
  let n_i = unit(cell_center, r_i);
  let magnitude = - k_a * (a_m - a_0) / n_points;  
  return inplace_mul2d(n_i, magnitude);
}
)});
  main.variable(observer("polarization_force")).define("polarization_force", ["polarization_factor_constant","unit_normal","dot2d","inplace_mul2d"], function(polarization_factor_constant,unit_normal,dot2d,inplace_mul2d){return(
function polarization_force(r_i, r_k, polarization=null, k_pol=polarization_factor_constant) {
  let n_ik = unit_normal(r_i, r_k);
  let magnitude = k_pol;
  if (polarization) magnitude *= (1 + dot2d(polarization, n_ik));
  return inplace_mul2d(n_ik, magnitude);
  
  //if (direction != null) magnitude *= k_pol * (1 + dot2d(n_i, direction));  
}
)});
  main.variable(observer("apply_membrane_forces")).define("apply_membrane_forces", ["default_membrane_options","d3","unit","dir_point","polarization_angle","elastic_force","inplace_add2d","damping_force","osmosis_force","polarization_force","polarization_factor_constant"], function(default_membrane_options,d3,unit,dir_point,polarization_angle,elastic_force,inplace_add2d,damping_force,osmosis_force,polarization_force,polarization_factor_constant){return(
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
    let polarization = (!polarization_factor || c.pole === undefined || c.pole === 0) ? null :
    unit(c.data, dir_point(c.data,c.pole,polarization_angle));
    //mul2d(unit(c.data, vertical_point(c.data,c.pole)), polarization_factor);
    //mul2d(unit(c.data, c[c.pole]), polarization_factor);
      // it's used to be [0, (c.pole * polarization_factor)]; 

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
      let osmosis = osmosis_force(c[j], c.data, cell_area, equilibrium_area, osmosis_constant);
      inplace_add2d(c.a[j], osmosis);
      
      // Apply polarization force on i
      let pol_force = polarization_force(c[i], c[k], polarization, polarization_factor_constant);
      inplace_add2d(c.a[j], pol_force);
      
      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.f[j].push({kind: "elastic", force: elastic_0});
        c.f[j].push({kind: "elastic", force: elastic_1});
        
        c.f[j].push({kind: "damping", force: damping_0});
        c.f[j].push({kind: "damping", force: damping_1});
        
        c.f[j].push({kind: "osmosis", force: osmosis});
        
        c.f[j].push({kind: "pol_force", force: pol_force});
      }
    }
  }
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
  main.variable(observer("cell_cell_adhesion_force")).define("cell_cell_adhesion_force", ["cell_cell_constant","shrink_distance"], function(cell_cell_constant,shrink_distance){return(
function cell_cell_adhesion_force(p1, p2) {
  
  let k_cc = cell_cell_constant;
  let cc_0 = 2 * shrink_distance
  let dx = p2[0] - p1[0];
  let dy = p2[1] - p1[1];
  
  let l_12 = Math.sqrt(dx*dx + dy*dy);
  
  let f = - k_cc * (l_12 - cc_0);
  
  return [f * dx / l_12, f * dy / l_12];
}
)});
  main.variable(observer("apply_cell_cell_adhesion_forces")).define("apply_cell_cell_adhesion_forces", ["default_intercell_options","env_size","distance","equilibrium_diameter","closest_point_on_segment","cell_cell_adhesion_force","inplace_add2d"], function(default_intercell_options,env_size,distance,equilibrium_diameter,closest_point_on_segment,cell_cell_adhesion_force,inplace_add2d){return(
function apply_cell_cell_adhesion_forces(cells, interact_cells, options={}) {
  
  let {    
    store_forces,
  } = {...default_intercell_options, ...options};
  
  for (let cell of cells) {    
    for (let i = 0; i < cell.length; ++i) {
      let min_distance = env_size.width,
          min_projected_pt = null;
      for (let interact_cell of interact_cells) {
        let radii_distance = distance(cell.data, interact_cell.data);

        if (radii_distance > 0 && radii_distance < (2 * equilibrium_diameter)) {
          
          let r0, r1 = interact_cell[interact_cell.length - 1];
          for (let j = 0; j < interact_cell.length; ++j) {
            r0 = r1;
            r1 = interact_cell[j];
            let projected_point = closest_point_on_segment(r0, r1, cell[i]);
            let dist = distance(cell[i], projected_point);
            if (dist < min_distance) {
              min_distance = dist;
              min_projected_pt = projected_point;
            }
          }
        }
      }
      
      if (min_projected_pt != null && distance(min_projected_pt, cell[i]) < env_size.height / 2) {
        let adhesion_force = cell_cell_adhesion_force(min_projected_pt, cell[i]);
        inplace_add2d(cell.a[i], adhesion_force);
        cell.ccj[i] = min_projected_pt;
        if (store_forces) {
          cell.f[i].push({kind: "cc_adhesion", force: adhesion_force});
        }
      }
    }
  }
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
  main.variable(observer()).define(["md"], function(md){return(
md`## Runing the loop`
)});
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
  main.variable(observer()).define(["md"], function(md){return(
md`## Periodic Boundaries`
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
        
        //let image_cell = move_cell_to(make_cell_image(cell), image_center);
        
        image_cells.push(image_cell);
      }
    }
  }
  
  // Concatenate the original cells with the boundary images.
  return cells.concat(image_cells);
}
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
  main.variable(observer()).define(["md"], function(md){return(
md`## Plotting Cells`
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
    
    let edge_color = set_opacity("black", is_original ? 1.0 : 0.5);
    let point_color = set_opacity(color, is_original ? 1.0 : 0.5);
    let inner_color = set_opacity(color, is_original ? 0.6: 0.4);
    
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
  main.variable(observer("set_opacity")).define("set_opacity", ["d3"], function(d3){return(
function set_opacity(color, opacity=1.0) {
  let c = d3.color(color);
  c.opacity = opacity;
  return c.toString();
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
  main.variable(observer("paint_polarization")).define("paint_polarization", ["set_opacity","unit","dir_point","polarization_angle","distance","mul2d","stroke_fill_arrow"], function(set_opacity,unit,dir_point,polarization_angle,distance,mul2d,stroke_fill_arrow){return(
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
    if (cell.pole !== undefined || 0) {
      context.fillStyle = inner_color;
      context.strokeStyle = edge_color;
      context.lineWidth = 1.5;
      
      let pole_dir = unit(cell.data, dir_point(cell.data, cell.pole, polarization_angle));
      let pole_size = distance(cell.data, dir_point(cell.data, cell.pole, polarization_angle)) * polarization_factor;
      let pole_vec = mul2d(pole_dir, pole_size);
      
      //let pole_dir = unit(cell.data, cell[cell.pole]);
      //let pole_size = distance(cell.data, cell[cell.pole]) * polarization_factor;
      //let pole_vec = mul2d(pole_dir, pole_size);
      
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
  main.variable(observer("paint_cell_cell_junctions")).define("paint_cell_cell_junctions", ["set_opacity","distance","env_size"], function(set_opacity,distance,env_size){return(
function paint_cell_cell_junctions(cells, display) {
  let {context, xscale: x, yscale: y} = display;

  context.save();
  
  cells.forEach(cell => {
    // If the cells have an index assigned, set it to that.
    //if (cell.i !== undefined) i = cell.i;
    
    let color = cell.color;
    
    let edge_color = set_opacity(color, 0.3);

        
    context.strokeStyle = edge_color;
    context.lineWidth = 1.0;

    context.beginPath();
    
    for (let j = 0; j < cell.length; ++j)
    {
      
      if (cell.ccj[j] != null && distance(cell[j], cell.ccj[j]) < env_size.height / 2) {
        context.moveTo(x(cell[j][0]), y(cell[j][1]));
        context.lineTo(x(cell.ccj[j][0]), y(cell.ccj[j][1]));
      }
    }
    
    context.closePath();
    context.stroke();
  });
  
  context.restore();
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
  main.variable(observer("paint_details")).define("paint_details", ["pretty_float","details_to_show","set_opacity"], function(pretty_float,details_to_show,set_opacity){return(
function paint_details({time, fps, compression=undefined, polarization=undefined}, display) {
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
  
  //if (details_to_show.some(o => o === "axes")) paint_axes(display, transform);
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
  main.variable(observer()).define(["md"], function(md){return(
md`### Misc`
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
  main.variable(observer()).define(["md"], function(md){return(
md`## Appendix`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Geometric Functions`
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
  main.variable(observer("signed_projected_distance")).define("signed_projected_distance", ["distance"], function(distance){return(
function signed_projected_distance(p1, p2, o) {
  // Copied from: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
  return ( (p2[1]-p1[1])*o[0] - (p2[0]-p1[0])*o[1] + p2[0]*p1[1] - p2[1]*p1[0] ) / distance(p1, p2);
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
  main.variable(observer("projected_point_on_segment")).define("projected_point_on_segment", ["sub2d","dot2d","square_magnitude","add2d","mul2d"], function(sub2d,dot2d,square_magnitude,add2d,mul2d){return(
function projected_point_on_segment(a, b, p) {
  // Compute the closest point on the segment `ab` from the point `p`.
  
  // Get the vector ab.
  let ab = sub2d(b, a);
  // And ap.
  let ap = sub2d(p, a);
  
  // Find out the fraction `k` where the projection of p lines on the segment ab.
  let k = dot2d(ab, ap) / square_magnitude(ab);
  
  // If `k` is greater than 0 and less than 1, then it's `k` fraction of `ab` relative to `a`.
  if ((k >= 0.0) && (k <= 1.0)) {
    return add2d(a, mul2d(ab, k));
  } else {
    return null;
  }
}
)});
  main.variable(observer("modulo")).define("modulo", function(){return(
function modulo(x, d) {
  // Javascript's % handles signed values differently than mathy modulo.
  return (x % d + d) % d;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Polarized Initial Cells`
)});
  main.variable(observer("polarized_initial_cells")).define("polarized_initial_cells", ["generate_polarized_cells","initial_cells"], function(generate_polarized_cells,initial_cells)
{
  //generate_polarization;
  //return generate_random_polarization(initial_cells);
  return generate_polarized_cells(initial_cells);
}
);
  main.variable(observer("generate_random_polarization")).define("generate_random_polarization", function(){return(
function generate_random_polarization(cells, random=Math.random){
  return cells.map(cell => {
    // Clone the cell so we don't modify the original.
    let clone = cell.slice();
    clone.data = cell.data;
    clone.pole = Math.floor(0.5 * clone.length);
    return clone;
  });
}
)});
  main.variable(observer("generate_polarized_cells")).define("generate_polarized_cells", ["env_size","distance","env_center_radius","polarization_factor"], function(env_size,distance,env_center_radius,polarization_factor){return(
function generate_polarized_cells(cells){
  return cells.map(cell => {
    // Clone the cell so we don't modify the original.
    let clone = cell.slice();
    clone.data = cell.data;
    let env_center = [env_size.width / 2, env_size.height / 2];    
    let dist = distance(clone.data , env_center);
    if (dist < env_center_radius) {
      clone.pole = polarization_factor;    
    } else if (dist >= env_center_radius && dist < 2 * env_center_radius) {
      clone.pole = -polarization_factor;
    } else {
      clone.pole = 0;
    }      
    return clone
  });
  
}
)});
  main.variable(observer("dir_point")).define("dir_point", function(){return(
function dir_point (p,r,a) {
  return [p[0] + r * Math.cos(a/180*Math.PI), p[1] + r * Math.sin(a/180*Math.PI)];
}
)});
  return main;
}
