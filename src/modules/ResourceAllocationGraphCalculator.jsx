import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  GitBranch,
  Network,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  ErrorMessage,
  ExamFormat,
  Field,
  MetricCards,
  SimpleTable,
  StepList,
  TextAreaField,
} from "../components/Common";
import { formatNumber } from "../utils/formatters";
import { parseIntegerList } from "../utils/parsers";
import { calculateResourceAllocationGraph } from "../utils/resourceAllocationGraph";
import { saveRecentCalculation } from "../utils/storage";

const graphCenter = { x: 450, y: 315 };

function getNodeKind(nodeId) {
  return nodeId.startsWith("P") ? "process" : "resource";
}

function getNodeLabel(nodeId) {
  return getNodeKind(nodeId) === "process" ? "Process" : "Resource";
}

function getDisplayNodes(result) {
  const orderedNodes = [];

  if (result.hasCycle) {
    result.cycle.slice(0, -1).forEach((nodeId) => {
      if (!orderedNodes.includes(nodeId)) {
        orderedNodes.push(nodeId);
      }
    });
  }

  const maximumCount = Math.max(result.processes.length, result.resources.length);

  for (let index = 0; index < maximumCount; index += 1) {
    if (result.processes[index] && !orderedNodes.includes(result.processes[index])) {
      orderedNodes.push(result.processes[index]);
    }

    if (result.resources[index] && !orderedNodes.includes(result.resources[index])) {
      orderedNodes.push(result.resources[index]);
    }
  }

  return orderedNodes;
}

function getNodePositions(nodes) {
  const positions = {};
  const radius = nodes.length <= 4 ? 185 : 230;
  const startAngle = -Math.PI / 2;
  const angleStep = (Math.PI * 2) / Math.max(nodes.length, 1);

  nodes.forEach((nodeId, index) => {
    const angle = startAngle + angleStep * index;
    positions[nodeId] = {
      x: graphCenter.x + Math.cos(angle) * radius,
      y: graphCenter.y + Math.sin(angle) * radius,
    };
  });

  return positions;
}

function getCycleEdgeSet(result) {
  const edgeSet = new Set();

  result.cycle.forEach((nodeId, index) => {
    if (index < result.cycle.length - 1) {
      edgeSet.add(`${nodeId}->${result.cycle[index + 1]}`);
    }
  });

  return edgeSet;
}

function getEdgePath(fromPoint, toPoint, index) {
  const xDistance = toPoint.x - fromPoint.x;
  const yDistance = toPoint.y - fromPoint.y;
  const edgeLength = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

  if (edgeLength === 0) {
    return "";
  }

  const xUnit = xDistance / edgeLength;
  const yUnit = yDistance / edgeLength;
  const fromRadius = getNodeKind(fromPoint.id) === "process" ? 50 : 58;
  const toRadius = getNodeKind(toPoint.id) === "process" ? 50 : 58;
  const startX = fromPoint.x + xUnit * fromRadius;
  const startY = fromPoint.y + yUnit * fromRadius;
  const endX = toPoint.x - xUnit * toRadius;
  const endY = toPoint.y - yUnit * toRadius;
  const middleX = (startX + endX) / 2;
  const middleY = (startY + endY) / 2;
  const xFromCenter = middleX - graphCenter.x;
  const yFromCenter = middleY - graphCenter.y;
  const centerDistance = Math.sqrt(xFromCenter * xFromCenter + yFromCenter * yFromCenter);
  const curveAmount = 48 + (index % 3) * 12;
  let controlX = middleX - yUnit * curveAmount;
  let controlY = middleY + xUnit * curveAmount;

  if (centerDistance > 0) {
    controlX = middleX + (xFromCenter / centerDistance) * curveAmount;
    controlY = middleY + (yFromCenter / centerDistance) * curveAmount;
  }

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}

function getAllEdges(result) {
  const requestEdges = result.requestEdges.map((edge, index) => ({
    ...edge,
    id: `request-${index}`,
    type: "request",
    label: "Request",
    meaning: `${edge.from} waits for ${edge.to}`,
  }));
  const allocationEdges = result.allocationEdges.map((edge, index) => ({
    ...edge,
    id: `allocation-${index}`,
    type: "allocation",
    label: "Allocation",
    meaning: `${edge.from} is allocated to ${edge.to}`,
  }));

  return [...requestEdges, ...allocationEdges];
}

