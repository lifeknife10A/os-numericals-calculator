import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  MetricCards,
  PageFrameTable,
  Section,
  SelectField,
  SimpleTable,
  StepList,
} from "../components/Common";
import { calculatePageReplacement } from "../utils/pageReplacement";
import { formatNumber } from "../utils/formatters";
import { parseIntegerList } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

const algorithmOptions = [
  { value: "fifo", label: "FIFO" },
  { value: "lru", label: "LRU" },
  { value: "optimal", label: "Optimal" },
];

export default function PageReplacementCalculator() {
  const [algorithm, setAlgorithm] = useState("fifo");
  const [referenceString, setReferenceString] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2");
  const [frameCount, setFrameCount] = useState("3");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const references = parseIntegerList(referenceString, "Reference string");
      const nextResult = calculatePageReplacement(algorithm, references, Number(frameCount));
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Page Replacement",
        `${algorithmOptions.find((option) => option.value === algorithm).label}: ${
          nextResult.pageFaults
        } faults`,
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setReferenceString("7 0 1 2 0 3 0 4 2 3 0 3 2");
    setFrameCount("3");
  }

  function resetForm() {
    setReferenceString("");
    setFrameCount("");
    setResult(null);
    setErrorMessage("");
  }

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
          <Field
            label="Reference String"
            value={referenceString}
            onChange={setReferenceString}
            placeholder="Example: 7 0 1 2 0 3"
          />
          <Field
            label="Number of Frames"
            value={frameCount}
            onChange={setFrameCount}
            type="number"
          />
        </div>
        <div className="mt-4 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <PageFrameTable steps={result.steps} />
          <Section title="Output Table">
            <SimpleTable
              columns={[
                { key: "reference", label: "Reference" },
                {
                  key: "frames",
                  label: "Frames After Reference",
                  render: (row) =>
                    row.frames.map((frame) => (frame === null ? "-" : frame)).join(", "),
                },
                {
                  key: "isHit",
                  label: "Result",
                  render: (row) => (row.isHit ? "Hit" : "Fault"),
                },
                {
                  key: "replacedPage",
                  label: "Replaced Page",
                  render: (row) => (row.replacedPage === null ? "-" : row.replacedPage),
                },
              ]}
              rows={result.steps}
            />
            <div className="mt-4">
              <MetricCards
                items={[
                  {
                    label: "Faults",
                    value: result.pageFaults,
                    note: "Page not found in frames",
                  },
                  {
                    label: "Hits",
                    value: result.hits,
                    note: "Page already present",
                  },
                  {
                    label: "Fault Ratio",
                    value: formatNumber(result.pageFaultRatio),
                    note: "Faults / references",
                  },
                  {
                    label: "Hit Ratio",
                    value: formatNumber(result.hitRatio),
                    note: "Hits / references",
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
