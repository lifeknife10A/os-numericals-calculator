import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  MetricCards,
  Section,
  SimpleTable,
  StepList,
  TextAreaField,
} from "../components/Common";
import { formatNumber } from "../utils/formatters";
import { parseIntegerList } from "../utils/parsers";
import { calculateResourceAllocationGraph } from "../utils/resourceAllocationGraph";
import { saveRecentCalculation } from "../utils/storage";

function getProcessPosition(index, totalCount) {
  const spacing = 360 / Math.max(totalCount - 1, 1);
  return {
    x: 155,
    y: totalCount === 1 ? 260 : 80 + index * spacing,
  };
}

function getResourcePosition(index, totalCount) {
  const spacing = 360 / Math.max(totalCount - 1, 1);
  return {
    x: 595,
    y: totalCount === 1 ? 260 : 80 + index * spacing,
  };
}

function createEdgePath(fromPoint, toPoint, index, direction) {
  const offset = (index % 4) * 12;
  const curveDirection = direction === "request" ? 1 : -1;
  const controlXOne = fromPoint.x + (toPoint.x - fromPoint.x) * 0.35;
  const controlXTwo = fromPoint.x + (toPoint.x - fromPoint.x) * 0.65;
  const controlYOne = fromPoint.y + curveDirection * offset;
  const controlYTwo = toPoint.y + curveDirection * offset;

  return `M ${fromPoint.x} ${fromPoint.y} C ${controlXOne} ${controlYOne}, ${controlXTwo} ${controlYTwo}, ${toPoint.x} ${toPoint.y}`;
}

