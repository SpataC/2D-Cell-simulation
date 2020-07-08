// https://observablehq.com/@spatac/measurements-of-cell-settling-simulation@5333
import define1 from "./58561c80f75d4ca4@3403.js";
import define2 from "./1455ca0594a10c61@1521.js";
import define3 from "./dbf91aa75687c029@907.js";
import define4 from "./576f8943dbfbd395@109.js";
import define5 from "./d45cf1f9eb9e7a5c@25.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Measurements of Cell Settling Simulation`
)});
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`## Setup environment

We will simulate a drop of cells surrounded by collagen fibers in an un-bounded 
environment. As a simplification we treat the collagen fibers as small fixed 
circles in our simulation. The intuition is that fibers in 3D would project as
circles in the 2D plane we are simulating.

To produce the inital conditions we follow the steps:
1. We generate cells as vornoi polygons that fill the environment rectangle.
2. Keep only the cells whose centers are inside a disc at the center.
3. Generate collagen points and keep those that don't intersect our cells.
4. Separate cell membranes by an ${tex`\epsilon`} distance to avoid infinte forces.
5. Assign a random polarization direction for each cell.
`
)});
  main.variable(observer("n_cells")).define("n_cells", function(){return(
340
)});
  main.variable(observer("n_points")).define("n_points", function(){return(
25
)});
  main.variable(observer("env_size")).define("env_size", ["n_cells","default_simulate_options"], function(n_cells,default_simulate_options)
{
  let ratio = 2.0;
  let env_area = n_cells * default_simulate_options.equilibrium_area;
  
  // To compute the environment size we want:
  // width * height == env_area;
  // width == height * ratio;

 let height = Math.sqrt(env_area / ratio);
 let width = height * ratio;
  
  return {width, height};
}
);
  main.variable(observer("circle_radius")).define("circle_radius", ["env_size"], function(env_size){return(
env_size.height/1.8
)});
  main.variable(observer("xscale")).define("xscale", function(){return(
1.0
)});
  main.variable(observer("default_initial_cells_options")).define("default_initial_cells_options", ["n_collagen_points"], function(n_collagen_points){return(
{
  cell_seed: 1, collagen_seed: 11, polar_seed: 13, n_collagen_points
}
)});
  main.variable(observer("generate_initial_cells_and_collagen")).define("generate_initial_cells_and_collagen", ["default_initial_cells_options","seedrandom","env_size","xscale","border","generate_poison_disc_cell_centers","min_nucleus_separation","n_cells","compute_voronoi_polygons","distance","circle_radius","generate_random_cell_centers","sub2d","inplace_add2d","make_collagen_circles","keep_nonoverlapping_polys","shrink_poly","shrink_distance","perimeter_points","n_points","generate_motility_angle"], function(default_initial_cells_options,seedrandom,env_size,xscale,border,generate_poison_disc_cell_centers,min_nucleus_separation,n_cells,compute_voronoi_polygons,distance,circle_radius,generate_random_cell_centers,sub2d,inplace_add2d,make_collagen_circles,keep_nonoverlapping_polys,shrink_poly,shrink_distance,perimeter_points,n_points,generate_motility_angle){return(
function generate_initial_cells_and_collagen(options={}) {
  let {
    cell_seed, 
    collagen_seed, 
    polar_seed,
    n_collagen_points,
  } = {...default_initial_cells_options, ...options};
  
  // Generate random cells using a fixed seed, and apply vornoi tesselation.
  let center_random = seedrandom(`${cell_seed}`);
  
  // TODO: maybe can pass a metric to the generator? Otherwise if we scale min 
  // distance by xscale, then they'll be much further apart on the y scale. But
  // we want to keep y scale constant...
  let scaled_env = {width: env_size.width * xscale, height: env_size.height};
  
  let scaled_border = {width: border.width * xscale, height: border.height};
  let cell_centers = generate_poison_disc_cell_centers({
    env_size: scaled_env, 
    border: scaled_border, 
    min_nucleus_separation,
    n_cells, 
    random: center_random,
  });
  let all_polygons = compute_voronoi_polygons({cell_centers, env_size: scaled_env});

  // Un-apply the scaling.
  for (let poly of all_polygons) {
    poly.data[0] /= xscale;
    for (let i = 0; i < poly.length; i++){
      // The polygons share vertex points so we need to modify a copy of each point.
      let p = poly[i].slice();
      poly[i] = [p[0] / xscale, p[1]];
    }
  }
  
  // Keep the cells within a disc at the center.
  let env_center = [env_size.width / 2, env_size.height / 2];
  let polygons = all_polygons.filter(poly => distance(poly.data, env_center) <= circle_radius);
  
  // Generate collagen points in an extended environment.
  let collagen_random = seedrandom(`${collagen_seed}`);
  let extended_env = {width: env_size.width * 2, height: env_size.height * 2};

  let collagen_points = generate_random_cell_centers({
    env_size: extended_env,
    border,
    min_nucleus_separation: 24.0, 
    n_cells: n_collagen_points, 
    random: collagen_random,
  });
  
  // We'll need offset the points in this environment so their centers coincide.
  let extended_env_center = [extended_env.width / 2, extended_env.height / 2];
  let extended_env_offset = sub2d(env_center, extended_env_center);
  for (let p of collagen_points) inplace_add2d(p, extended_env_offset);

  // Generate collagen polygons.
  let all_collagen = make_collagen_circles(collagen_points);
  
  // Keep only collagen circles that don't intersect cells.
  let collagen = keep_nonoverlapping_polys(all_collagen, polygons);
  
  
  // Separate cell polygons to prevent infinity forces.
  let shrunk_polygons = polygons.map(poly => shrink_poly(poly, shrink_distance));
  
  // Create cells from polygons.
  let initial_cells = shrunk_polygons.map(poly => perimeter_points(poly, n_points));
  
  // Assign polarization directions.
  let polarization_random = seedrandom(`${polar_seed}`);
  
  // let polarized_cells = generate_random_polarization(initial_cells, polarization_random);
  
  let polarized_cells = generate_motility_angle(initial_cells, polarization_random);
  
  
  return [polarized_cells, collagen];
}
)});
  main.variable(observer("default_simulate_options")).define("default_simulate_options", ["default_membrane_options","default_nucleus_options","default_intercell_options","default_motility_options","periodic_boundaries"], function(default_membrane_options,default_nucleus_options,default_intercell_options,default_motility_options,periodic_boundaries){return(
{
  ...default_membrane_options,
  ...default_nucleus_options,
  ...default_intercell_options,
  ...default_motility_options,
  nucleus_elastic_constant: 0.0005,
  nucleus_damping_constant: 0.58,
  velocity_decay:1e-2,
  lenard_jones_strength: 0.2,
  nucleus_equilibrium_distance: 6.72,
  relax_polarization_factor: 0.0,
  relax_compression: 1.5,
  press_compression: 1.1,
  boundary_function: periodic_boundaries,
  relative_color:false
 
  
}
)});
  main.variable(observer("fixed_boundaries")).define("fixed_boundaries", ["default_simulate_options","env_size","init_physics"], function(default_simulate_options,env_size,init_physics){return(
function fixed_boundaries(cells, max_interaction_distance){
  let d = default_simulate_options.lennard_jones_distance;
  let {width, height} = env_size;
  let left = [[-d,-d],[-d,(height+d)]];
  let top = [[-d,(height+d)],[(width+d), (height+d)]];
  let right =[ [(width+d),(height+d)], [(width+d),-d]];
  let bottom = [[(width+d),-d], [-d,-d]];
  left.data = [-d, height/2];
  top.data = [width/2, height+d];
  right.data = [width+d, height/2];
  bottom.data = [width/2, -d];
  
  let boundary_cells = init_physics([ bottom]);
   
  
  
  // Concatenate the original cells with the boundary images.
  return cells.concat(boundary_cells);
}
)});
  main.variable(observer("no_boundaries")).define("no_boundaries", function(){return(
function no_boundaries(cells, max_interaction_distance){
    
  
  return cells;
}
)});
  main.variable(observer("viewof motility_constant")).define("viewof motility_constant", ["slider"], function(slider)
{
  return slider({
    min: 0.00,
    max: 3.5,
    value: 0.20,
    precision: 2,
    title: "Motility constant",
    description: "How fast the cells move.",
  });
}
);
  main.variable(observer("motility_constant")).define("motility_constant", ["Generators", "viewof motility_constant"], (G, _) => G.input(_));
  main.variable(observer("viewof angular_noise")).define("viewof angular_noise", ["slider"], function(slider)
{
  return slider({
    min: 0.001,
    max: 0.5,
    value: 0.1,
    precision: 3,
    title: "Angular Noise",
    description: "Random difussion of the motility direction.",
  });
}
);
  main.variable(observer("angular_noise")).define("angular_noise", ["Generators", "viewof angular_noise"], (G, _) => G.input(_));
  main.variable(observer("default_motility_options")).define("default_motility_options", ["motility_constant","angular_noise"], function(motility_constant,angular_noise){return(
{
  motility_constant,
  angular_noise,
}
)});
  main.variable(observer("generate_motility_angle")).define("generate_motility_angle", function(){return(
function generate_motility_angle (cells, random) {
  for (let cell of cells) {
    cell.theta = random() * 2 * Math.PI;
  }
  return cells;
}
)});
  main.variable(observer("get_motility_vector")).define("get_motility_vector", ["unit","rot2d","mul2d"], function(unit,rot2d,mul2d){return(
function get_motility_vector(cell, motility_constant){
  let u = unit(cell.data, cell[0]);
  let v = rot2d(u, cell.theta);
  return mul2d(v, motility_constant);
}
)});
  main.variable(observer("advance_motility_angle")).define("advance_motility_angle", ["default_motility_options","randn_bm"], function(default_motility_options,randn_bm){return(
function advance_motility_angle(cells, tick_duration, options={}, random=Math.random) {
  let {angular_noise} = {...default_motility_options, ...options};
  
  for (let cell of cells) {
    cell.theta += randn_bm(random) * Math.sqrt(2 * angular_noise * tick_duration);
  }
}
)});
  main.variable(observer("apply_motility_force")).define("apply_motility_force", ["default_motility_options","get_motility_vector","mul2d","inplace_add2d"], function(default_motility_options,get_motility_vector,mul2d,inplace_add2d){return(
function apply_motility_force(cells, options={}){
  let {motility_constant} = {...default_motility_options, ...options};
  for (let cell of cells){
    let force = get_motility_vector(cell, motility_constant);
    let perpoint_force = mul2d(force, 1.0 / cell.length);
    
    for (let i = 0; i < cell.length; i++){
      inplace_add2d(cell.a[i], perpoint_force);
    }
  }
}
)});
  main.variable(observer("paint_motility_direction")).define("paint_motility_direction", ["set_opacity","get_motility_vector","stroke_fill_arrow"], function(set_opacity,get_motility_vector,stroke_fill_arrow){return(
function paint_motility_direction(cells, motility_constant, display) {
  let {context, xscale: x, yscale: y} = display;
  
  if (!motility_constant) return;
  
  context.save();
  
  cells.forEach((cell, i) => {
    // If the cells have an index assigned, set it to that.
    if (cell.i !== undefined) i = cell.i;
    
    let color = cell.color;
    
    let edge_color = set_opacity(color, 1.0);
    let inner_color = set_opacity(color, 0.5);
    
    // Draw the polarization direction.
    if (cell.theta !== undefined) {
      context.fillStyle = inner_color;
      context.strokeStyle = edge_color;
      context.lineWidth = 1.5;
      
      let motility_vector = get_motility_vector(cell, motility_constant);
      let motility_arrow = [
        x(cell.data[0]), y(cell.data[1]), 
        x(cell.data[0] + motility_vector[0]), y(cell.data[1] + motility_vector[1]),
      ];
      
      stroke_fill_arrow(context, motility_arrow);
    }
  });
  
  context.restore();
}
)});
  main.variable(observer("is_inside")).define("is_inside", function(){return(
function is_inside(point,polygon){
   let x = point[0], y = point[1];

    let is_inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        //let on_edge = isOnLine(xi,yi,xj,yj,x,y);
        if (intersect ){
          is_inside = !is_inside;
        }
    }
  return is_inside
}
)});
  main.variable(observer("n_collagen_points")).define("n_collagen_points", function(){return(
430
)});
  main.variable(observer("collagen_radius")).define("collagen_radius", function(){return(
7.0
)});
  main.variable(observer("make_collagen_circles")).define("make_collagen_circles", ["circle_poly","collagen_radius"], function(circle_poly,collagen_radius){return(
function make_collagen_circles(collagen_points, points=12){
  
  let collagen = collagen_points.map(p => circle_poly(p, collagen_radius , points));
  
  // Make em green.
  for (let c of collagen) c.color = "green";
  
  return collagen;
}
)});
  main.variable(observer("add_elastic_force")).define("add_elastic_force", ["d3","elastic_force","inplace_add2d"], function(d3,elastic_force,inplace_add2d){return(
function add_elastic_force(young_modulus,cells,equilibrium_distance, store_forces) {
   
  for (let c of cells) {
    let cell_area = d3.polygonArea(c);

    for (let i = 0; i < c.length; ++i) {
      let j = (i + 1) % c.length;
      let k = (i + 2) % c.length;
      
      // Apply elastic force on j from both neighbours.
      let elastic_0 = elastic_force(c[i], c[j], young_modulus, equilibrium_distance);
      let elastic_1 = elastic_force(c[k], c[j], young_modulus, equilibrium_distance);
      inplace_add2d(c.a[j], elastic_0);
      inplace_add2d(c.a[j], elastic_1);
      
     
      // For speed we don't store forces for each node by default.
      if (store_forces) {
        c.f[j].push({kind: "elastic", force: elastic_0});
        c.f[j].push({kind: "elastic", force: elastic_1});
        
      }
    }
 
  }
}
)});
  main.variable(observer("closest_neighbor")).define("closest_neighbor", function(){return(
function nearestNeighbor(i, cells) {
  const {points} = cells.data;
  let minDistance = Infinity;
  let minNeighbor;
  const x0 = points[i * 2];
  const y0 = points[i * 2 + 1];
  for (const neighbor of cells.neighbors(i)) {
    const x1 = points[neighbor * 2];
    const y1 = points[neighbor * 2 + 1];
    const distance = (x0 - x1) ** 2 + (y0 - y1) ** 2;
    if (distance < minDistance) {
      minDistance = distance;
      minNeighbor = neighbor;
    }
  }
  return minNeighbor;
}
)});
  main.variable(observer("take_over_collagen")).define("take_over_collagen", ["is_inside"], function(is_inside){return(
function take_over_collagen(p, cells){
  for (let i=0; i<p.length;i++){
    for (let cell of cells){
      if (is_inside(p[i].data,cell)){
        p[i].color = cell.color;
      }
    }
  }
}
)});
  main.variable(observer("nearest_neighbor_max_distance")).define("nearest_neighbor_max_distance", ["distance","d3"], function(distance,d3){return(
function nearest_neighbor_max_distance(nuclei) {
  let closest_neighbors_distance = [];
  for (let i=0;i<nuclei.length;i++) {
    let nucleus = nuclei[i];
    let min_distance = Infinity;
    for (let j=0;j<nuclei.length;j++){
      if (j != i){
        let other_nucleus = nuclei[j];
        let d = distance(nucleus,other_nucleus);
        if (d < min_distance) {
          min_distance = d;
        }
      }
      
    }
    closest_neighbors_distance.push(min_distance)
  }
  
  
  let max_distance = d3.quantile(closest_neighbors_distance, 0.9);
              
  return max_distance;
}
)});
  main.variable(observer("young_modulus")).define("young_modulus", function(){return(
0.25
)});
  main.variable(observer("cell_cell_constant")).define("cell_cell_constant", function(){return(
0.01
)});
  main.variable(observer("q")).define("q", function(){return(
3.75
)});
  main.variable(observer("viewof multi_simulation_results")).define("viewof multi_simulation_results", ["d3","DOM","md","no_boundaries","simulation_loop","compute_cell_circle_radius","compute_radial_distance"], function(d3,DOM,md,no_boundaries,simulation_loop,compute_cell_circle_radius,compute_radial_distance)
{  
  
 return null;
  
  let div = d3.select(DOM.element("div"));
  
  div.append(() => md`Simulating...`);
  
  (async()=>{
  
    let results = [];

    let fixed_options = {
      boundary_function: no_boundaries,
      polarization_factor : 0.0, 

      relative_color: true,
      velocity_decay: 1*1e-4,                            
      relax_compression: 1.0,
      press_compression: 1.0,

      lenard_jones_strength: 0.75,
      osmosis_constant: 0.001,
    };

    // for (let cs = 0; cs < 5; cs += 1) {
      // for (let ps = 0; ps < 1; ps += 1) {
    let cs = 24;
    let ps = 17;
        for (let mc = 1.06; mc <= 1.2; mc += 0.02) {
          for (let ncp = 0; ncp <= 250; ncp += 20) {

            let options = {
              ...fixed_options, 
              motility_constant: mc,
              n_collagen_points: ncp,
              collagen_seed: cs,
              polar_seed: ps,
            }

            // Run the simulation in the background and return the final result.
            let running = true;
            let result = undefined;

            function ondone(sim_result){
              result = sim_result;
              running = false;
            }

            let {setup, update} = simulation_loop(ondone, options);

            // Initialize the state.
            let state = setup();
            let tick = 0;

            // Manually run the loop using requestAnimationFrame and observablehq's visibility promise. 
            while(running){
              // Track ticks/second.
              state = await update(state, {fps: 0.0});
              tick += 1;

              // Stop if null state.
              if (!state) running = false;

              if (tick % 10 == 0) {
                div.select("p").remove();
                div.append(() => md`Simulating ${results.length}; tick ${tick}.`);
                //await new Promise(requestAnimationFrame);
                await new Promise(resolve => setTimeout(resolve, 0))
              }
            }

            results.push({
              ...options, 
              max_radius: compute_cell_circle_radius(result)[result.length-1].max_distance,
              shape_indexes: result[result.length-1].cell_shapeindex,
              radial_distances: compute_radial_distance(result[result.length-1]),
            });

            div.node().value = results;
            div.node().dispatchEvent(new CustomEvent("input"));
          }
        }
        
      // }
    // }
    
    div.select("p").remove();
    div.append(() => md`Done; ${results.length} simulations.`);
    
    div.node().value = results;
    div.node().dispatchEvent(new CustomEvent("input"));
  })();
    
  return div.node();
}
);
  main.variable(observer("multi_simulation_results")).define("multi_simulation_results", ["Generators", "viewof multi_simulation_results"], (G, _) => G.input(_));
  main.variable(observer()).define(["multi_simulation_results"], function(multi_simulation_results){return(
multi_simulation_results
)});
  main.variable(observer()).define(["multi_simulation_results","_","d3","DOM"], function(multi_simulation_results,_,d3,DOM)
{
  let picked_data = multi_simulation_results.map(row => _.pick(row, "n_collagen_points", "motility_constant", "max_radius", "collagen_seed", "polar_seed", "shape_indexes", "radial_distances"));
  let csv = d3.tsvFormat(picked_data);
  let blob = new Blob([csv], {type: "text/csv"})
  return DOM.download(blob, undefined, "Download multisim results.");
}
);
  main.variable(observer()).define(["multi_simulation_results","_","d3","DOM"], function(multi_simulation_results,_,d3,DOM)
{
  let picked_data = multi_simulation_results.map(row => {
    let selected_row = _.pick(row, "n_collagen_points", "motility_constant", "max_radius", "collagen_seed", "polar_seed");
    selected_row["n_cells"] = row.shape_indexes.length;
    for (let i = 0; i < 160; i += 1) {
      selected_row[`shape_index_${i}`] = i < row.shape_indexes.length ? row.shape_indexes[i] : "";
    }
    for (let i = 0; i < 160; i += 1) {
      selected_row[`radial_distance_${i}`] = i < row.radial_distances.length ? row.radial_distances[i] : "";
    }
    return selected_row;
  });
  let csv = d3.tsvFormat(picked_data);
  let blob = new Blob([csv], {type: "text/csv"})
  return DOM.download(blob, undefined, "Download multisim results with per cell info.");
}
);
  main.variable(observer("find_max_and_position")).define("find_max_and_position", function(){return(
function find_max_and_position(multi_simulation_results){
let maximum=0
let position=0;
for (let i=0; i<multi_simulation_results.length-1;i++){
  if (multi_simulation_results[i].farthest > maximum){
    maximum = multi_simulation_results[i].farthest;
    position = i;
  }
}
  return [maximum, position];
}
)});
  main.variable(observer()).define(["find_max_and_position","multi_simulation_results"], function(find_max_and_position,multi_simulation_results){return(
find_max_and_position(multi_simulation_results)
)});
  main.variable(observer()).define(["vegalite","multi_simulation_results","width"], function(vegalite,multi_simulation_results,width){return(
vegalite({

  data: {values: multi_simulation_results},
  autosize: "fit",
  width,
  height: 360,
  mark: "rect",
  width: 600,
  height: 300,
  encoding: {
    x: {
      bin: {"step":0.01},
      field: "motility_constant",
      type: "quantitative"
    },
    y: {
      bin: {"step": 5},
      field: "n_collagen_points",
      type: "quantitative"
    },
    color: {
      field: "max_radius",
      type: "quantitative",
      scale: {
        //domain: [250, 350],
        scheme: "viridis",
             
      },
    }
    
  },
  config:{
   // background:"#053061"
  }
 
})
)});
  main.variable(observer("simulation_loop")).define("simulation_loop", ["default_simulate_options","generate_initial_cells_and_collagen","init_physics","seedrandom","d3","env_size","paint_cells","paint_actins","paint_motility_direction","q","n_points","apply_membrane_forces","apply_membrane_stiffness","apply_motility_force","apply_nucleus_forces","cell_cell_constant","apply_intercell_forces","advance_physics","tick_duration","advance_motility_angle"], function(default_simulate_options,generate_initial_cells_and_collagen,init_physics,seedrandom,d3,env_size,paint_cells,paint_actins,paint_motility_direction,q,n_points,apply_membrane_forces,apply_membrane_stiffness,apply_motility_force,apply_nucleus_forces,cell_cell_constant,apply_intercell_forces,advance_physics,tick_duration,advance_motility_angle){return(
function simulation_loop(ondone, options={}, view=null){
  
  // Merge the options parameter with the defaults so we can access them.
  options = {...default_simulate_options, ...options};
  
  // Extract the few options we use in this cell, we'll pass the others to the membrane/intercell forces.
  let {lennard_jones_max_distance, polarization_factor, equilibrium_area, equilibrium_distance} = options;
  
  
  return {
    
    setup: function () {
      // Initialize physics for all cells.
      let [initial_cells, collagen] = generate_initial_cells_and_collagen(options);
      
      let cells = init_physics(initial_cells);
      
      // Initialize time, phase, and an empty set of measures.
      let time = 0.0;
      
      // Start in relax mode.
      let phase = "relax";
      
      let measures = [];
      
      // Fix a random generator for a repeatable simulation. Mainly used for motility.
      let random = seedrandom("this is my seed, my seed is amazing");
      
      // Return the state.
      return {cells, collagen, time, phase, measures, random};
    },
    
    update: async function({cells, collagen, time, phase, measures, random}, {fps}) {
      // Measures
      
      
      let nuclei = cells.map(cell => cell.data.slice());
      let velocities = cells.map(cell => cell.data_v.slice())
      let cell_areas = [];
      let areas = [];
      let sum_perimeter = 0;
      let sum_area = 0;
      let cell_shapeindex=[];
      let sum_excess_p = 0;
      for (let cell of cells) {
        sum_perimeter += d3.polygonLength(cell)
        sum_area += d3.polygonArea(cell)
        cell_areas.push(d3.polygonArea(cell))
        cell_shapeindex.push(d3.polygonLength(cell) /  (Math.sqrt( options.relax_compression) * Math.sqrt(d3.polygonArea(cell))));
        sum_excess_p += (d3.polygonLength(cell) - d3.polygonLength(d3.polygonHull(cell)))
          
      }
      // cell_areas.push({areas});
      let average_area = sum_area / cells.length;
      let average_perimeter = sum_perimeter / cells.length;
      let average_shape_index = average_perimeter / Math.sqrt(average_area);
      let asphericity = Math.pow(average_perimeter,2) / (4*Math.PI*average_area)
      let excess_p = sum_excess_p / cells.length;
      let phi = sum_area / (env_size.width*env_size.height);
     
      measures.push({
        time, 
        phase, 
        cell_areas,
        average_area, 
        average_perimeter, 
        average_shape_index,
        cell_shapeindex,
        excess_p,
        asphericity,
        phi,
        nuclei, 
        velocities
        
     
      });
      
      // Boundaries
      // ----------
      
      // Get all current cells + cell images on the boundaries; we shouldn't apply any
      // forces on these cells though. We can show them on screen though.
      
      // We also move cells that pass the boundaries to wrap around the other side.
      let all_cells = options.boundary_function(cells, lennard_jones_max_distance);
      //take_over_collagen(collagen, cells);
      all_cells = all_cells.concat(collagen)
      
      // Phase Settings
      // --------------
      
      let sim_polarization_factor = {
        "relax": options.relax_polarization_factor,
        "press": options.polarization_factor,
      }[phase];

      let compression = {
        "relax": options.relax_compression,
        "press": options.press_compression,
      }[phase];

      // let sim_equilibrium_area = equilibrium_area * compression;
      let sim_equilibrium_area = compression*(env_size.width * env_size.height) / cells.length
      let equilibrium_area = (env_size.width * env_size.height) / cells.length

      // Display
      // -------
      
      function paint(view) {
        let {display, transform} = view;

        let {context, canvas} = display;
  
        // Apply zoomies.
        context.save();
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        //Set the color of the cells
        if (options.relative_color){
          // let threshold_area = sim_equilibrium_area - 0.4 * options.lennard_jones_distance * 2 * Math.PI * options.nucleus_equilibrium_distance;
          let threshold_area = 1000;

          for (let i=0; i<cells.length; i++){
            cells[i].color = cell_areas[i] < threshold_area ? 'red' : 'blue';
          }
        } else {
          for (let i=0; i<cells.length; i++){
            cells[i].color =  d3.schemeCategory10[i%10];
          }
        }

        // Paint cells.


        paint_cells(all_cells, display);
        paint_actins(cells, 7, display);
        // paint_polarization(cells, sim_polarization_factor, display);
        paint_motility_direction(cells, options.motility_constant, display);

        // Reset to no zoom.
        context.restore();

        // Paint info.
        let extra_lines = [
          `motility_constant = ${options.motility_constant}`,
          `collagen_points = ${options.n_collagen_points}`,
        ];
        //paint_details({time, fps, extra_lines}, display, transform);
        // paint_details({time}, display, transform);
      }
        
        

      // Ignore display if in background mode.
      if (view) {
        paint(view);
        
        // Maybe record frame.
        if (view.recorder !== null) view.recorder.save_frame();
      }

      // Physics
      // -------
      
      // Stop advancing physics whem simulation is done; leave loop running so we can zoom.
      if (phase !== "done" && phase !== "paused") {
        

        // Compute physics for next tick.
        let new_radius = Math.sqrt (sim_equilibrium_area / Math.PI);

        let membrane_options = {
          ...options,

          equilibrium_area: sim_equilibrium_area, 
          //equilibrium_distance: 2* Math.PI * new_radius / n_points,
          equilibrium_distance: q*Math.sqrt(equilibrium_area) / n_points

        };
        apply_membrane_forces(cells, membrane_options);
        apply_membrane_stiffness(cells, membrane_options);

        apply_motility_force(cells, options);

        let nucleus_options = {...options,
                               nucleus_equilibrium_distance: new_radius
                               //nucleus_equilibrium_distance: equilibrium_distance/(2* Math.sin(Math.PI/n_points))
                              };
        apply_nucleus_forces(cells, nucleus_options);


        let intercell_options = {...options, cell_cell_constant};
        apply_intercell_forces(cells, all_cells, intercell_options);
      //  apply_cell_cell_adhesion_forces(cells, all_cells, intercell_options);

        advance_physics(cells, tick_duration, options);
        advance_motility_angle(cells, tick_duration, options, random);

        // add_elastic_force(young_modulus,collagen,12, options.store_forces) 

        time += tick_duration;
      
      }
      
      // Phase Progress
      // --------------
      
      if (phase === "relax" && time > 250) {
        phase = "press";
       
      }
      if (phase === "press" && time >251) {
        phase = "done";
        
        ondone(measures);
      }
      
      // Return the new state.
      return {cells, collagen, time, phase, measures, random, paint};
    },
  }
}
)});
  main.variable(observer("simulate")).define("simulate", ["d3","DOM","setup_display","env_size","run_loop","simulation_loop","C2S","invalidation","record_canvas"], function(d3,DOM,setup_display,env_size,run_loop,simulation_loop,C2S,invalidation,record_canvas){return(
function simulate(options={}) {
  
  // Display
  // -------
  // Setup the main bits of the display.
  
  let div = d3.select(DOM.element("div"));
  
  let display = setup_display(env_size);
  let canvas = div.append(() => display.canvas);
  
  // User interface
  // ==============
  
  const button_style = "margin: 0 0.75em 0 0;";
  const info_style = "font-size: 0.85rem; font-style: italic;";
  
  
  let reset_form = div.append("form");
  let reset_button = reset_form.append("input")
    .attr("type", "button")
    .attr("style", button_style)
    .attr("value", "Restart");

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
  

  // Recorder logic
  // --------------
  
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
  
  record_save.on("click", complete_recording);
  
  // Display
  let view = {display, recorder, transform: null};
  
  // Zoomies
  // -------

  // let transform;
  
  let zoom = d3.zoom()
    .scaleExtent([0.05, 20])
    .on("zoom", () => {view.transform = d3.event.transform;});
  
  canvas.call(zoom).call(zoom.transform, d3.zoomIdentity);
  
  
  // Simulation Loop
  // ---------------
  
  let loop;
  
  function ondone(measures){
    if (recorder !== null) complete_recording();

    // Set the value of the input for the viewof operator.
    div.node().value = measures;
    div.node().dispatchEvent(new CustomEvent("input"));
  }
 
  loop = run_loop(simulation_loop(ondone, options, view));
  
  
  
  
  // SVG Button
  // ----------
   
  let svg_form = div.append("form");
  
  let svg_button = d3.select(DOM.download(() => {
    let svg_context = new C2S(display.canvas.width, display.canvas.height);
    let tmp_display = {canvas: display.canvas, context: svg_context, xscale: display.xscale, yscale: display.yscale};
    let tmp_view = {display: tmp_display, transform: view.transform};
    
    loop.get().paint(tmp_view);
    
    let svg_data = svg_context.getSerializedSvg();
    

    let blob = new Blob([svg_data], {type: "image/svg+xml"});
    return blob;
  }, "cells", "Save SVG"));
  
  svg_button.attr("style", button_style);
  
  svg_form.append(() => svg_button.node());

  
  
  

  
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
  }
  
  function reset_zoom() {
    canvas.call(zoom.transform, d3.zoomIdentity);
  }
  
  function reset() {
    // Reset the state.
    loop.reset();
    
    // Stop recorder.
    if (recorder !== null) reset_recorder();
    
    reset_zoom();
  }
  
  reset_button.on("click", reset);

  reset_record_button.on("click", () => {
    reset();
    start_recording();
  });
  reset_zoom_button.on("click", reset_zoom);
  
  record_button.on("click", start_recording);
  
  return div.node();
}
)});
  main.variable(observer("p0")).define("p0", ["default_simulate_options","n_points"], function(default_simulate_options,n_points){return(
default_simulate_options.equilibrium_distance*n_points
)});
  main.variable(observer("a0")).define("a0", ["default_simulate_options"], function(default_simulate_options){return(
default_simulate_options.equilibrium_area
)});
  main.variable(observer("viewof simulation")).define("viewof simulation", ["simulate","no_boundaries"], function(simulate,no_boundaries){return(
simulate({
  boundary_function: no_boundaries,
  polarization_factor : 0.0, 
  
  //equilibrium_distance: q*Math.sqrt(default_simulate_options.equilibrium_area)/n_points,
  relative_color: true,                            
  velocity_decay: 1e-4,                            
  relax_compression: 1.0,
  press_compression: 1.0,
  
  lenard_jones_strength: 0.75,
  osmosis_constant: 0.001,
  
  motility_constant: 0.88,
  n_collagen_points: 100.0,
})
)});
  main.variable(observer("simulation")).define("simulation", ["Generators", "viewof simulation"], (G, _) => G.input(_));
  main.variable(observer()).define(["simulation"], function(simulation){return(
simulation
)});
  main.variable(observer("env_size_big")).define("env_size_big", ["env_size"], function(env_size){return(
{width: env_size.width * 2, 
  height: env_size.height * 2}
)});
  main.variable(observer("compute_cell_circle_radius")).define("compute_cell_circle_radius", ["env_size_big","distance","d3"], function(env_size_big,distance,d3){return(
function compute_cell_circle_radius(simulation) {
  let x = env_size_big.width/2; 
  let y = env_size_big.height/2;

  let env_center = [x,y];
  let circle_radius = [];
  let max_distance = 0;
 
  for (let i=0; i<simulation.length; i++){
    let nuclei = simulation[i].nuclei;
    let time = simulation[i].time;
    let distances = [];
    for (let nucleus of nuclei){
      distances.push(distance(nucleus,env_center));
     
    }
    let max_distance = d3.max(distances);
   
  
  
    circle_radius. push ({max_distance,time});
  }
  return circle_radius
}
)});
  main.variable(observer("cell_circle_radius")).define("cell_circle_radius", ["compute_cell_circle_radius","simulation"], function(compute_cell_circle_radius,simulation){return(
compute_cell_circle_radius(simulation)[simulation.length-1]
)});
  main.variable(observer("compute_radial_cell")).define("compute_radial_cell", ["env_size_big","distance"], function(env_size_big,distance){return(
function compute_radial_cell(simulation){
  //let data = [];
  let update = [];
  let mean_per_nucleus=[];
  
  let x = env_size_big.width/2; 
  let y = env_size_big.height/2;
  let env_center = [x,y];
  for (let i=0; i<simulation.length; i++){
    let nuclei = simulation[i].nuclei;
   // let nuclei_velocities =nuclei_velocities_absolute[i];
   // let nuclei_displacement=displacement[i];
    let radial_distance = 0;
   // let velocity = 0;
    let data=[];
    //let displacement_nucleus = 0;
    for (let j=0; j<nuclei.length;j++){
      radial_distance=(distance(env_center,nuclei[j]));
     // velocity = nuclei_velocities[j];
     // displacement_nucleus=nuclei_displacement[j];
      data[j]=[radial_distance]
      
    }
      
    update.push(data) ;
  }
  return update 
}
)});
  main.variable(observer("compute_radial_distance")).define("compute_radial_distance", ["env_size_big","distance"], function(env_size_big,distance){return(
function compute_radial_distance(simulation_tick){
  let radial_distances = [];
  let x = env_size_big.width/2; 
  let y = env_size_big.height/2;
  let env_center = [x,y];
  for (let j=0; j< simulation_tick.nuclei.length;j++){
    radial_distances.push(distance(env_center, simulation_tick.nuclei[j]));
  }
  return radial_distances;
}
)});
  main.variable(observer("radial_cell")).define("radial_cell", ["compute_radial_cell","simulation"], function(compute_radial_cell,simulation){return(
compute_radial_cell(simulation)
)});
  main.variable(observer()).define(["d3","radial_cell","DOM"], function(d3,radial_cell,DOM)
{
  let csv = d3.tsvFormat(radial_cell);
  let blob = new Blob([csv], {type: "text/csv"})
  return DOM.download(blob, undefined, "Download radial_cell");
}
);
  main.variable(observer()).define(["radial_cell"], function(radial_cell){return(
radial_cell[3012]
)});
  main.variable(observer("compute_farthest_ratio")).define("compute_farthest_ratio", ["nearest_neighbor_max_distance"], function(nearest_neighbor_max_distance){return(
function compute_farthest_ratio(simulation){
  let last_tick = simulation[simulation.length-1];
  let last_farthest_distance = nearest_neighbor_max_distance(last_tick.nuclei);
  let cell_average_size = Math.sqrt(last_tick.average_area/Math.PI);
 
  return last_farthest_distance/cell_average_size;
}
)});
  main.variable(observer("farthest_ratio")).define("farthest_ratio", ["compute_farthest_ratio","simulation"], function(compute_farthest_ratio,simulation){return(
compute_farthest_ratio(simulation)
)});
  main.variable(observer("area_differences")).define("area_differences", ["simulation","a0"], function(simulation,a0)
{
  let area_differences=[];

  for (let i = 0; i< simulation.length; i++) {
    let nucleus_x=[];
    let nucleus_y=[];
    
    let phase=simulation[i].phase;
    let time=simulation[i].time;
    let nuclei_cur= simulation[i].nuclei;
    
    let cur_areas=simulation[i].cell_areas;
    let delta=[];
    if (phase == "relax" & simulation[i].time < 500){
      for (let j=0; j<cur_areas.length; j++){
        nucleus_x.push( nuclei_cur[j][0]),
        nucleus_y.push( nuclei_cur[j][1]), 
        delta.push(cur_areas[j]-a0);
        
      }
      
      area_differences.push({delta,time,nucleus_x,nucleus_y})
    }
  }
  return area_differences
}
);
  main.variable(observer()).define(["DOM","d3","area_differences"], function(DOM,d3,area_differences){return(
DOM.download(
  new Blob([d3.csvFormat(area_differences)], {type: "text/csv"}),
  "area_differences.csv"
)
)});
  main.variable(observer("excess_a")).define("excess_a", ["simulation"], function(simulation)
{
 let excess_a=[];
  for (let i=0; i< simulation.length; i++){
    let excess = simulation[i].excess_p;
    let asphericity = simulation[i].asphericity;
    let time = simulation[i].time;
    excess_a.push ({excess, asphericity, time});
  }
  return excess_a
}
);
  main.variable(observer()).define(["DOM","d3","excess_a"], function(DOM,d3,excess_a){return(
DOM.download(
  new Blob([d3.csvFormat(excess_a)], {type: "text/csv"}),
  "excess_a.csv"
)
)});
  main.variable(observer("area_differences_at_time")).define("area_differences_at_time", ["aread_time","area_differences"], function(aread_time,area_differences)
{
  
  let area_differences_at_time = [];
  let time_i = Math.round(aread_time);
 

  for (let j = 0; j< area_differences[time_i].nucleus_x.length ;j++){
    let nucleus_x = area_differences[time_i].nucleus_x[j];
    let nucleus_y = area_differences[time_i].nucleus_y[j];
    let diff = (area_differences[time_i].delta[j])

    area_differences_at_time.push({nucleus_x, nucleus_y, diff})


  }
                       
  return area_differences_at_time
}
);
  main.variable(observer("viewof aread_time")).define("viewof aread_time", ["slider","area_differences"], function(slider,area_differences){return(
slider({
  min: 0.0,
  max: area_differences.length-1,
  value: 500.0,
  precision: 1,
  description: "Select simulation time at which we plot area.",
})
)});
  main.variable(observer("aread_time")).define("aread_time", ["Generators", "viewof aread_time"], (G, _) => G.input(_));
  main.variable(observer("viewof area_differences_plot")).define("viewof area_differences_plot", ["vegalite","area_differences_at_time"], function(vegalite,area_differences_at_time){return(
vegalite({

  data: {name: "source", values: area_differences_at_time},
  autosize: "fit",
  mark: "rect",
  width: 800,
  height: 500,
  encoding: {
    x: {
      bin: {"step": 4},
      field: "nucleus_x",
      type: "quantitative",
    },
    y: {
      bin: {"step": 4},
      field: "nucleus_y",
      type: "quantitative",
    },
    color: {
      field: "diff",
      type: "quantitative",
      scale: { 
        //domain: [-40,40],
        scheme: "blueorange"
      },
      
    }
    
  },
 
})
)});
  main.variable(observer("area_differences_plot")).define("area_differences_plot", ["Generators", "viewof area_differences_plot"], (G, _) => G.input(_));
  main.variable(observer("nuclei_positions")).define("nuclei_positions", ["simulation"], function(simulation)
{
 
  let nuclei_positions= simulation.map(simulation => simulation.nuclei.slice());
  
   return nuclei_positions
  }
);
  main.variable(observer("nuclei_velocities_absolute")).define("nuclei_velocities_absolute", ["simulation"], function(simulation)
{
  let magnitudes = [];
  let nuclei_velocities= simulation.map(simulation => simulation.velocities.slice());
 
  for (let i=0; i<nuclei_velocities.length; i++){
    let nuclei_magnitudes = [];
    for (let j=0; j<nuclei_velocities[i].length; j++){
      let x = nuclei_velocities[i][j][0];
      let y = nuclei_velocities[i][j][1];
      let square = Math.pow(x,2) + Math.pow(y,2);
      let magnitude = Math.sqrt (square);
      nuclei_magnitudes.push(magnitude);
  }
    magnitudes.push(nuclei_magnitudes)
  }
  return magnitudes
}
);
  main.variable(observer()).define(["DOM","d3","nuclei_velocities_absolute"], function(DOM,d3,nuclei_velocities_absolute){return(
DOM.download(
  new Blob([d3.csvFormat(nuclei_velocities_absolute)], {type: "text/csv"}),
  "nuclei_velocities_absolute.csv"
)
)});
  main.variable(observer("displacement")).define("displacement", ["nuclei_positions","simulation","reference","distance"], function(nuclei_positions,simulation,reference,distance)
{
  let displacement=[];
  let nuclei_cur=[];

 
  for (let i = 0; i< nuclei_positions.length; i++) {
    let nuclei_cur = nuclei_positions[i];
    let phase=simulation[i].phase;
    
  let msd=[];
 
    for (let j=0; j<nuclei_cur.length; j++){
      let p1 = nuclei_cur[j];
      let p0 = reference[j];
      let d = distance(p1,p0);
      msd.push(Math.pow(d,2));
    }
    displacement.push(msd)
  }
  
  return displacement                      
}
);
  main.variable(observer("displacement_relax")).define("displacement_relax", ["nuclei_positions","simulation","reference","distance"], function(nuclei_positions,simulation,reference,distance)
{
  let displacement_relax=[];
  let nuclei_cur=[];

 
  for (let i = 0; i< nuclei_positions.length; i++) {
    let nuclei_cur = nuclei_positions[i];
    let phase=simulation[i].phase;
    
  let msd=[];
  if (phase == "relax" & simulation[i].time <100){
    for (let j=0; j<nuclei_cur.length; j++){
      let p1 = nuclei_cur[j];
      let p0 = reference[j];
      let d = distance(p1,p0);
      msd.push(Math.pow(d,2));
    }
    displacement_relax.push(msd)
  }
  }
  return displacement_relax                       
}
);
  main.variable(observer("displacement_press")).define("displacement_press", ["nuclei_positions","simulation","reference","distance"], function(nuclei_positions,simulation,reference,distance)
{
  let displacement_press=[];
  let nuclei_cur=[];

 
  for (let i = 0; i< nuclei_positions.length; i++) {
    let nuclei_cur = nuclei_positions[i];
    let phase=simulation[i].phase;
    
  let msd=[];
  if (phase == "press" & simulation[i].time >100){
    for (let j=0; j<nuclei_cur.length; j++){
      let p1 = nuclei_cur[j];
      let p0 = reference[j];
      let d = distance(p1,p0);
      msd.push(Math.pow(d,2));
    }
    displacement_press.push(msd)
  }
  }
  return displacement_press                    
}
);
  main.variable(observer("average_displacement")).define("average_displacement", ["displacement","d3","tick_duration"], function(displacement,d3,tick_duration)
{
  let average_displacement = [];

  for (let i = 0; i< displacement.length; ++i) {
    let copy = displacement[i].slice(); 
    let mean=d3.mean(copy);
    let time = i*tick_duration;
    average_displacement.push ({mean,time})
  }
  return average_displacement
}
);
  main.variable(observer()).define(["DOM","d3","average_displacement"], function(DOM,d3,average_displacement){return(
DOM.download(
  new Blob([d3.csvFormat(average_displacement)], {type: "text/csv"}),
  "average_displacement.csv"
)
)});
  main.variable(observer("average_displacement_relax")).define("average_displacement_relax", ["displacement_relax","d3","tick_duration"], function(displacement_relax,d3,tick_duration)
{
  let average_displacement_relax = [];

  for (let i = 0; i< displacement_relax.length; ++i) {
    let copy = displacement_relax[i].slice(); 
    let mean=d3.mean(copy);
    let time = i*tick_duration;
    average_displacement_relax.push ({mean,time})
  }
  return average_displacement_relax
}
);
  main.variable(observer("average_displacement_press")).define("average_displacement_press", ["displacement_press","d3","tick_duration"], function(displacement_press,d3,tick_duration)
{
  let average_displacement_press = [];

  for (let i = 0; i< displacement_press.length; ++i) {
    let copy = displacement_press[i].slice(); 
    let mean=d3.mean(copy);
    let time = 100 + i*tick_duration;
    average_displacement_press.push ({mean,time})
  }
  return average_displacement_press
}
);
  main.variable(observer("phi_list")).define("phi_list", ["simulation"], function(simulation)
{
let phi_list =[];
for (let i = 0; i< simulation.length; i++){
  let phi = simulation[i].phi;
  let asphericity = simulation[i].asphericity;
  let shape_index = simulation[i].cell_shapeindex;
  phi_list.push({phi,asphericity, shape_index})
}
  return phi_list
}
);
  main.variable(observer()).define(["DOM","d3","phi_list"], function(DOM,d3,phi_list){return(
DOM.download(
  new Blob([d3.csvFormat(phi_list)], {type: "text/csv"}),
  "phi_list.csv"
)
)});
  main.variable(observer()).define(["vegalite","simulation","width"], function(vegalite,simulation,width){return(
vegalite({
  
  data: {values: simulation},
  
  mark: "point",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative",scale: {zero:false}}, 
    y: {field: "phi" , type: "quantitative",scale: {zero:false}},
    
   color: {"bin": true, "field": "time","type": "quantitative"}
  }
})
)});
  main.variable(observer()).define(["vegalite","average_displacement","width"], function(vegalite,average_displacement,width){return(
vegalite({
  
  data: {values: average_displacement},
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time", type: "quantitative", scale:{zero:false}},
    y: {field: "mean", type: "quantitative", scale: {zero:false}},
    
  }
})
)});
  main.variable(observer("movement")).define("movement", ["nuclei_positions","simulation","distance"], function(nuclei_positions,simulation,distance)
{
  let movement=[];
  let nuclei_cur=[];

 
  for (let i = 1; i< nuclei_positions.length; i++) {
    let nuclei_cur = nuclei_positions[i];
    let nuclei_prev = nuclei_positions [i-1];
    let phase=simulation[i].phase;
    let msd=[];
    for (let j=0; j<nuclei_cur.length; j++){
      let p1 = nuclei_cur[j];
      let p0 = nuclei_prev[j];
      let d = distance(p1,p0);
      msd.push(Math.pow(d,2));
      let phase = simulation[j].phase;
    }
    movement.push({msd,phase})
  }
  
  return movement                      
}
);
  main.variable(observer()).define(["DOM","d3","movement"], function(DOM,d3,movement){return(
DOM.download(
  new Blob([d3.csvFormat(movement)], {type: "text/csv"}),
  "movement.csv"
)
)});
  main.variable(observer("average_movement")).define("average_movement", ["movement","d3","tick_duration"], function(movement,d3,tick_duration)
{
  let average_movement = [];

  for (let i = 0; i< movement.length; ++i) {
    let copy = movement[i].msd.slice(); 
    let mean=d3.mean(copy);
    let time = i*tick_duration;
    let phase = movement[i].phase;
    average_movement.push ({mean,time,phase})
  }
  return average_movement
}
);
  main.variable(observer()).define(["vegalite","average_movement","width"], function(vegalite,average_movement,width){return(
vegalite({
  
  data: {values: average_movement},
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time", type: "quantitative", scale:{zero:false}},
    y: {field: "mean", type: "quantitative", scale: {zero:false}},
    
  }
})
)});
  main.variable(observer("reference")).define("reference", ["simulation"], function(simulation)
{

let position = 0;
 for (let i=0; i < simulation.length; i++){
   if (simulation[i].phase == "press" ){
   let position = i;
   break
   }
      }
let reference=simulation[position].nuclei;
  
   return reference
}
);
  main.variable(observer()).define(["vegalite","simulation","width"], function(vegalite,simulation,width){return(
vegalite({
  
  data: {values: simulation},
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time", type: "quantitative"},
    y: {field: "average_area", type: "quantitative", scale: {zero:false}},
    color: {"field": "phase","type": "nominal"}
  }
})
)});
  main.variable(observer()).define(["vegalite","simulation","width"], function(vegalite,simulation,width){return(
vegalite({
  
  data: {values: simulation},
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time", type: "quantitative"},
    y: {field: "average_shape_index", type: "quantitative", scale: {zero:false}},
   color: {"field": "phase","type": "nominal"}
       
  }
})
)});
  main.variable(observer("average_velocity_time")).define("average_velocity_time", ["nuclei_velocities_absolute","tick_duration","d3"], function(nuclei_velocities_absolute,tick_duration,d3)
{
let average_velocity_time=[];                             
for (let i=0; i< nuclei_velocities_absolute.length; i++){
  let time=i*tick_duration;
  let average_velocity = d3.mean (nuclei_velocities_absolute[i]);
  average_velocity_time.push({average_velocity,time});
}
  
  
return average_velocity_time
}
);
  main.variable(observer("average_velocity")).define("average_velocity", ["nuclei_velocities_absolute","tick_duration","d3"], function(nuclei_velocities_absolute,tick_duration,d3)
{
let average=[];                             
for (let i=0; i< nuclei_velocities_absolute.length; i++){
  let time=i*tick_duration;
  let average_velocity_monolayer = d3.mean (nuclei_velocities_absolute[i]);
  average.push(average_velocity_monolayer);
}
  
  
return average
}
);
  main.variable(observer()).define(["DOM","d3","average_velocity"], function(DOM,d3,average_velocity){return(
DOM.download(
  new Blob([d3.csvFormat(average_velocity)], {type: "text/csv"}),
  "average_velocity.csv"
)
)});
  main.variable(observer("merged")).define("merged", ["average_velocities","average_velocities_03","average_velocities_04","average_velocities_02","average_velocities_01","average_velocities_00","tick_duration","simulation"], function(average_velocities,average_velocities_03,average_velocities_04,average_velocities_02,average_velocities_01,average_velocities_00,tick_duration,simulation)
{
 let merged=[];
 let high=[];
 let med_med=[];
 let med_high=[];
 let medium=[];
 let med_low=[];
 let low=[];
 let time=[];
 let phase=[];
 for (let i=0; i<average_velocities.length; i++){
    high.push(average_velocities[i]);
    med_med.push(average_velocities_03[i])
    med_high.push(average_velocities_04[i])
    medium.push(average_velocities_02[i]);
    med_low.push(average_velocities_01[i])
    low.push(average_velocities_00[i]);
    time.push(i*tick_duration);
    phase.push(simulation[i].phase)
      }

  return  merged={high, low, med_low,medium,med_med, med_high, time,phase}
}
);
  main.variable(observer("data")).define("data", ["merged","d3"], function(merged,d3)
{
let {high, medium, med_low,low,med_med,med_high, time, phase}=merged;
return d3.zip(high,medium,med_low,low,med_med,med_high,time,phase).map(([high, medium, med_low, low,med_med,med_high, time, phase])=> ({high, medium, med_low,low,med_med,med_high, time, phase}))
}
);
  main.variable(observer("velocity_dependence_polarization")).define("velocity_dependence_polarization", ["vegalite","data","width"], function(vegalite,data,width)
{
return vegalite({
  
  data: {values: data},
  transform: [
      {filter: {field: "phase", equal: "press"}},
  ],
  layer:[
    {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "high" , type: "quantitative"},
    color:{ value: "#581845",legend: "Polarization factor= 0.2"}
    }
    },
    
   {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "med_med" , type: "quantitative"},
    color: {value: "#C70039", legend: "Polarization factor= 0.1"},
    
  }
    },
     {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "med_high" , type: "quantitative"},
    color: {value: "#900C3F", legend: "Polarization factor= 0.1"},
    
  }
    },
    {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "medium" , type: "quantitative"},
    color: {value: "#FF5733", legend: "Polarization factor= 0.2"},
    
  }
    },
     {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "med_low" , type: "quantitative"},
    color: {value: "#FFC300", legend: "Polarization factor= 0.1"},
    
  }
    },
   {
  mark: "line",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative", scale:{ zero:false}}, 
    y: {field: "low" , type: "quantitative"},
    color: {value: "#DAF7A6", legend: "no polarization"}
  },
  
    }],

  
})
}
);
  main.variable(observer()).define(["vegalite","average_velocity_time","width"], function(vegalite,average_velocity_time,width){return(
vegalite({
  
  data: {values: average_velocity_time},
  
  mark: "point",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "time" , type: "quantitative"}, 
    y: {field: "average_velocity" , type: "quantitative"},
    
  
  }
})
)});
  main.variable(observer("velocity_and_shape")).define("velocity_and_shape", ["simulation","average_velocity_time","vegalite","width"], function(simulation,average_velocity_time,vegalite,width)
{
  let velocity_and_shape=[];
  for (let i=1; i<simulation.length-1; i++){
    let average_velocity = average_velocity_time[i].average_velocity;
    let average_shape_index = simulation[i+1].average_shape_index;
  
  velocity_and_shape.push({average_velocity,average_shape_index});
  }
  return vegalite({
  data: {values:velocity_and_shape},
  mark: "point",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "average_velocity", type: "quantitative"},
    y: {field: "average_shape_index", type: "quantitative", scale: {zero:false}}, 
   color: {"bin": true, "field": "average_shape_index","type": "quantitative"}
  }
  })

}
);
  main.variable(observer("max_nucleus_velocity")).define("max_nucleus_velocity", ["nuclei_velocities_absolute","d3"], function(nuclei_velocities_absolute,d3)
{
  let max_time = [];
  for (let j=0; j<nuclei_velocities_absolute.length; j++){
      max_time.push(d3.max(nuclei_velocities_absolute[j]))
  }
  let max_nucleus_velocity = d3.max(max_time);
  return max_nucleus_velocity;
  }
);
  main.variable(observer("velocity_heatmap")).define("velocity_heatmap", ["nuclei_velocities_time","tick_duration","nuclei_velocities_absolute","nuclei_positions"], function(nuclei_velocities_time,tick_duration,nuclei_velocities_absolute,nuclei_positions)
{
  let heatmap = [];
  let time_i = Math.round (nuclei_velocities_time/tick_duration);
  
 
    
  let velocity = nuclei_velocities_absolute[time_i];
  for (let j = 0; j<nuclei_positions[time_i].length;j++){
    let nucleus_x = nuclei_positions[time_i][j][0];
    let nucleus_y = nuclei_positions[time_i][j][1];
    let velocity_p = velocity[j];

    heatmap.push({nucleus_x, nucleus_y, velocity_p})


  }
                       
  return heatmap
}
);
  main.variable(observer("viewof nuclei_velocities_time")).define("viewof nuclei_velocities_time", ["slider","simulation"], function(slider,simulation){return(
slider({
  min: 0.0,
  max: simulation[simulation.length-1].time,
  value: 140.0,
  precision: 1,
  description: "Select simulation time at which we plot velocities.",
})
)});
  main.variable(observer("nuclei_velocities_time")).define("nuclei_velocities_time", ["Generators", "viewof nuclei_velocities_time"], (G, _) => G.input(_));
  main.variable(observer()).define(["vegalite","velocity_heatmap","width","max_nucleus_velocity"], function(vegalite,velocity_heatmap,width,max_nucleus_velocity){return(
vegalite({

  data: {values: velocity_heatmap},
  autosize: "fit",
  width,
  height: 360,
  mark: "rect",
  width: 600,
  height: 300,
  encoding: {
    x: {
      bin: {"step":8},
      field: "nucleus_x",
      type: "quantitative"
    },
    y: {
      bin: {"step": 8},
      field: "nucleus_y",
      type: "quantitative"
    },
    color: {
      field: "velocity_p",
      type: "quantitative",
      scale: {
        domain: [0,0.9*max_nucleus_velocity],
        scheme: "blueorange",
             
      },
    }
    
  },
  config:{
   // background:"#053061"
  }
 
})
)});
  main.variable(observer()).define(["vegalite","velocities_shape","width"], function(vegalite,velocities_shape,width){return(
vegalite({
  data: {values: velocities_shape},
  // Can plot all of them by flattening, but it's a mess.
  transform: [
    {flatten: ["velocity", "shape"]},
    {filter: {field: "phase", equal: "relax"}},
  ],
  mark: "point",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    y: {field: `velocity`, type: "quantitative"},
    x: {
      field: `shape`, 
      type: "quantitative", 
      scale: {
        // domain: cell_shapeindex_extent,
        zero: false,
      },
    }, 
    color: {
      field: "phase",
    },
  },
})
)});
  main.variable(observer("velocities_shape")).define("velocities_shape", ["nuclei_velocities_absolute","simulation"], function(nuclei_velocities_absolute,simulation)
{
 let velocities_shape = [];
  for (let i=0; i<nuclei_velocities_absolute.length; i++){
    let shape = simulation[i].cell_shapeindex; 
    let velocity = nuclei_velocities_absolute[i];
    let phase = simulation[i].phase;
    velocities_shape.push({velocity,shape, phase});
  }
  return velocities_shape
}
);
  main.variable(observer()).define(["vegalite","velocities_shape","width"], function(vegalite,velocities_shape,width){return(
vegalite({
  data: {values: velocities_shape},
  
  transform: [
    {flatten: ["velocity", "shape"]},
    {filter: {field: "phase", equal: "press"}},
  ],
  selection: {
    grid: {
    type: "interval",
    bind: "scales",
    on: "[mousedown, window:mouseup] > window:mousemove!",
    encodings: ["x", "y"],
    translate: "[mousedown, window:mouseup] > window:mousemove!",
    zoom: "wheel!",
    mark: {"fill": "#333", "fillOpacity": 0.125, "stroke": "white"},
    resolve: "global"
    },
  },
  mark: "rect",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    y: { bin: {"maxbins":15}, field: `velocity`, type: "quantitative"},
    x: {
      bin: {"maxbins":20},
      field: `shape`, 
      type: "quantitative", 
      scale: {
        // domain: cell_shapeindex_extent,
        zero: false,
      },
    }, 
    color: {
      aggregate: "count",
      type: "quantitative",
      scale: { scheme: "purpleblue"}
       
    }
 
  }
  
})
)});
  main.variable(observer("list")).define("list", ["simulation"], function(simulation)
{
  let list=[];
  for (let i=1000; i<simulation.length; i++){
    let {nuclei}=simulation[i];
    for (let j=0; j<nuclei.length; j++){
      let add_to_list={cell_index:j+1,
                       time:simulation[i].time, 
                       phase: simulation[i].phase,
                       nucleus_x: nuclei[j][0],
                       nucleus_y: nuclei[j][1]                      
                      }
      
    list.push(add_to_list)
  }
  }
  return list
}
);
  main.variable(observer()).define(["vegalite","list","width"], function(vegalite,list,width){return(
vegalite({
  data: {values:list},
  transform: [  
 // {filter: {field: "time", range: [80,120]}},
  ],
  mark: "point",
  autosize: "fit",
  width,
  height: 360,
  encoding: {
    x: {field: "nucleus_x", type: "quantitative", scale: {zero:false}},
    y: {field: "nucleus_y", type: "quantitative", scale: {zero:false}}, 
   color: { "field": "cell_index","type": "nominal"}
  }
  })
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Appendix`
)});
  main.variable(observer("keep_nonoverlapping_polys")).define("keep_nonoverlapping_polys", ["d3"], function(d3){return(
function keep_nonoverlapping_polys(polys, test_polys) {
  // Keep polys that don't overlap with any of the test polygons.
  return polys.filter(poly => {
    // Keep if it doesn't intesect with any of the test_polys.
    return !test_polys.some(test_poly => {
      // Our poly intersect the test poly if any of its points is inside.
      return poly.some(p => d3.polygonContains(test_poly, p));
    });
  });
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Misc math`
)});
  main.variable(observer("distance")).define("distance", function(){return(
function distance(p1, p2) {
  return Math.sqrt( (p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 );
}
)});
  main.variable(observer("randn_bm")).define("randn_bm", function(){return(
function randn_bm(random) {
  var u = 0, v = 0;
  while(u === 0) u = random(); //Converting [0,1) to (0,1)
  while(v === 0) v = random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Imports`
)});
  main.variable(observer("seedrandom")).define("seedrandom", ["require"], function(require){return(
require("seedrandom@2.4.3/seedrandom.min.js")
)});
  const child1 = runtime.module(define1);
  main.import("setup_display", child1);
  main.import("run_loop", child1);
  main.import("periodic_boundaries", child1);
  main.import("paint_cells", child1);
  main.import("paint_polarization", child1);
  main.import("paint_details", child1);
  main.import("apply_membrane_forces", child1);
  main.import("apply_intercell_forces", child1);
  main.import("advance_physics", child1);
  main.import("tick_duration", child1);
  main.import("record_canvas", child1);
  main.import("default_membrane_options", child1);
  main.import("default_intercell_options", child1);
  main.import("generate_random_cell_centers", child1);
  main.import("generate_random_polarization", child1);
  main.import("perimeter_points", child1);
  main.import("shrink_poly", child1);
  main.import("shrink_distance", child1);
  main.import("compute_voronoi_polygons", child1);
  main.import("min_nucleus_separation", child1);
  main.import("border", child1);
  main.import("default_nucleus_options", child1);
  main.import("apply_nucleus_forces", child1);
  main.import("apply_membrane_stiffness", child1);
  main.import("generate_poison_disc_cell_centers", child1);
  main.import("paint_actins", child1);
  main.import("poissonDiscSampler", child1);
  main.import("elastic_force", child1);
  main.import("init_physics", child1);
  main.import("rot2d", child1);
  main.import("mul2d", child1);
  main.import("unit", child1);
  main.import("inplace_add2d", child1);
  main.import("move_cell_to", child1);
  main.import("sub2d", child1);
  main.import("circle_poly", child1);
  main.import("set_opacity", child1);
  main.import("stroke_fill_arrow", child1);
  main.import("pretty_float", child1);
  const child2 = runtime.module(define2);
  main.import("checkbox", child2);
  main.import("slider", child2);
  main.import("radio", child2);
  main.import("button", child2);
  main.import("text", child2);
  const child3 = runtime.module(define3);
  main.import("cell_cell_adhesion_force", child3);
  main.import("apply_cell_cell_adhesion_forces", child3);
  main.import("closest_point_on_segment", child3);
  main.import("paint_cell_cell_junctions", child3);
  const child4 = runtime.module(define4);
  main.import("serialize", child4);
  const child5 = runtime.module(define5);
  main.import("vegalite", child5);
  main.import("vega", child5);
  main.variable(observer("_")).define("_", ["require"], function(require){return(
require("lodash")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3")
)});
  main.variable(observer("C2S")).define("C2S", ["require"], async function(require)
{
  const response = await fetch("https://raw.githubusercontent.com/gliffy/canvas2svg/master/canvas2svg.js");
  const blob = await response.blob();
  return require(URL.createObjectURL(blob)).catch(() => window.C2S);
}
);
  return main;
}
