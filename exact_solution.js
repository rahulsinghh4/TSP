const CONVERT_TO_RADIAN_CONST = 0.0174533;

function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=" +
    config["apiKey"] +
    "&callback=initMap&v=weekly";
  script.defer = true;
  document.body.appendChild(script);
}

function initMap() {
  let waypointsJSON = localStorage.getItem("waypoints");
  let returnToOrigin = localStorage.getItem("returnToOrigin");
  let waypoints = JSON.parse(waypointsJSON);

  const map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: waypoints[0].lat / CONVERT_TO_RADIAN_CONST,
      lng: waypoints[0].lon / CONVERT_TO_RADIAN_CONST,
    },
    zoom: 8,
  });

  class Waypoint {
    constructor(name, location) {
      this.name = name;
      this.lat = location.lat();
      this.lon = location.lng();
    }
  }

  var poly = new google.maps.Polyline({
    editable: true,
    path: [],
  });

  // Calculate the Haversine distance between two waypoints
  function getHaversineDistance(waypoint1, waypoint2) {
    let dlon = waypoint2.lon - waypoint1.lon;
    let lat1 = waypoint1.lat;
    let lat2 = waypoint2.lat;
    let dlat = lat2 - lat1;
    let a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 3961 * c; // Earth's radius in miles
  }

  // Branch and Bound implementation for exact TSP solution
  class ExactTSPSolver {
    constructor(waypoints) {
      this.waypoints = waypoints;
      this.n = waypoints.length;
      this.bestTour = null;
      this.bestCost = Infinity;
      this.distanceMatrix = this.calculateDistanceMatrix();
    }

    calculateDistanceMatrix() {
      const matrix = Array(this.n)
        .fill()
        .map(() => Array(this.n).fill(0));
      for (let i = 0; i < this.n; i++) {
        for (let j = 0; j < this.n; j++) {
          if (i !== j) {
            matrix[i][j] = getHaversineDistance(
              this.waypoints[i],
              this.waypoints[j]
            );
          }
        }
      }
      return matrix;
    }

    // Calculate lower bound for remaining cities using minimum spanning edges
    calculateLowerBound(used, partial_tour) {
      let bound = 0;

      // Add cost of existing path
      for (let i = 0; i < partial_tour.length - 1; i++) {
        bound += this.distanceMatrix[partial_tour[i]][partial_tour[i + 1]];
      }

      // For each unused city, add minimum cost edge
      for (let i = 0; i < this.n; i++) {
        if (!used[i]) {
          let minEdge = Infinity;
          for (let j = 0; j < this.n; j++) {
            if (i !== j && this.distanceMatrix[i][j] < minEdge) {
              minEdge = this.distanceMatrix[i][j];
            }
          }
          bound += minEdge;
        }
      }

      return bound;
    }
    branchAndBound(partial_tour, used, current_cost) {
      // If all cities are used, check if this is the best tour
      if (partial_tour.length === this.n) {
        const total_cost =
          current_cost +
          this.distanceMatrix[partial_tour[this.n - 1]][partial_tour[0]];
        if (total_cost < this.bestCost) {
          this.bestCost = total_cost;
          this.bestTour = [...partial_tour];
        }
        return;
      }

      // Calculate lower bound for this partial solution
      const bound = this.calculateLowerBound(used, partial_tour);
      if (bound >= this.bestCost) {
        return; // Prune this branch
      }

      // Try each unused city as the next city in the tour
      for (let next = 0; next < this.n; next++) {
        if (!used[next]) {
          const new_cost =
            current_cost +
            (partial_tour.length > 0
              ? this.distanceMatrix[partial_tour[partial_tour.length - 1]][next]
              : 0);

          if (new_cost < this.bestCost) {
            used[next] = true;
            partial_tour.push(next);

            this.branchAndBound(partial_tour, used, new_cost);

            // Backtrack
            partial_tour.pop();
            used[next] = false;
          }
        }
      }
    }

    solve() {
      const used = Array(this.n).fill(false);
      const partial_tour = [];

      // Start from first city
      used[0] = true;
      partial_tour.push(0);

      this.branchAndBound(partial_tour, used, 0);
      return this.bestTour;
    }
  }
  function addToPath(polyPath, latlng, count) {
    polyPath.push(latlng);
    if (count != waypoints.length + 1) {
      new google.maps.Marker({
        position: latlng,
        label: { text: count.toString(), color: "#00FF00" },
        animation: google.maps.Animation.DROP,
        map: map,
      });
    }
  }

  function startNewCalculation() {
    window.location.href = "index.html";
  }

  // Set up event listeners and initialize
  document
    .getElementById("goto-index")
    .addEventListener("click", startNewCalculation);
  let waypointsList = document.getElementById("waypoints-list");

  // Find and display the optimal solution
  const solver = new ExactTSPSolver(waypoints);
  const solution = solver.solve();
  let polyPath = [];
  let count = 0;

  solution.forEach((waypointIndex) => {
    const waypoint = waypoints[waypointIndex];
    const waypointElement = document.createElement("li");
    waypointElement.append(waypoint.name);
    waypointsList.appendChild(waypointElement);
    addToPath(
      polyPath,
      new google.maps.LatLng(
        waypoint.lat / CONVERT_TO_RADIAN_CONST,
        waypoint.lon / CONVERT_TO_RADIAN_CONST
      ),
      ++count
    );
  });

  if (returnToOrigin === "true") {
    addToPath(
      polyPath,
      new google.maps.LatLng(
        waypoints[0].lat / CONVERT_TO_RADIAN_CONST,
        waypoints[0].lon / CONVERT_TO_RADIAN_CONST
      ),
      ++count
    );
  }

  poly.setPath(polyPath);
  poly.setMap(map);
}
