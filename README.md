# Cell-Settling
This code sets up the cells with a Voronoi tesselation, creates an equally spaces array of points as the membrane and implements the forces between the points (Elastic force, viscosity force), within the cell (area-driven force) and cell-cell forces (modelled by Lennard-Jones potential). Certain aspects described here are not carried in the next part of the project, like periodic boundaries or membrane polarization. 

Code from https://observablehq.com/@spatac/cell-settling
Note that the code runs best on the computational notebook (link above), as that environment doesn't mind the order of function and variable declaration. 
Running this code in a different javascript compiler might require extra arrangement of the blocks of code and the reader is directed to the link above to aid with that task.

#Cell-Measurements
This code imports the creation of the cells from the code above with all the applicable forces, and it arranges a given number of cells within a circular domain in the center of the environment. Around that circular domain, it seeds a given number of collagen blocks to represent the environment. Several functions mention things like displacement of cells, shape index during the simulation, radial distance of the cells during the simulation and others. A multi-simulation loop is setup, that can loop over a range of motilites, collagen points and cell seeds and collagen seeds. 

Code from https://observablehq.com/@spatac/measurements-of-cell-settling-simulation
Note that the code runs best in the computational notebook linked above. If setting up the code in a different environment and trying to compile it with a different compiler, there might be the need to arrange the blocks of code in a different order. 
