import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";

interface Window {
  __PAYLOAD_COLLECTIONS__: CollectionInfo[];
}

interface CollectionInfo {
  slug: string;
  name: string;
  label?: string;
  fields: FieldInfo[];
}

interface FieldInfo {
  name: string;
  type:
    | "relationship"
    | "text"
    | "number"
    | "boolean"
    | "array"
    | "group"
    | "richText"
    | "upload"
    | "blocks"
    | "json"
    | "date"
    | "email"
    | "textarea"
    | "select"
    | "code"
    | "point"
    | "radio"
    | "checkbox"
    | "row"
    | "collapsible";
  relationTo?: string;
}

export default function PayloadVisualizerScreen() {
  // Get collections from global variable
  const collections: CollectionInfo[] =
    (window as unknown as Window).__PAYLOAD_COLLECTIONS__ || [];

  // Transform collections to nodes
  const nodes = useMemo(() => {
    if (collections.length === 0) {
      return [
        {
          id: "empty",
          position: { x: 0, y: 0 },
          data: { label: "No collections found" },
          type: "default"
        }
      ];
    }
    return collections.map((collection, index) => ({
      id: collection.slug,
      position: { x: index * 250, y: index * 100 },
      data: { label: collection.label || collection.name },
      type: "default"
    }));
  }, [collections]);

  // Transform to edges for relationship fields
  const edges = useMemo(() => {
    if (collections.length === 0) {
      return [];
    }
    return collections.flatMap((collection) =>
      collection.fields
        .filter((field) => field.type === "relationship" && field.relationTo)
        .map((field) => ({
          id: `${collection.slug}-${field.name}`,
          source: collection.slug,
          target: field.relationTo || "",
          label: field.name,
          type: "smoothstep" as const
        }))
    );
  }, [collections]);

  const [nodeState, setNodeState] = useState<Node[]>(nodes);
  const [edgeState, setEdgeState] = useState<Edge[]>(edges);

  // Update state when nodes/edges change
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) =>
      setNodeState((nds) => applyNodeChanges(changes, nds) as Node[]),
    []
  );
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) =>
      setEdgeState((eds) => applyEdgeChanges(changes, eds) as Edge[]),
    []
  );
  const onConnect = useCallback(
    (params: Parameters<typeof addEdge>[0]) =>
      setEdgeState((eds) => addEdge(params, eds) as Edge[]),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodeState}
        edges={edgeState}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
        />
      </ReactFlow>
    </div>
  );
}