function ResourceNode({ nodeId, point, result, isInCycle, index }) {
  const resourceIndex = result.resources.indexOf(nodeId);
  const instanceCount = result.resourceInstances[resourceIndex] || 0;
  const availableCount = result.availableInstances[resourceIndex] || 0;
  const usedCount = instanceCount - availableCount;
  const visibleDots = Math.min(instanceCount, 8);

  return (
    <g
      className="rag-node-pop"
      style={{ animationDelay: `${index * 55}ms` }}
      transform={`translate(${point.x}, ${point.y})`}
    >
      <rect
        x="-66"
        y="-52"
        width="132"
        height="104"
        rx="18"
        fill={isInCycle ? "#451a1a" : "#102132"}
        stroke={isInCycle ? "#fb7185" : "#2dd4bf"}
        strokeWidth={isInCycle ? "5" : "4"}
      />
      <text
        y="-14"
        textAnchor="middle"
        className="fill-white text-[24px] font-black"
      >
        {nodeId}
      </text>
      <text
        y="10"
        textAnchor="middle"
        className="fill-slate-300 text-[12px] font-bold uppercase"
      >
        {availableCount}/{instanceCount} free
      </text>
      {Array.from({ length: visibleDots }).map((_, dotIndex) => (
        <circle
          key={dotIndex}
          cx={-36 + (dotIndex % 4) * 24}
          cy={30 + Math.floor(dotIndex / 4) * 16}
          r="6"
          fill={dotIndex < usedCount ? "#64748b" : "#22c55e"}
        />
      ))}
    </g>
  );
}

function ProcessNode({ nodeId, point, isInCycle, index }) {
  return (
    <g
      className="rag-node-pop"
      style={{ animationDelay: `${index * 55}ms` }}
      transform={`translate(${point.x}, ${point.y})`}
    >
      <circle
        r="52"
        fill={isInCycle ? "#451a1a" : "#0f2435"}
        stroke={isInCycle ? "#fb7185" : "#38bdf8"}
        strokeWidth={isInCycle ? "5" : "4"}
      />
      <circle r="36" fill="rgba(15, 23, 42, 0.72)" />
      <text y="8" textAnchor="middle" className="fill-white text-[25px] font-black">
        {nodeId}
      </text>
      <text y="70" textAnchor="middle" className="fill-slate-300 text-[12px] font-bold uppercase">
        Process
      </text>
    </g>
  );
}

function ResourceAllocationGraphCanvas({ result }) {
  const displayNodes = getDisplayNodes(result);
  const nodePositions = getNodePositions(displayNodes);
  const nodeSetInCycle = new Set(result.cycle);
  const edgeSetInCycle = getCycleEdgeSet(result);
  const allEdges = getAllEdges(result).filter(
    (edge) => nodePositions[edge.from] && nodePositions[edge.to],
  );
  const normalEdges = allEdges.filter((edge) => !edgeSetInCycle.has(`${edge.from}->${edge.to}`));
  const cycleEdges = allEdges.filter((edge) => edgeSetInCycle.has(`${edge.from}->${edge.to}`));
  const orderedEdges = [...normalEdges, ...cycleEdges];

  return (
    <svg
      className="min-w-[860px]"
      viewBox="0 0 900 630"
      role="img"
      aria-label="Resource allocation graph cycle simulator"
    >
      <defs>
        <marker
          id="rag-request-arrow"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          orient="auto"
          refX="10"
          refY="4"
        >
          <path d="M0,0 L0,8 L11,4 z" fill="#f97316" />
        </marker>
        <marker
          id="rag-allocation-arrow"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          orient="auto"
          refX="10"
          refY="4"
        >
          <path d="M0,0 L0,8 L11,4 z" fill="#2dd4bf" />
        </marker>
        <marker
          id="rag-cycle-arrow"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          orient="auto"
          refX="10"
          refY="4"
        >
          <path d="M0,0 L0,8 L11,4 z" fill="#fb7185" />
        </marker>
      </defs>

      <circle
        cx={graphCenter.x}
        cy={graphCenter.y}
        r="250"
        fill="none"
        stroke="rgba(148, 163, 184, 0.18)"
        strokeDasharray="8 10"
      />
      <circle
        cx={graphCenter.x}
        cy={graphCenter.y}
        r="164"
        fill="none"
        stroke="rgba(20, 184, 166, 0.12)"
      />

      {orderedEdges.map((edge, index) => {
        const isCycleEdge = edgeSetInCycle.has(`${edge.from}->${edge.to}`);
        const fromPoint = { ...nodePositions[edge.from], id: edge.from };
        const toPoint = { ...nodePositions[edge.to], id: edge.to };
        const strokeColor = isCycleEdge
          ? "#fb7185"
          : edge.type === "request"
            ? "#f97316"
            : "#2dd4bf";
        const markerId = isCycleEdge
          ? "url(#rag-cycle-arrow)"
          : edge.type === "request"
            ? "url(#rag-request-arrow)"
            : "url(#rag-allocation-arrow)";

        return (
          <path
            key={edge.id}
            d={getEdgePath(fromPoint, toPoint, index)}
            fill="none"
            markerEnd={markerId}
            stroke={strokeColor}
            strokeLinecap="round"
            strokeWidth={isCycleEdge ? "6" : "4"}
            className={isCycleEdge ? "rag-edge-flow" : "opacity-60"}
          />
        );
      })}

      <circle cx={graphCenter.x} cy={graphCenter.y} r="58" fill="#020617" opacity="0.88" />
      <text x={graphCenter.x} y={graphCenter.y - 7} textAnchor="middle" className="fill-white text-[18px] font-black">
        {result.hasCycle ? "Cycle" : "No Cycle"}
      </text>
      <text x={graphCenter.x} y={graphCenter.y + 17} textAnchor="middle" className="fill-slate-300 text-[11px] font-bold uppercase">
        directed graph
      </text>

      {displayNodes.map((nodeId, index) => {
        const point = nodePositions[nodeId];
        const isInCycle = nodeSetInCycle.has(nodeId);

        if (getNodeKind(nodeId) === "process") {
          return (
            <ProcessNode
              key={nodeId}
              nodeId={nodeId}
              point={point}
              isInCycle={isInCycle}
              index={index}
            />
          );
        }

        return (
          <ResourceNode
            key={nodeId}
            nodeId={nodeId}
            point={point}
            result={result}
            isInCycle={isInCycle}
            index={index}
          />
        );
      })}
    </svg>
  );
}

