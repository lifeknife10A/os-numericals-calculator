import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  MemoryBlockVisual,
  MetricCards,
  Section,
  SelectField,
  SimpleTable,
  StepList,
} from "../components/Common";
import { calculateMemoryAllocation } from "../utils/memoryAllocation";
import { formatNumber } from "../utils/formatters";
import { parseNumberList } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

const algorithmOptions = [
  { value: "first-fit", label: "First Fit" },
  { value: "best-fit", label: "Best Fit" },
  { value: "worst-fit", label: "Worst Fit" },
];

export default function MemoryAllocationCalculator() {
  const [algorithm, setAlgorithm] = useState("first-fit");
  const [blockSizes, setBlockSizes] = useState("100 500 200 300 600");
  const [processSizes, setProcessSizes] = useState("212 417 112 426");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const nextResult = calculateMemoryAllocation(
        algorithm,
        parseNumberList(blockSizes, "Block sizes"),
        parseNumberList(processSizes, "Process sizes"),
      );
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Memory Allocation",
        `${algorithmOptions.find((option) => option.value === algorithm).label}: ${
          nextResult.unallocatedProcesses.length
        } not allocated`,
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setBlockSizes("100 500 200 300 600");
    setProcessSizes("212 417 112 426");
  }

  function resetForm() {
    setBlockSizes("");
    setProcessSizes("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Algorithm"
            value={algorithm}
            onChange={setAlgorithm}
            options={algorithmOptions}
          />
          <Field
            label="Memory Block Sizes"
            value={blockSizes}
            onChange={setBlockSizes}
            placeholder="Example: 100 500 200"
          />
          <Field
            label="Process Sizes"
            value={processSizes}
            onChange={setProcessSizes}
            placeholder="Example: 212 417"
          />
        </div>
        <div className="mt-4 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <MemoryBlockVisual
            blockSizes={result.blockSizes}
            remainingBlocks={result.remainingBlocks}
          />
          <Section title="Allocation Table">
            <SimpleTable
              columns={[
                { key: "processId", label: "Process", render: (row) => row.processId },
                { key: "processSize", label: "Process Size" },
                { key: "blockId", label: "Allocated Block", render: (row) => row.blockId },
                {
                  key: "blockOriginalSize",
                  label: "Block Size Before",
                  render: (row) => row.blockOriginalSize,
                },
                {
                  key: "remainingAfterAllocation",
                  label: "Remaining Block Size",
                  render: (row) => row.remainingAfterAllocation,
                },
                { key: "status", label: "Status", render: (row) => row.status },
              ]}
              rows={result.allocations}
            />
          </Section>
          <Section title="Fragmentation Summary">
            <MetricCards
              items={[
                {
                  label: "Free Memory",
                  value: formatNumber(result.totalRemainingMemory),
                  note: "Sum of remaining block sizes",
                },
                {
                  label: "Largest Free Block",
                  value: formatNumber(result.largestRemainingBlock),
                  note: "Useful for external fragmentation",
                },
                {
                  label: "Not Allocated",
                  value: result.unallocatedProcesses.length,
                  note:
                    result.unallocatedProcesses.length > 0
                      ? result.unallocatedProcesses.join(", ")
                      : "All processes allocated",
                },
                {
                  label: "Unallocated Need",
                  value: formatNumber(result.totalUnallocatedNeed),
                  note: "Total size of waiting processes",
                },
              ]}
            />
            <div className="mt-4 exam-line">
              <span className="font-semibold">Remaining Blocks: </span>
              {result.remainingBlocks.map(formatNumber).join(", ")}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              This calculator uses variable partition style: after allocation, the selected block is
              reduced by the process size.
            </p>
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
