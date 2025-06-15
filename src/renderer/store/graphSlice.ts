import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Node {
  id: string;
  label: string;
  csa?: number | null;
  colour?: string | null;
  optionCode?: string | null;
  // Add other node properties as needed
}

interface Edge {
  id: string;
  source: string;
  target: string;
  // Add other edge properties as needed
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
}

const initialState: GraphState = {
  nodes: [
    { id: 'W001', label: 'Node 1', csa: 0.5, colour: 'RED', optionCode: 'OP01' },
    { id: 'W002', label: 'Node 2', csa: 0.75, colour: 'BLUE', optionCode: 'OP02' },
    { id: 'W003', label: 'Node 3', csa: 1.0, colour: 'GREEN', optionCode: 'OP03' },
  ],
  edges: [],
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setInitialNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    setInitialEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    updateNodeData: (state, action: PayloadAction<{ nodeId: string; newData: Partial<Node> }>) => {
      // TODO: IPC call to main process to persist this change (action.payload.nodeId, action.payload.newData)
      const node = state.nodes.find(n => n.id === action.payload.nodeId);
      if (node) {
        Object.assign(node, action.payload.newData);
      }
    },
    updateNodePosition: (state, action: PayloadAction<{ nodeId: string; x: number; y: number }>) => {
      // TODO: IPC call to main process to persist this change (action.payload.nodeId, {x, y})
      // This reducer assumes nodes have a 'position' property, which React Flow uses.
      // If your Node interface doesn't have it, you might need to adjust or add it.
      // For now, we'll assume 'label' can be updated as a proxy if 'position' is not directly on the Node model.
      // This is a conceptual placeholder. In a real React Flow setup, node position is often managed by React Flow's
      // internal state and then synced back if needed, or by directly updating a 'position' field in your Redux node.
      const node = state.nodes.find(n => n.id === action.payload.nodeId);
      if (node) {
        // TODO: When React Flow is integrated, update the actual 'position' field on the Node object
        // if the Node interface is extended with `position: { x: number, y: number }`.
        // Example:
        // if (!node.position) node.position = { x: 0, y: 0 };
        // node.position.x = action.payload.x;
        // node.position.y = action.payload.y;

        // As a visible proxy for now, let's update the label to show the position change
        node.label = `${node.label.split(' @')[0]} @ (${action.payload.x}, ${action.payload.y})`;
        console.log(`Simulated position update for ${action.payload.nodeId}: (${action.payload.x}, ${action.payload.y})`);
      }
    },
    // Potential updateEdgeData - can be added if edges become editable
    // updateEdgeData: (state, action: PayloadAction<{ edgeId: string; newData: Partial<Edge> }>) => {
    //   // TODO: IPC call to main process to persist this change
    //   const edge = state.edges.find(e => e.id === action.payload.edgeId);
    //   if (edge) {
    //     Object.assign(edge, action.payload.newData);
    //   }
    // },
  },
});

export const { setInitialNodes, setInitialEdges, updateNodeData, updateNodePosition } = graphSlice.actions;
export default graphSlice.reducer;