function ResourceAllocationGraphVisual({ result }) {
  const processPositions = {};
  const resourcePositions = {};
  const nodeSetInCycle = new Set(result.cycle);
  const edgeSetInCycle = new Set();

  result.cycle.forEach((node, index) => {
    if (index < result.cycle.length - 1) {
      edgeSetInCycle.add(`${node}->${result.cycle[index + 1]}`);
    }
  });

  result.processes.forEach((processId, index) => {
    processPositions[processId] = getProcessPosition(index, result.processes.length);
  });

  result.resources.forEach((resourceId, index) => {
    resourcePositions[resourceId] = getResourcePosition(index, result.resources.length);
  });

  const requestEdges = result.requestEdges.map((edge, index) => ({
    ...edge,
    index,
    type: "request",
    fromPoint: {
      x: processPositions[edge.from].x + 54,
      y: processPositions[edge.from].y,
    },
    toPoint: {
      x: resourcePositions[edge.to].x - 70,
      y: resourcePositions[edge.to].y,
    },
  }));
  const allocationEdges = result.allocationEdges.map((edge, index) => ({
    ...edge,
    index,
    type: "allocation",
    fromPoint: {
      x: resourcePositions[edge.from].x - 70,
      y: resourcePositions[edge.from].y + 20,
    },
    toPoint: {
      x: processPositions[edge.to].x + 54,
      y: processPositions[edge.to].y + 20,
    },
  }));
  const edges = [...requestEdges, ...allocationEdges];

  return (
    <Section title="Resource Allocation Graph">
      <div className="overflow-x-auto">
        <svg
          className="min-w-[820px] rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
          viewBox="0 0 760 560"
          role="img"
          aria-label="Resource allocation graph"
        >
          <defs>
            <marker
              id="request-arrow"
              markerHeight="10"
              markerWidth="10"
              orient="auto"
              refX="8"
              refY="3"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#f97316" />
            </marker>
            <marker
              id="allocation-arrow"
              markerHeight="10"
              markerWidth="10"
              orient="auto"
              refX="8"
              refY="3"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#14b8a6" />
            </marker>
            <marker
              id="cycle-arrow"
              markerHeight="10"
              markerWidth="10"
              orient="auto"
              refX="8"
              refY="3"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
            </marker>
          </defs>

          <rect x="28" y="28" width="704" height="504" rx="22" fill="none" stroke="#334155" />
          <text x="72" y="58" className="fill-slate-700 text-sm font-bold dark:fill-slate-200">
            Processes
          </text>
          <text x="548" y="58" className="fill-slate-700 text-sm font-bold dark:fill-slate-200">
            Resources
          </text>

          {edges.map((edge) => {
            const edgeKey = `${edge.from}->${edge.to}`;
            const isCycleEdge = edgeSetInCycle.has(edgeKey);
            const strokeColor = isCycleEdge
              ? "#ef4444"
              : edge.type === "request"
                ? "#f97316"
                : "#14b8a6";
            const marker = isCycleEdge
              ? "url(#cycle-arrow)"
              : edge.type === "request"
                ? "url(#request-arrow)"
                : "url(#allocation-arrow)";

            return (
              <path
                d={createEdgePath(edge.fromPoint, edge.toPoint, edge.index, edge.type)}
                fill="none"
                key={`${edge.type}-${edge.from}-${edge.to}-${edge.index}`}
                markerEnd={marker}
                stroke={strokeColor}
                strokeLinecap="round"
                strokeWidth={isCycleEdge ? "4" : "3"}
              />
            );
          })}

          {result.processes.map((processId) => {
            const point = processPositions[processId];
            const isInCycle = nodeSetInCycle.has(processId);

            return (
              <g key={processId}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  fill={isInCycle ? "#7f1d1d" : "#0f172a"}
                  r="54"
                  stroke={isInCycle ? "#ef4444" : "#06b6d4"}
                  strokeWidth="4"
                />
                <text
                  x={point.x}
                  y={point.y + 7}
                  textAnchor="middle"
                  className="fill-white text-xl font-bold"
                >
                  {processId}
                </text>
              </g>
            );
          })}

          {result.resources.map((resourceId, index) => {
            const point = resourcePositions[resourceId];
            const instanceCount = result.resourceInstances[index];
            const availableCount = result.availableInstances[index];
            const isInCycle = nodeSetInCycle.has(resourceId);

            return (
              <g key={resourceId}>
                <rect
                  fill={isInCycle ? "#7f1d1d" : "#0f172a"}
                  height="92"
                  rx="14"
                  stroke={isInCycle ? "#ef4444" : "#14b8a6"}
                  strokeWidth="4"
                  width="140"
                  x={point.x - 70}
                  y={point.y - 46}
                />
                <text
                  x={point.x}
                  y={point.y - 16}
                  textAnchor="middle"
                  className="fill-white text-lg font-bold"
                >
                  {resourceId}
                </text>
                <text
                  x={point.x}
                  y={point.y + 8}
                  textAnchor="middle"
                  className="fill-slate-200 text-xs font-semibold"
                >
                  Available {availableCount}/{instanceCount}
                </text>
                {Array.from({ length: instanceCount }).slice(0, 8).map((_, dotIndex) => (
                  <circle
                    cx={point.x - 42 + (dotIndex % 4) * 28}
                    cy={point.y + 27 + Math.floor(dotIndex / 4) * 16}
                    fill={dotIndex < availableCount ? "#22c55e" : "#64748b"}
                    key={dotIndex}
                    r="6"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="exam-line">
          <span className="font-semibold text-orange-500">Orange edge: </span>
          Request, process waits for resource.
        </div>
        <div className="exam-line">
          <span className="font-semibold text-teal-500">Green edge: </span>
          Assignment, resource is allocated.
        </div>
        <div className="exam-line">
          <span className="font-semibold text-red-500">Red highlight: </span>
          Cycle path.
        </div>
      </div>
    </Section>
  );
}

export default function ResourceAllocationGraphCalculator() {
  const [processCount, setProcessCount] = useState("3");
  const [resourceInstances, setResourceInstances] = useState("1 1 1");
  const [allocationText, setAllocationText] = useState("R0 P1\nR1 P2\nR2 P0");
  const [requestText, setRequestText] = useState("P0 R0\nP1 R1\nP2 R2");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const nextResult = calculateResourceAllocationGraph({
        processCount: Number(processCount),
        resourceInstances: parseIntegerList(resourceInstances, "Resource instances"),
        allocationText,
        requestText,
      });
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Resource Allocation Graph",
        nextResult.hasCycle ? "Cycle detected" : "No cycle",
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setProcessCount("3");
    setResourceInstances("1 1 1");
    setAllocationText("R0 P1\nR1 P2\nR2 P0");
    setRequestText("P0 R0\nP1 R1\nP2 R2");
    setResult(null);
    setErrorMessage("");
  }

  function fillNoDeadlockExample() {
    setProcessCount("3");
    setResourceInstances("2 1 1");
    setAllocationText("R0 P0\nR1 P1");
    setRequestText("P1 R0\nP2 R2");
    setResult(null);
    setErrorMessage("");
  }

  function resetForm() {
    setProcessCount("");
    setResourceInstances("");
    setAllocationText("");
    setRequestText("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Number of Processes"
              value={processCount}
              onChange={setProcessCount}
              type="number"
            />
            <Field
              label="Resource Instances"
              value={resourceInstances}
              onChange={setResourceInstances}
              placeholder="Example: 1 1 1"
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <TextAreaField
              label="Allocation Edges: Resource Process"
              value={allocationText}
              onChange={setAllocationText}
              placeholder="Example: R0 P1"
              rows={5}
            />
            <TextAreaField
              label="Request Edges: Process Resource"
              value={requestText}
              onChange={setRequestText}
              placeholder="Example: P1 R0"
              rows={5}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <button className="small-button" type="button" onClick={fillNoDeadlockExample}>
            No Deadlock Example
          </button>
        </div>
        <div className="mt-3">
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <ResourceAllocationGraphVisual result={result} />

          <Section title="Graph Summary">
            <MetricCards
              items={[
                {
                  label: "Cycle",
                  value: result.hasCycle ? "Found" : "None",
                  note: result.hasCycle ? result.cycle.join(" -> ") : "Graph is acyclic",
                },
                {
                  label: "Processes",
                  value: result.processes.length,
                  note: result.processes.join(", "),
                },
                {
                  label: "Resources",
                  value: result.resources.length,
                  note: result.resources
                    .map((resourceId, index) => `${resourceId}:${result.resourceInstances[index]}`)
                    .join(", "),
                },
                {
                  label: "Available",
                  value: result.availableInstances.map(formatNumber).join(", "),
                  note: "Free instances per resource",
                },
              ]}
            />
          </Section>

          <Section title="Edge Table">
            <SimpleTable
              columns={[
                { key: "type", label: "Type", render: (row) => row.type },
                { key: "from", label: "From", render: (row) => row.from },
                { key: "to", label: "To", render: (row) => row.to },
                { key: "meaning", label: "Meaning", render: (row) => row.meaning },
              ]}
              rows={[
                ...result.requestEdges.map((edge, index) => ({
                  id: `request-${index}`,
                  ...edge,
                  type: "Request",
                  meaning: `${edge.from} is waiting for ${edge.to}`,
                })),
                ...result.allocationEdges.map((edge, index) => ({
                  id: `allocation-${index}`,
                  ...edge,
                  type: "Allocation",
                  meaning: `${edge.from} is allocated to ${edge.to}`,
                })),
              ]}
            />
          </Section>

          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
