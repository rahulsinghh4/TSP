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

  // Find vertices with odd degree in the MST
  function findOddDegreeVertices(parent) {
    const degree = new Array(parent.length).fill(0);
    const oddVertices = [];

    for (let i = 1; i < parent.length; i++) {
      degree[i]++;
      degree[parent[i]]++;
    }

    for (let i = 0; i < degree.length; i++) {
      if (degree[i] % 2 === 1) {
        oddVertices.push(i);
      }
    }

    return oddVertices;
  }

  // Find minimum weight perfect matching using a greedy approach
  function findMinWeightMatching(vertices, oddVertices) {
    const matching = [];
    const used = new Set();

    oddVertices.sort((a, b) => {
      if (used.has(a) || used.has(b)) return 0;
      return getHaversineDistance(vertices[a], vertices[b]);
    });

    for (let i = 0; i < oddVertices.length; i++) {
      if (!used.has(oddVertices[i])) {
        for (let j = i + 1; j < oddVertices.length; j++) {
          if (!used.has(oddVertices[j])) {
            matching.push([oddVertices[i], oddVertices[j]]);
            used.add(oddVertices[i]);
            used.add(oddVertices[j]);
            break;
          }
        }
      }
    }

    return matching;
  }

  // Combine MST and matching to create Eulerian multigraph
  function createEulerianGraph(parent, matching, n) {
    const graph = Array.from({ length: n }, () => new Array(n).fill(0));

    // Add MST edges
    for (let i = 1; i < parent.length; i++) {
      graph[i][parent[i]] = 1;
      graph[parent[i]][i] = 1;
    }

    // Add matching edges
    for (const [u, v] of matching) {
      graph[u][v] = 1;
      graph[v][u] = 1;
    }

    return graph;
  }

  // Find Eulerian circuit using Hierholzer's algorithm
  function findEulerianCircuit(graph) {
    const n = graph.length;
    const circuit = [];
    const stack = [0];

    while (stack.length > 0) {
      const v = stack[stack.length - 1];
      let found = false;

      for (let u = 0; u < n; u++) {
        if (graph[v][u] > 0) {
          stack.push(u);
          graph[v][u]--;
          graph[u][v]--;
          found = true;
          break;
        }
      }

      if (!found) {
        circuit.push(stack.pop());
      }
    }

    return circuit.reverse();
  }

  // Convert Eulerian circuit to Hamiltonian cycle by removing duplicates
  function makeHamiltonianCycle(circuit) {
    const visited = new Set();
    const cycle = [];

    for (const vertex of circuit) {
      if (!visited.has(vertex)) {
        cycle.push(vertex);
        visited.add(vertex);
      }
    }

    return cycle;
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

  // Main Christofides algorithm implementation
  function findOptimalRoute(waypoints) {
    // 1. Find MST
    const mst = findMST(waypoints);

    // 2. Find vertices with odd degree
    const oddVertices = findOddDegreeVertices(mst);

    // 3. Find minimum weight perfect matching
    const matching = findMinWeightMatching(waypoints, oddVertices);

    // 4. Combine MST and matching to create Eulerian multigraph
    const eulerianGraph = createEulerianGraph(mst, matching, waypoints.length);

    // 5. Find Eulerian circuit
    const eulerianCircuit = findEulerianCircuit(eulerianGraph);

    // 6. Convert to Hamiltonian cycle
    const solution = makeHamiltonianCycle(eulerianCircuit);

    return solution;
  }

  // Set up event listeners and initialize
  document
    .getElementById("goto-index")
    .addEventListener("click", startNewCalculation);
  let waypointsList = document.getElementById("waypoints-list");

  // Find and display the solution
  const solution = findOptimalRoute(waypoints);
  let polyPath = [];
  let count = 0;
  let waypointElement = null;

  solution.forEach((waypointIndex) => {
    const waypoint = waypoints[waypointIndex];
    waypointElement = document.createElement("li");
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