function CycleStatusPanel({ result }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold backdrop-blur ${
          result.hasCycle
            ? "border-rose-400/50 bg-rose-950/80 text-rose-100"
            : "border-emerald-400/50 bg-emerald-950/80 text-emerald-100"
        }`}
      >
        {result.hasCycle ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
        {result.hasCycle ? "Cycle detected" : "No cycle detected"}
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 bg-slate-950/80 px-3 py-2 text-sm font-bold text-slate-100 backdrop-blur">
        <GitBranch size={17} />
        {result.hasCycle ? result.cycle.join(" -> ") : "Acyclic graph"}
      </span>
    </div>
  );
}

function LegendCard({ colorClass, title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-1 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
        <span className={`h-3 w-3 rounded-full ${colorClass}`} />
        {title}
      </div>
      <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{children}</p>
    </div>
  );
}

function GraphSimulatorPanel({
  result,
  processCount,
  resourceInstances,
  allocationText,
  requestText,
  errorMessage,
  onProcessCountChange,
  onResourceInstancesChange,
  onAllocationTextChange,
  onRequestTextChange,
  onCalculate,
  onCreateCycle,
  onBreakCycle,
  onReset,
}) {
  return (
    <section className="panel">
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-100">
              <Network size={15} />
              RAG Simulator
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              Create the Resource Cycle
            </h2>
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            Process circle + Resource box + directed edge
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 xl:border-b-0 xl:border-r">
          <div className="space-y-4">
            <Field
              label="Number of Processes"
              value={processCount}
              onChange={onProcessCountChange}
              type="number"
            />
            <Field
              label="Resource Instances"
              value={resourceInstances}
              onChange={onResourceInstancesChange}
              placeholder="Example: 1 1 1"
            />
            <TextAreaField
              label="Allocation Edges: Resource Process"
              value={allocationText}
              onChange={onAllocationTextChange}
              placeholder="Example: R0 P1"
              rows={4}
            />
            <TextAreaField
              label="Request Edges: Process Resource"
              value={requestText}
              onChange={onRequestTextChange}
              placeholder="Example: P1 R0"
              rows={4}
            />

            <div className="flex flex-wrap gap-2">
              <button className="primary-button" type="button" onClick={onCalculate}>
                <Calculator size={17} />
                Calculate
              </button>
              <button className="small-button" type="button" onClick={onCreateCycle}>
                <Sparkles size={17} />
                Create Cycle
              </button>
              <button className="small-button" type="button" onClick={onBreakCycle}>
                <GitBranch size={17} />
                Break Cycle
              </button>
              <button className="small-button" type="button" onClick={onReset}>
                <RotateCcw size={17} />
                Reset
              </button>
            </div>

            <ErrorMessage message={errorMessage} />

            <div className="grid gap-2">
              <LegendCard colorClass="bg-orange-500" title="Request edge">
                Process is waiting for a resource: Pi -&gt; Rj.
              </LegendCard>
              <LegendCard colorClass="bg-teal-400" title="Allocation edge">
                Resource is already allocated: Rj -&gt; Pi.
              </LegendCard>
              <LegendCard colorClass="bg-rose-400" title="Cycle">
                A closed directed path means deadlock for single-instance resources.
              </LegendCard>
            </div>
          </div>
        </div>

        <div className="rag-canvas relative min-h-[620px] overflow-auto p-4">
          {result ? (
            <>
              <CycleStatusPanel result={result} />
              <div className="flex min-h-[590px] items-center justify-center">
                <ResourceAllocationGraphCanvas result={result} />
              </div>
            </>
          ) : (
            <div className="flex min-h-[560px] items-center justify-center text-center text-slate-500 dark:text-slate-300">
              Enter a valid graph to see the cycle simulator.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ResourceAllocationGraphCalculator() {
  const [processCount, setProcessCount] = useState("3");
  const [resourceInstances, setResourceInstances] = useState("1 1 1");
  const [allocationText, setAllocationText] = useState("R0 P1\nR1 P2\nR2 P0");
  const [requestText, setRequestText] = useState("P0 R0\nP1 R1\nP2 R2");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const previewResult = useMemo(() => {
    try {
      return calculateResourceAllocationGraph({
        processCount: Number(processCount),
        resourceInstances: parseIntegerList(resourceInstances, "Resource instances"),
        allocationText,
        requestText,
      });
    } catch (error) {
      return null;
    }
  }, [processCount, resourceInstances, allocationText, requestText]);

  const visibleResult = result || previewResult;

  function clearSavedResult() {
    setResult(null);
    setErrorMessage("");
  }

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

  function createCycleExample() {
    setProcessCount("3");
    setResourceInstances("1 1 1");
    setAllocationText("R0 P1\nR1 P2\nR2 P0");
    setRequestText("P0 R0\nP1 R1\nP2 R2");
    setResult(null);
    setErrorMessage("");
  }

  function createNoDeadlockExample() {
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
      <GraphSimulatorPanel
        result={visibleResult}
        processCount={processCount}
        resourceInstances={resourceInstances}
        allocationText={allocationText}
        requestText={requestText}
        errorMessage={errorMessage}
        onProcessCountChange={(value) => {
          setProcessCount(value);
          clearSavedResult();
        }}
        onResourceInstancesChange={(value) => {
          setResourceInstances(value);
          clearSavedResult();
        }}
        onAllocationTextChange={(value) => {
          setAllocationText(value);
          clearSavedResult();
        }}
        onRequestTextChange={(value) => {
          setRequestText(value);
          clearSavedResult();
        }}
        onCalculate={calculateResult}
        onCreateCycle={createCycleExample}
        onBreakCycle={createNoDeadlockExample}
        onReset={resetForm}
      />

      {visibleResult && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
                Graph Summary
              </h2>
              <MetricCards
                items={[
                  {
                    label: "Cycle",
                    value: visibleResult.hasCycle ? "Found" : "None",
                    note: visibleResult.hasCycle
                      ? visibleResult.cycle.join(" -> ")
                      : "Graph is acyclic",
                  },
                  {
                    label: "Processes",
                    value: visibleResult.processes.length,
                    note: visibleResult.processes.join(", "),
                  },
                  {
                    label: "Resources",
                    value: visibleResult.resources.length,
                    note: visibleResult.resources
                      .map(
                        (resourceId, index) =>
                          `${resourceId}:${visibleResult.resourceInstances[index]}`,
                      )
                      .join(", "),
                  },
                  {
                    label: "Available",
                    value: visibleResult.availableInstances.map(formatNumber).join(", "),
                    note: "Free instances per resource",
                  },
                ]}
              />
            </div>

            <div className="panel p-5">
              <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
                Cycle Reading
              </h2>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {(visibleResult.hasCycle
                  ? visibleResult.cycle.slice(0, -1)
                  : getDisplayNodes(visibleResult)
                ).map((nodeId, index) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    key={`${nodeId}-${index}`}
                  >
                    <span className="font-bold">{nodeId}</span>
                    <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {getNodeLabel(nodeId)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="panel p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Edge Table</h2>
            <SimpleTable
              columns={[
                { key: "type", label: "Type", render: (row) => row.label },
                { key: "from", label: "From", render: (row) => row.from },
                { key: "to", label: "To", render: (row) => row.to },
                { key: "meaning", label: "Meaning", render: (row) => row.meaning },
              ]}
              rows={getAllEdges(visibleResult)}
            />
          </div>

          <StepList steps={visibleResult.stepMessages} />
          <ExamFormat lines={visibleResult.examLines} />
        </>
      )}
    </div>
  );
}
