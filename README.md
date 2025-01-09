# TSP

Solution to the Traveling Salesman Problem using the Google Maps API with a front-end web interface for visualizing the route, adding stops, and selecting whether to return to origin.

### Problem-Statement

"Given a list of cities and the distances between each pair of cities, what is the shortest possible route that visits each city exactly once and returns to the origin city?"

The problem itself is NP-Hard, as the optimal solution cannot be found in polynomial time for an arbitrary number of cities, n. The problem scales as n!.

# Distances

The distances from point to point are calculated using the Haversine formula. Though not perfectly representative of the roads one may travel on, it provides a good estimation for the comparative distance between two locations. The more developed a region is, the more accurate the method is for finding an optimal route, due to the density of roads. The location data (coordinates) is pulled using the Google Maps API.

# Visualization

The solution is visualized on an HTML-based webpage that renders a map with Markers on it. The user has the option to search for places and add to a list (or remove from) to later find an optimal traversal of the locations.

# Algorithm

The primary heuristic algorithm used is the algorithm of Christofides and Serdyukov. This is an algorithm that provides a tour that is at most 1.5x the most optimal solution, provided that the location satisfy the triangle inequality and are symmetric (form a metric space). The summary of the algorithm is as follows:

1. Find a minimum spanning tree for the problem.
2. Create duplicates for every edge to create an Eulerian graph.
3. Find an Eulerian tour for this graph.
4. Convert to TSP: if a city is visited twice, then create a shortcut from the city before this in the tour to the one after this.

# Running the program

In order to run the program, first replace the API key found in `config.js`. The API key can be trerieved from https://console.cloud.google.com/google/maps-api. Then open the `index.html` file and add in your stops! This program can also be customized to input lcoations from an array rather than the front-end UI.

# Variations

The option to vary the choice of algorithm is available by altering the `christofides_serduykov.js` file. You may choose to implement a solution that provides a more accurate result or even choose to implement an exact algorithm if you intend on using a relatively small number of stops.
