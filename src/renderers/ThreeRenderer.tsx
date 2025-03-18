import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RootState } from '../store';
import { Node, Edge } from '../types';
import { toggleValve } from '../store/simulationSlice';

interface ThreeRendererProps {
  width: number;
  height: number;
}

const ThreeRenderer: React.FC<ThreeRendererProps> = ({ width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgeObjectsRef = useRef<Map<string, THREE.Line>>(new Map());

  const dispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.simulation.network);
  const isSimulationRunning = useSelector((state: RootState) => state.simulation.isSimulationRunning);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [width, height]);

  const createNodeGeometry = (node: Node): THREE.BufferGeometry => {
    switch (node.type) {
      case 'junction':
        return new THREE.SphereGeometry(1);
      case 'valve':
        return new THREE.BoxGeometry(2, 2, 2);
      case 'reservoir':
        return new THREE.CylinderGeometry(2, 2, 4);
      default:
        return new THREE.SphereGeometry(1);
    }
  };

  const createNodeMaterial = (node: Node): THREE.Material => {
    const color = node.type === 'valve' 
      ? (node.isOpen ? 0x2ECC71 : 0xE74C3C)
      : node.type === 'reservoir' 
        ? 0x3498DB 
        : 0x4A90E2;

    return new THREE.MeshPhongMaterial({ color });
  };

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear previous objects
    nodeObjectsRef.current.forEach(obj => obj.removeFromParent());
    nodeObjectsRef.current.clear();
    edgeObjectsRef.current.forEach(obj => obj.removeFromParent());
    edgeObjectsRef.current.clear();

    // Create node objects
    nodes.forEach(node => {
      const geometry = createNodeGeometry(node);
      const material = createNodeMaterial(node);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      sceneRef.current?.add(mesh);
      nodeObjectsRef.current.set(node.id, mesh);

      // Add pressure label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 64;
        canvas.height = 32;
        context.fillStyle = 'white';
        context.fillRect(0, 0, 64, 32);
        context.fillStyle = 'black';
        context.font = '12px Arial';
        context.fillText(`${node.pressure.toFixed(1)}`, 5, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(node.position.x + 2, node.position.y + 2, node.position.z);
        sprite.scale.set(5, 2.5, 1);
        sceneRef.current?.add(sprite);
      }
    });

    // Create edge objects
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      
      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
          new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x0000ff,
          opacity: Math.min(Math.abs(edge.flowRate) / 10, 1),
          transparent: true,
          linewidth: edge.diameter
        });
        
        const line = new THREE.Line(geometry, material);
        sceneRef.current?.add(line);
        edgeObjectsRef.current.set(edge.id, line);

        // Add flow rate label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = 64;
          canvas.height = 32;
          context.fillStyle = 'white';
          context.fillRect(0, 0, 64, 32);
          context.fillStyle = 'black';
          context.font = '12px Arial';
          context.fillText(`${edge.flowRate.toFixed(1)}`, 5, 20);
          
          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
          const sprite = new THREE.Sprite(spriteMaterial);
          const midPoint = new THREE.Vector3().addVectors(
            points[0],
            points[1]
          ).multiplyScalar(0.5);
          sprite.position.copy(midPoint);
          sprite.scale.set(5, 2.5, 1);
          sceneRef.current?.add(sprite);
        }
      }
    });
  }, [nodes, edges, isSimulationRunning]);

  const handleClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(Array.from(nodeObjectsRef.current.values()));

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const clickedNodeId = Array.from(nodeObjectsRef.current.entries())
        .find(([_, mesh]) => mesh === clickedMesh)?.[0];

      if (clickedNodeId) {
        const node = nodes.find(n => n.id === clickedNodeId);
        if (node?.type === 'valve') {
          dispatch(toggleValve(clickedNodeId));
        }
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      onClick={handleClick}
      style={{ width, height }}
    />
  );
};

export default ThreeRenderer; 