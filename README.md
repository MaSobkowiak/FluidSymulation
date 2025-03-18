# Water Network Flow Simulation

A real-time interactive fluid dynamics simulation for water distribution networks. This web application allows users to design, build, and analyze water network systems with an intuitive visual interface.

![Water Network Simulation](https://i.imgur.com/example.png)

## Features

- **Interactive Network Builder**: Create complex water networks by adding reservoirs, valves, and junctions
- **Real-time Simulation**: Visualize water flow and pressure changes throughout the network
- **Valve Control**: Open/close valves to control flow and observe the effects on the system
- **Parameter Adjustment**: Modify reservoir pressures and pipe diameters to optimize network performance
- **Visual Feedback**: Color-coded flow direction and pressure indicators
- **Responsive Canvas**: Pan and zoom to navigate large network layouts

## Physics Model

The application implements a simplified fluid dynamics model that includes:

- Pressure propagation through connected nodes
- Flow rate calculation based on pressure differentials
- Resistance effects from pipe diameter (based on Darcy-Weisbach principles)
- Valve state effects on network connectivity and pressure isolation
- Iterative convergence for stable pressure distribution

## Technologies

- **React** - Frontend UI library
- **TypeScript** - Type-safe programming
- **Redux** - State management
- **HTML5 Canvas** - High-performance rendering
- **CSS3** - Styling and animations

## Getting Started

### Prerequisites

- Node.js (v14.0 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/fluid-simulation.git
   cd fluid-simulation
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## Usage Guide

### Building a Network

1. Use the node control buttons to select what type of component to add (Reservoir, Valve, Junction)
2. Click on the canvas to place the selected component
3. Toggle to "Connect Nodes" mode and click on two nodes to connect them with a pipe
4. Right-click to cancel selection

### Modifying Network Properties

- Click on a reservoir to adjust its pressure
- Click on a pipe to change its diameter
- Click on a valve during simulation to toggle it open/closed

### Running the Simulation

1. Build your network with at least one reservoir
2. Click "Start Simulation" to observe water flow
3. Modify valve states in real-time to see how it affects the network
4. Click "Stop Simulation" to pause and make structural changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Fluid dynamics equations adapted from civil engineering principles
- UI design inspired by modern network visualization tools 