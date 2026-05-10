import { useState } from "react";
import {
  ButtonRow,
  DiskMovementChart,
  ErrorMessage,
  ExamFormat,
  Field,
  MetricCards,
  Section,
  SelectField,
  SimpleTable,
  StepList,
  SequenceChips,
} from "../components/Common";
import { calculateDiskScheduling } from "../utils/diskScheduling";
import { parseNumberList } from "../utils/parsers";
import { formatNumber } from "../utils/formatters";
import { saveRecentCalculation } from "../utils/storage";

const algorithmOptions = [
  { value: "fcfs", label: "FCFS" },
  { value: "sstf", label: "SSTF" },
  { value: "scan", label: "SCAN" },
  { value: "c-scan", label: "C-SCAN" },
  { value: "look", label: "LOOK" },
  { value: "c-look", label: "C-LOOK" },
];

export default function DiskSchedulingCalculator() {
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [requestQueue, setRequestQueue] = useState("98 183 37 122 14 124 65 67");
  const [headPosition, setHeadPosition] = useState("53");
  const [minimumTrack, setMinimumTrack] = useState("0");
  const [maximumTrack, setMaximumTrack] = useState("199");
  const [direction, setDirection] = useState("right");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const requests = parseNumberList(requestQueue, "Request queue");
      const nextResult = calculateDiskScheduling({
        algorithm,
        requests,
        headPosition: Number(headPosition),
        minimumTrack: Number(minimumTrack),
        maximumTrack: Number(maximumTrack),
        direction,
      });
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Disk Scheduling",
        `${algorithmOptions.find((option) => option.value === algorithm).label}: ${
          nextResult.totalMovement
        } movement`,
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setRequestQueue("98 183 37 122 14 124 65 67");
    setHeadPosition("53");
    setMinimumTrack("0");
    setMaximumTrack("199");
    setDirection("right");
  }

  function resetForm() {
    setRequestQueue("");
    setHeadPosition("");
    setMinimumTrack("0");
    setMaximumTrack("199");
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
            label="Request Queue"
            value={requestQueue}
            onChange={setRequestQueue}
            placeholder="Example: 98 183 37"
          />
          <Field
            label="Initial Head Position"
            value={headPosition}
            onChange={setHeadPosition}
            type="number"
          />
          <Field
            label="Disk Minimum"
            value={minimumTrack}
            onChange={setMinimumTrack}
            type="number"
          />
          <Field
            label="Disk Maximum"
            value={maximumTrack}
            onChange={setMaximumTrack}
            type="number"
          />
          <SelectField
            label="Direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: "right", label: "Right" },
              { value: "left", label: "Left" },
            ]}
          />
        </div>
        <div className="mt-4 space-y-3">
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
                  label: "Total Movement",
                  value: formatNumber(result.totalMovement),
                  note: "Sum of absolute head movements",
                },
                {
                  label: "Requests Served",
                  value: result.serviceOrder.length,
                  note: "Number of queue entries completed",
                },
                {
                  label: "Start Head",
                  value: headPosition,
                  note: `Direction: ${direction}`,
                },
                {
                  label: "Disk Range",
                  value: `${minimumTrack} - ${maximumTrack}`,
                  note: "Valid track range",
                },
              ]}
            />
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <SequenceChips title="Service Order" values={result.serviceOrder} />
              <SequenceChips title="Head Movement Sequence" values={result.sequence} />
            </div>
          </Section>
          <DiskMovementChart
            sequence={result.sequence}
            minimumTrack={Number(minimumTrack)}
            maximumTrack={Number(maximumTrack)}
            totalMovement={result.totalMovement}
          />
          <Section title="Movement Table">
            <SimpleTable
              columns={[
                { key: "fromTrack", label: "From" },
                { key: "toTrack", label: "To" },
                { key: "movement", label: "Movement" },
              ]}
              rows={result.movements}
            />
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
