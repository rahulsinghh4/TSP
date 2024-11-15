# TSP
Solution to the Traveling Salesman Problem using the Google Maps API
The problem itself is NP-Hard, as the optimal solution cannot be found in polynomial time for an arbitrary number of cities, n. The problem scales as n!. 


# Distances
The distances from point to point are calculated using the Haversine formula. Though not perfectly representative of the roads one may travel on, it provides a good estimation for the comparative distance between two locations. The location data (coordinates) is pulled using the Google Maps API

# Visualization
The solution is visualized on an HTML-based webpage that renders a map with markers on it. The user has the option to search for places and add to a list (or remove from) to later find an optimal traversal of the locations.

# Algorithm
The primary heuristic algorithm used is the genetic algorithm based off of https://medium.com/@realymyplus/introduction-to-genetic-algorithm-with-a-website-to-watch-it-solve-traveling-salesman-problem-live-a21105a3251a) and Muyang Ye

# Christofides and Serdyukov
A secondary manual implementation involves taking the location data from the main program and using the Algorithm of Christofides and Serdyukov that enables the user to find a tour that is at most 1.5x the optimal solution, provided that the location satisfy the triangle inequality and are symmetric (form a metric space). This algorithm is gauranteed to provide a solution within a certain bound, while the Genetic Algorithm makes no such guarantees. 
