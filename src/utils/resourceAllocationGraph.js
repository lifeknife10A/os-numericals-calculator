function createProcessIds(processCount) {
  return Array.from({ length: processCount }, (_, index) => `P${index}`);
}

function createResourceIds(resourceCount) {
  return Array.from({ length: resourceCount }, (_, index) => `R${index}`);
}

function normalizeNodeName(value) {
  return String(value).trim().toUpperCase();
}

function parseEdges(text, label, firstPrefix, secondPrefix) {
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const parts = line
      .replace(/->/g, " ")
      .replace(/,/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizeNodeName);

    if (parts.length !== 2) {
      throw new Error(`${label} row ${index + 1} must be like ${firstPrefix}0 ${secondPrefix}1.`);
    }

    if (!parts[0].startsWith(firstPrefix) || !parts[1].startsWith(secondPrefix)) {
      throw new Error(`${label} row ${index + 1} must be ${firstPrefix} to ${secondPrefix}.`);
    }

    return {
      from: parts[0],
      to: parts[1],
    };
  });
}

function validateNodeExists(nodeName, validNodes, label) {
  if (!validNodes.includes(nodeName)) {
    throw new Error(`${label} uses invalid node ${nodeName}.`);
  }
}

function findCycle(nodes, edges) {
  const graph = {};
  const visited = {};
  const inStack = {};
  const parent = {};

  nodes.forEach((node) => {
    graph[node] = [];
    visited[node] = false;
    inStack[node] = false;
  });

  edges.forEach((edge) => {
    graph[edge.from].push(edge.to);
  });

  function depthFirstSearch(node) {
    visited[node] = true;
    inStack[node] = true;

    for (const nextNode of graph[node]) {
      if (!visited[nextNode]) {
        parent[nextNode] = node;
        const cycle = depthFirstSearch(nextNode);

        if (cycle.length > 0) {
          return cycle;
        }
      } else if (inStack[nextNode]) {
        const cycle = [nextNode];
        let currentNode = node;

        while (currentNode !== nextNode && currentNode !== undefined) {
          cycle.unshift(currentNode);
          currentNode = parent[currentNode];
        }

        cycle.push(nextNode);
        return cycle;
      }
    }

    inStack[node] = false;
    return [];
  }

  for (const node of nodes) {
    if (!visited[node]) {
      const cycle = depthFirstSearch(node);

      if (cycle.length > 0) {
        return cycle;
      }
    }
  }

  return [];
}

export function calculateResourceAllocationGraph({
  processCount,
  resourceInstances,
  allocationText,
  requestText,
}) {
  if (!Number.isInteger(processCount) || processCount <= 0) {
    throw new Error("Number of processes must be a positive whole number.");
  }

  if (resourceInstances.length === 0) {
    throw new Error("Enter at least one resource type.");
  }

  const hasInvalidResource = resourceInstances.some(
    (instanceCount) => !Number.isInteger(instanceCount) || instanceCount <= 0,
  );

  if (hasInvalidResource) {
    throw new Error("Resource instances must be positive whole numbers.");
  }

  const processes = createProcessIds(processCount);
  const resources = createResourceIds(resourceInstances.length);
  const allocationEdges = parseEdges(allocationText, "Allocation edge", "R", "P");
  const requestEdges = parseEdges(requestText, "Request edge", "P", "R");
  const validNodes = [...processes, ...resources];

  allocationEdges.forEach((edge) => {
    validateNodeExists(edge.from, resources, "Allocation edge");
    validateNodeExists(edge.to, processes, "Allocation edge");
  });

  requestEdges.forEach((edge) => {
    validateNodeExists(edge.from, processes, "Request edge");
    validateNodeExists(edge.to, resources, "Request edge");
  });

  const allocatedCountByResource = {};

  resources.forEach((resourceId) => {
    allocatedCountByResource[resourceId] = 0;
  });

  allocationEdges.forEach((edge) => {
    allocatedCountByResource[edge.from] += 1;
  });

  resources.forEach((resourceId, index) => {
    if (allocatedCountByResource[resourceId] > resourceInstances[index]) {
      throw new Error(`${resourceId} has more allocation edges than available instances.`);
    }
  });

  const availableInstances = resources.map(
    (resourceId, index) => resourceInstances[index] - allocatedCountByResource[resourceId],
  );
  const allEdges = [...requestEdges, ...allocationEdges];
  const cycle = findCycle(validNodes, allEdges);
  const hasCycle = cycle.length > 0;
  const hasOnlySingleInstanceResources = resourceInstances.every((count) => count === 1);
  const conclusion = hasCycle
    ? hasOnlySingleInstanceResources
      ? "Cycle found. Since every resource has one instance, deadlock is present."
      : "Cycle found. With multiple instances, this means deadlock is possible and needs further checking."
    : "No cycle found, so deadlock is not present in the graph.";

  return {
    processes,
    resources,
    resourceInstances,
    allocationEdges,
    requestEdges,
    availableInstances,
    allocatedCountByResource,
    cycle,
    hasCycle,
    hasOnlySingleInstanceResources,
    conclusion,
    stepMessages: [
      "Draw process nodes as circles and resource nodes as boxes.",
      "Request edge means process is waiting: Pi -> Rj.",
      "Assignment edge means resource is allocated: Rj -> Pi.",
      `Allocation edges = ${allocationEdges.length}, Request edges = ${requestEdges.length}.`,
      hasCycle
        ? `Cycle detected: ${cycle.join(" -> ")}.`
        : "No directed cycle is detected in the resource allocation graph.",
      conclusion,
    ],
    examLines: [
      {
        label: "Given",
        value: `${processes.length} processes and ${resources.length} resource types.`,
      },
      {
        label: "Formula",
        value:
          "Request edge: Process -> Resource. Assignment edge: Resource -> Process. Check for directed cycle.",
      },
      {
        label: "Substitution",
        value: hasCycle ? `Cycle = ${cycle.join(" -> ")}` : "No cycle found.",
      },
      {
        label: "Final Answer",
        value: conclusion,
      },
    ],
  };
}
