import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  MatrixDisplay,
  MetricCards,
  Section,
  SelectField,
  SequenceChips,
  SimpleTable,
  StepList,
  TextAreaField,
} from "../components/Common";
import { calculateBankers } from "../utils/bankers";
import { formatVector } from "../utils/formatters";
import { parseMatrix, parseNumberList } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

export default function BankersCalculator() {
  const [processCount, setProcessCount] = useState("5");
  const [resourceCount, setResourceCount] = useState("3");
  const [resourceInputType, setResourceInputType] = useState("available");
  const [allocationMatrixText, setAllocationMatrixText] = useState(
    "0 1 0\n2 0 0\n3 0 2\n2 1 1\n0 0 2",
  );
  const [maximumMatrixText, setMaximumMatrixText] = useState(
    "7 5 3\n3 2 2\n9 0 2\n2 2 2\n4 3 3",
  );
  const [resourceVectorText, setResourceVectorText] = useState("3 3 2");
  const [requestProcessIndex, setRequestProcessIndex] = useState("");
  const [requestVectorText, setRequestVectorText] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateAvailableFromTotal(allocationMatrix, totalResourceVector) {
    const usedResourceVector = Array(totalResourceVector.length).fill(0);

    allocationMatrix.forEach((row) => {
      row.forEach((value, columnIndex) => {
        usedResourceVector[columnIndex] += value;
      });
    });

    const availableVector = totalResourceVector.map(
      (totalValue, index) => totalValue - usedResourceVector[index],
    );

    const hasNegativeAvailable = availableVector.some((value) => value < 0);

    if (hasNegativeAvailable) {
      throw new Error("Total resource instances are less than allocated resources.");
    }

    return {
      usedResourceVector,
      availableVector,
    };
  }

  function calculateResult() {
    try {
      const rows = Number(processCount);
      const columns = Number(resourceCount);
      const allocationMatrix = parseMatrix(allocationMatrixText, rows, columns, "Allocation");
      const maximumMatrix = parseMatrix(maximumMatrixText, rows, columns, "Max");
      const enteredResourceVector = parseNumberList(
        resourceVectorText,
        resourceInputType === "total" ? "Total resource instances" : "Available vector",
      );
      const resourceCalculation =
        resourceInputType === "total"
          ? calculateAvailableFromTotal(allocationMatrix, enteredResourceVector)
          : {
              usedResourceVector: null,
              availableVector: enteredResourceVector,
            };
      const hasRequest = requestVectorText.trim() !== "";
      const nextResult = calculateBankers({
        allocationMatrix,
        maximumMatrix,
        availableVector: resourceCalculation.availableVector,
        requestProcessIndex: hasRequest ? Number(requestProcessIndex) : null,
        requestVector: hasRequest ? parseNumberList(requestVectorText, "Request vector") : null,
      });
      nextResult.resourceInputType = resourceInputType;
      nextResult.enteredResourceVector = enteredResourceVector;
      nextResult.usedResourceVector = resourceCalculation.usedResourceVector;
      nextResult.availableVector = resourceCalculation.availableVector;
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Banker's Algorithm",
        nextResult.safetyResult.isSafe ? "Safe state" : "Unsafe state",
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setProcessCount("5");
    setResourceCount("3");
    setResourceInputType("available");
    setAllocationMatrixText("0 1 0\n2 0 0\n3 0 2\n2 1 1\n0 0 2");
    setMaximumMatrixText("7 5 3\n3 2 2\n9 0 2\n2 2 2\n4 3 3");
    setResourceVectorText("3 3 2");
    setRequestProcessIndex("1");
    setRequestVectorText("1 0 2");
  }

  function fillQuestionExample() {
    setProcessCount("5");
    setResourceCount("4");
    setResourceInputType("total");
    setAllocationMatrixText("0 1 1 0\n1 2 3 1\n1 3 6 5\n0 6 3 2\n0 0 1 4");
    setMaximumMatrixText("0 2 1 0\n1 6 5 2\n2 3 6 6\n0 6 5 2\n0 6 5 6");
    setResourceVectorText("3 17 16 12");
    setRequestProcessIndex("");
    setRequestVectorText("");
  }

  function resetForm() {
    setAllocationMatrixText("");
    setMaximumMatrixText("");
    setResourceVectorText("");
    setRequestProcessIndex("");
    setRequestVectorText("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
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
            <SelectField
              label="Resource Vector Type"
              value={resourceInputType}
              onChange={setResourceInputType}
              options={[
                { value: "available", label: "Available Vector" },
                { value: "total", label: "Total Resource Instances" },
              ]}
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
              label="Max Matrix"
              value={maximumMatrixText}
              onChange={setMaximumMatrixText}
              rows={5}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field
              label={
                resourceInputType === "total" ? "Total Resource Instances" : "Available Vector"
              }
              value={resourceVectorText}
              onChange={setResourceVectorText}
            />
            <Field
              label="Optional Request Process Index"
              value={requestProcessIndex}
              onChange={setRequestProcessIndex}
              placeholder="Example: 1 for P1"
            />
            <Field
              label="Optional Request Vector"
              value={requestVectorText}
              onChange={setRequestVectorText}
              placeholder="Example: 1 0 2"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <button className="small-button" type="button" onClick={fillQuestionExample}>
            Use Screenshot Question
          </button>
        </div>
        <div className="mt-3">
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <MatrixDisplay title="Need Matrix = Max - Allocation" matrix={result.needMatrix} />
          {result.resourceInputType === "total" && (
            <Section title="Available Vector Calculation">
              <SimpleTable
                columns={[
                  {
                    key: "total",
                    label: "Total Resources",
                    render: () => formatVector(result.enteredResourceVector),
                  },
                  {
                    key: "allocated",
                    label: "Allocated Sum",
                    render: () => formatVector(result.usedResourceVector),
                  },
                  {
                    key: "available",
                    label: "Available = Total - Allocated",
                    render: () => formatVector(result.availableVector),
                  },
                ]}
                rows={[{ id: "available-calculation" }]}
              />
            </Section>
          )}
          <Section title="Safety Output">
            <MetricCards
              items={[
                {
                  label: "State",
                  value: result.safetyResult.isSafe ? "Safe" : "Unsafe",
                  note: "Safety algorithm result",
                },
                {
                  label: "Processes Finished",
                  value: result.safetyResult.finish.filter(Boolean).length,
                  note: `${result.safetyResult.finish.length} total processes`,
                },
              ]}
            />
            <div className="my-4">
              <SequenceChips
                title="Safe Sequence"
                values={
                  result.safetyResult.safeSequence.length > 0
                    ? result.safetyResult.safeSequence
                    : ["Not available"]
                }
              />
            </div>
            <SimpleTable
              columns={[
                { key: "processId", label: "Process", render: (row) => row.processId },
                { key: "workBefore", label: "Work Before", render: (row) => formatVector(row.workBefore) },
                { key: "need", label: "Need", render: (row) => formatVector(row.need) },
                { key: "allocation", label: "Allocation", render: (row) => formatVector(row.allocation) },
                { key: "workAfter", label: "Work After", render: (row) => formatVector(row.workAfter) },
                { key: "finish", label: "Finish", render: (row) => formatVector(row.finish) },
              ]}
              rows={result.safetyResult.steps}
            />
          </Section>
          {result.requestResult && (
            <Section title="Request Check">
              <div className="mb-3 exam-line">
                <span className="font-semibold">Grant Request: </span>
                {result.requestResult.canGrant ? "Yes" : "No"}
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {result.requestResult.requestSteps.map((step, index) => (
                  <li className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950" key={index}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </Section>
          )}
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
