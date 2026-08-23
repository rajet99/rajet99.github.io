# Autonomous Line-Following & Directed Graph Exploration Robot

An autonomous differential-drive robot that combines closed-loop line tracking with continuous state estimation, topological SLAM (simultaneous localization and mapping) over a grid-based map, shortest-path planning via Dijkstra's algorithm, and directed frontier exploration with ultrasonic obstacle avoidance. Developed with a parter as part of ME129, a Caltech robotics lab course.

## Overview

The robot navigates a discrete graph where tape intersections serve as nodes $(x, y)$ and straight road segments serve as traversable edges along eight compass headings ($45^\circ$ increments).

The software architecture separates into two main layers:
* **Low-Level Sensing and State Estimation:** Continuous first-order IIR filtering with Schmitt-trigger hysteresis thresholds to extract road states, filter floor noise, and recover from off-track deviations.
* **Topological Mapping and Planning:** Graph-based SLAM using Dijkstra's algorithm for known routes and heuristic multi-goal seeding for directed frontier exploration.

## State Estimation and Line Following

The sensor array uses three infrared phototransistors mounted slightly above the floor. Raw sensor readings pass through continuous-time exponential moving averages to prevent single-sample noise, floor scuffs, and crosswalks from triggering false transitions.

### Dynamic Filtering and Hysteresis

Internal confidence levels update during each fast control loop:

$$\text{level}(t) = \text{level}(t - \Delta t) + \frac{\Delta t}{\tau} \big(\text{raw}(t) - \text{level}(t - \Delta t)\big)$$

State transitions rely on an asymmetric hysteresis band:

* **Intersection Detection:** Triggers when all three sensors detect dark tape (1, 1, 1). The time constant requires sustained coverage over the intersection footprint, filtering out thin perpendicular "bike paths", potholes, and tape splices.
* **End-of-Street Detection:** Triggers on sustained (0, 0, 0) readings when centered. The robot executes a short forward pull-through after detection to verify dead ends on short stubs.
* **Road-Side Tracking:** Tracks lateral displacement to detect line departures.
* **Spin-to-Street Detection:** Uses the center IR sensor to confirm when the robot has fully left its previous street and aligned with a new branch during in-place spins.

### Road-Side Estimator and Off-Line Recovery

When the robot loses the line entirely, it references its lateral bias state:

$$\text{raw_{side}} = \begin{cases}  0.0 & \text{Centered: } (0, 1, 0) \\ +0.5 & \text{Slightly Left: } (0, 1, 1) \\ +1.0 & \text{Far Left: } (0, 0, 1) \\ -0.5 & \text{Slightly Right: } (1, 1, 0) \\ -1.0 & \text{Far Right: } (1, 0, 0) \\ \text{level}_{\text{previous}} & \text{Off the Line: } (0, 0, 0) \end{cases}$$

If knocked off the line ((0, 0, 0)), the estimator keeps its integrated directional history instead of resetting to neutral. The controller triggers a corrective spin (left for rightward bias, right for leftward bias) until the line is recaptured. Normal tracking uses a turn-and-hook policy with small turns for minor tracking errors and single-wheel hooks for larger deviations.

### Kinematics and Turn Alignment

* **Intersection Pull-Through:** After detecting an intersection, the robot drives straight briefly to center its differential rotation axis over the intersection centroid before initiating a turn.
* **Angular Odometry:** An analog rate gyroscope is sampled through an ADC interface. Turn angles are calculated by integrating angular velocity:

$$\Delta\theta = \int_{t_{\text{start}}}^{t_{\text{stop}}} \omega(t)\,dt$$

Integrated angles are checked against map-predicted branch angles to enforce alignment to $45^\circ$ increments.

## Topological Mapping and Directed Exploration

The environment is represented as a topological graph where nodes are intersection objects and edges are traversable road segments across eight compass headings (0: North, 1: NW, 2: West, 3: SW, 4: South, 5: SE, 6: East, 7: NE).

Edge states follow a fixed progression: **UNKNOWN &rarr; UNEXPLORED &rarr; {CONNECTED, DEADEND, NONEXISTENT}**

Opposite directions across adjacent intersections update symmetrically during traversal. Because $45^\circ$-adjacent street segments do not physically co-exist on the grid, confirming an edge as connected or unexplored automatically sets adjacent headings at $(h \pm 1) \pmod 8$ to nonexistent.

### Shortest-Path Planning

Dijkstra's algorithm runs on the topological graph using a priority queue. Traversal weights reflect physical distance ($c = 1.0$ for cardinal moves, $c = \sqrt{2}$ for diagonals).

Nodes store single-step exit headings rather than static routes, allowing reactive replanning at each intersection:
1. The target intersection is placed in the priority queue at $\text{Cost} = 0$, with all other nodes initialized to $\text{Cost} = \infty$.
2. Nodes pop in order of lowest cost, evaluating connected and unblocked outgoing edges.
3. For each valid neighbor, candidate cost $\text{Cost}_{\text{curr}} + \text{dist}(h)$ is computed. If lower than the current cost, the neighbor updates and resorts within the queue.

### Exploration Logic

* **Local Discovery:** At an intersection with `UNKNOWN` headings, the robot sweeps rightward to detect branches. If unblocked `UNEXPLORED` edges exist, it takes the nearest one.
* **Global Frontier Routing:** When all local edges are resolved, Dijkstra seeds with all unfinished intersections across the map at $\text{Cost} = 0$. Outward propagation builds a gradient tree routing the robot to the nearest frontier. Exploration finishes once all reachable edges are resolved.
* **Directed Exploration:** When assigned an unvisited coordinate $(x_{\text{goal}}, y_{\text{goal}})$ or when known paths are blocked:
  * **Local Steering:** Unexplored local branches are ranked by Euclidean distance to the target:
    $$\arg\min_{h \in \text{Unexplored}} \sqrt{(x_h - x_{\text{goal}})^2 + (y_h - y_{\text{goal}})^2}$$
  * **Global Heuristic Seeding:** Unfinished candidate intersections are seeded into the Dijkstra queue with a distance penalty:
    $$\text{Cost}_{\text{initial}}(x, y) = 1.5 \cdot \sqrt{(x - x_{\text{goal}})^2 + (y - y_{\text{goal}})^2}$$
    Dijkstra minimizes accumulated path length plus remaining heuristic distance, prioritizing frontiers toward the target. If all paths remain blocked, transient blockage flags reset to retry candidate routes.

## Obstacle Avoidance and Street Traversal

Obstacle detection runs on three ultrasonic sensors triggered in a background thread with randomized timing jitter to avoid acoustic cross-talk.

Readings update sliding sample counters to classify obstacles into zones:
* **Emergency Stop:** Triggered on close-range obstructions directly ahead.
* **Street Clearance:** Checked along cardinal and diagonal paths before committing to branch traversals.

### Obstacle Response Logic

* **Standard Streets:** If an obstacle appears during line following, the robot stops briefly. If the obstruction persists, it executes a mid-street U-turn and tracks back toward the previous intersection. If the return path is also blocked, it performs a second U-turn (capped to prevent heading drift) and halts until the path clears.
* **Dead Ends:** The robot executes an unconditional $180^\circ$ turn at a dead end. If an obstacle appears during the return trip, mid-street U-turns are disabled, and the robot holds position until the corridor clears.