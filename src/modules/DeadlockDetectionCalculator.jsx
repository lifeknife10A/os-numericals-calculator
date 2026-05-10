import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  MetricCards,
  Section,
  SequenceChips,
  SimpleTable,
  StepList,
  TextAreaField,
} from "../components/Common";
import { calculateDeadlockDetection } from "../utils/deadlockDetection";
import { formatVector } from "../utils/formatters";
import { parseMatrix, parseNumberList } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

export default function DeadlockDetectionCalculator() {
  const [processCount, setProcessCount] = useState("5");
  const [resourceCount, setResourceCount] = useState("3");
  const [allocationMatrixText, setAllocationMatrixText] = useState(
    "0 1 0\n2 0 0\n3 0 3\n2 1 1\n0 0 2",
  );
  const [requestMatrixText, setRequestMatrixText] = useState(
    "0 0 0\n2 0 2\n0 0 0\n1 0 0\n0 0 2",
  );
  const [availableVectorText, setAvailableVectorText] = useState("0 0 0");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const rows = Number(processCount);
      const columns = Number(resourceCount);
      const allocationMatrix = parseMatrix(allocationMatrixText, rows, columns, "Allocation");
      const requestMatrix = parseMatrix(requestMatrixText, rows, columns, "Request");
      const availableVector = parseNumberList(availableVectorText, "Available vector");
      const nextResult = calculateDeadlockDetection(
        allocationMatrix,
        requestMatrix,
        availableVector,
      );
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Deadlock Detection",
        nextResult.hasDeadlock ? "Deadlock present" : "No deadlock",
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setProcessCount("5");
    setResourceCount("3");
    setAllocationMatrixText("0 1 0\n2 0 0\n3 0 3\n2 1 1\n0 0 2");
    setRequestMatrixText("0 0 0\n2 0 2\n0 0 0\n1 0 0\n0 0 2");
    setAvailableVectorText("0 0 0");
  }

  function resetForm() {
    setAllocationMatrixText("");
    setRequestMatrixText("");
    setAvailableVectorText("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Number of Processes"
              value={processCount}
              onChange={setProcessCount}
              type="number"
            />
            <Field
              label="Number of Resource Types"
              value={resourceCount}
              onChange={setResourceCount}
              type="number"
            />
            <Field
              label="Available Vector"
              value={availableVectorText}
              onChange={setAvailableVectorText}
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <TextAreaField
              label="Allocation Matrix"
              value={allocationMatrixText}
              onChange={setAllocationMatrixText}
              rows={5}
            />
            <TextAreaField
              label="Request Matrix"
              value={requestMatrixText}
              onChange={setRequestMatrixText}
              rows={5}
            />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <Section title="Output">
            <MetricCards
              items={[
                {
                  label: "Status",
                  value: result.hasDeadlock ? "Deadlock" : "Clear",
                  note: result.hasDeadlock ? "Some processes cannot finish" : "No deadlock found",
                },
                {
                  label: "Completed",
                  value: result.completionSequence.length,
                  note: `${processCount} total processes`,
                },
                {
                  label: "Deadlocked",
                  value: result.deadlockedProcesses.length,
                  note:
                    result.deadlockedProcesses.length > 0
                      ? result.deadlockedProcesses.join(", ")
                      : "None",
                },
              ]}
            />
            <div className="my-4 grid gap-3 lg:grid-cols-2">
              <SequenceChips
                title="Completion Sequence"
                values={
                  result.completionSequence.length > 0
                    ? result.completionSequence
                    : ["Not available"]
                }
              />
              <SequenceChips
                title="Deadlocked Processes"
                values={
                  result.deadlockedProcesses.length > 0 ? result.deadlockedProcesses : ["None"]
                }
              />
            </div>
            <SimpleTable
              columns={[
                { key: "processId", label: "Process", render: (row) => row.processId },
                { key: "workBefore", label: "Work Before", render: (row) => formatVector(row.workBefore) },
                { key: "request", label: "Request", render: (row) => formatVector(row.request) },
                { key: "allocation", label: "Allocation", render: (row) => formatVector(row.allocation) },
                { key: "workAfter", label: "Work After", render: (row) => formatVector(row.workAfter) },
                { key: "finish", label: "Finish", render: (row) => formatVector(row.finish) },
              ]}
              rows={result.steps}
            />
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
