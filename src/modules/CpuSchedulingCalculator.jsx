import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  GanttChart,
  MetricCards,
  Section,
  SelectField,
  SimpleTable,
  StepList,
} from "../components/Common";
import { calculateCpuScheduling } from "../utils/cpuScheduling";
import { formatNumber } from "../utils/formatters";
import { saveRecentCalculation } from "../utils/storage";

const blankRows = [
  { processId: "P1", arrivalTime: "0", burstTime: "8", priority: "2" },
  { processId: "P2", arrivalTime: "1", burstTime: "4", priority: "1" },
  { processId: "P3", arrivalTime: "2", burstTime: "9", priority: "3" },
  { processId: "P4", arrivalTime: "3", burstTime: "5", priority: "2" },
];

const algorithmOptions = [
  { value: "fcfs", label: "FCFS" },
  { value: "sjf", label: "SJF Non-Preemptive" },
  { value: "srtf", label: "SRTF / SJF Preemptive" },
  { value: "priority-non-preemptive", label: "Priority Non-Preemptive" },
  { value: "priority-preemptive", label: "Priority Preemptive" },
  { value: "round-robin", label: "Round Robin" },
];

function createEmptyRow(index) {
  return {
    processId: `P${index + 1}`,
    arrivalTime: "0",
    burstTime: "",
    priority: "",
  };
}

export default function CpuSchedulingCalculator() {
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [processRows, setProcessRows] = useState(blankRows);
  const [timeQuantum, setTimeQuantum] = useState("4");
  const [priorityRule, setPriorityRule] = useState("smaller");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const needsPriority = algorithm.includes("priority");

  function updateProcessRow(rowIndex, key, value) {
    setProcessRows((oldRows) =>
      oldRows.map((row, index) => (index === rowIndex ? { ...row, [key]: value } : row)),
    );
  }

  function addProcessRow() {
    setProcessRows((oldRows) => [...oldRows, createEmptyRow(oldRows.length)]);
  }

  function removeProcessRow(rowIndex) {
    setProcessRows((oldRows) => oldRows.filter((_, index) => index !== rowIndex));
  }

  function parseProcesses() {
    const filledRows = processRows.filter(
      (row) => row.processId || row.arrivalTime || row.burstTime || row.priority,
    );

    return filledRows.map((row) => ({
      processId: row.processId.trim(),
      arrivalTime: Number(row.arrivalTime),
      burstTime: Number(row.burstTime),
      priority: row.priority === "" ? null : Number(row.priority),
    }));
  }

  function calculateResult() {
    try {
      const nextResult = calculateCpuScheduling({
        algorithm,
        processes: parseProcesses(),
        timeQuantum: Number(timeQuantum),
        smallerNumberHigherPriority: priorityRule === "smaller",
      });
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "CPU Scheduling",
        `${algorithmOptions.find((option) => option.value === algorithm).label}: AWT ${formatNumber(
          nextResult.averageWaitingTime,
        )}`,
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    if (algorithm === "round-robin") {
      setProcessRows([
        { processId: "P1", arrivalTime: "0", burstTime: "12", priority: "2" },
        { processId: "P2", arrivalTime: "0", burstTime: "7", priority: "1" },
        { processId: "P3", arrivalTime: "0", burstTime: "9", priority: "3" },
        { processId: "P4", arrivalTime: "0", burstTime: "4", priority: "2" },
      ]);
      setTimeQuantum("4");
      return;
    }

    setProcessRows(blankRows);
    setTimeQuantum("4");
  }

  function resetForm() {
    setProcessRows([createEmptyRow(0), createEmptyRow(1), createEmptyRow(2)]);
    setResult(null);
    setErrorMessage("");
  }

  const resultColumns = [
    { key: "processId", label: "Process", render: (row) => row.processId },
    { key: "arrivalTime", label: "AT" },
    { key: "burstTime", label: "BT" },
    ...(needsPriority ? [{ key: "priority", label: "Priority" }] : []),
    { key: "completionTime", label: "CT" },
    { key: "turnaroundTime", label: "TAT" },
    { key: "waitingTime", label: "WT" },
    { key: "responseTime", label: "RT" },
  ];

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="grid gap-4 lg:grid-cols-3">
          <SelectField
            label="Algorithm"
            value={algorithm}
            onChange={setAlgorithm}
            options={algorithmOptions}
          />
          {algorithm === "round-robin" && (
            <Field
              label="Time Quantum"
              value={timeQuantum}
              onChange={setTimeQuantum}
              type="number"
            />
          )}
          {needsPriority && (
            <SelectField
              label="Priority Rule"
              value={priorityRule}
              onChange={setPriorityRule}
              options={[
                { value: "smaller", label: "Smaller number = higher priority" },
                { value: "larger", label: "Larger number = higher priority" },
              ]}
            />
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="table-head">Process ID</th>
                <th className="table-head">Arrival Time</th>
                <th className="table-head">Burst Time</th>
                {needsPriority && <th className="table-head">Priority</th>}
                <th className="table-head">Action</th>
              </tr>
            </thead>
            <tbody>
              {processRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="table-cell">
                    <input
                      className="input-box"
                      value={row.processId}
                      onChange={(event) =>
                        updateProcessRow(rowIndex, "processId", event.target.value)
                      }
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      className="input-box"
                      type="number"
                      value={row.arrivalTime}
                      onChange={(event) =>
                        updateProcessRow(rowIndex, "arrivalTime", event.target.value)
                      }
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      className="input-box"
                      type="number"
                      value={row.burstTime}
                      onChange={(event) =>
                        updateProcessRow(rowIndex, "burstTime", event.target.value)
                      }
                    />
                  </td>
                  {needsPriority && (
                    <td className="table-cell">
                      <input
                        className="input-box"
                        type="number"
                        value={row.priority}
                        onChange={(event) =>
                          updateProcessRow(rowIndex, "priority", event.target.value)
                        }
                      />
                    </td>
                  )}
                  <td className="table-cell">
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => removeProcessRow(rowIndex)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="small-button" type="button" onClick={addProcessRow}>
            Add Process
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <GanttChart segments={result.segments} />
          <Section title="Output Table">
            <SimpleTable columns={resultColumns} rows={result.rows} />
            <div className="mt-4">
              <MetricCards
                items={[
                  {
                    label: "Average WT",
                    value: formatNumber(result.averageWaitingTime),
                    note: "Average waiting time",
                  },
                  {
                    label: "Average TAT",
                    value: formatNumber(result.averageTurnaroundTime),
                    note: "Average turnaround time",
                  },
                  {
                    label: "Average RT",
                    value: formatNumber(result.averageResponseTime),
                    note: "Average response time",
                  },
                ]}
              />
            </div>
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
