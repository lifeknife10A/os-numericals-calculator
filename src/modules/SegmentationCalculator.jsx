import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  KeyValueTable,
  Section,
  StepList,
  TextAreaField,
} from "../components/Common";
import { calculateSegmentationAddress } from "../utils/addressTranslation";
import { parseSegmentTable } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

export default function SegmentationCalculator() {
  const [segmentNumber, setSegmentNumber] = useState("2");
  const [offset, setOffset] = useState("400");
  const [segmentTableText, setSegmentTableText] = useState("0 219 600\n1 2300 14\n2 90 500\n3 1327 580");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const nextResult = calculateSegmentationAddress(
        Number(segmentNumber),
        Number(offset),
        parseSegmentTable(segmentTableText),
      );
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Segmentation Address Translation",
        nextResult.isValid ? `PA ${nextResult.physicalAddress}` : "Segmentation fault",
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setSegmentNumber("2");
    setOffset("400");
    setSegmentTableText("0 219 600\n1 2300 14\n2 90 500\n3 1327 580");
  }

  function resetForm() {
    setSegmentNumber("");
    setOffset("");
    setSegmentTableText("");
    setResult(null);
    setErrorMessage("");
  }

  const outputRows = result
    ? [
        { label: "Segment Number", value: result.segmentNumber },
        { label: "Offset", value: result.offset },
        { label: "Base", value: result.baseAddress ?? "Invalid" },
        { label: "Limit", value: result.limit ?? "Invalid" },
        { label: "Status", value: result.isValid ? "Valid" : "Invalid" },
        { label: "Physical Address", value: result.physicalAddress ?? "Trap" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Segment Number"
            value={segmentNumber}
            onChange={setSegmentNumber}
            type="number"
          />
          <Field label="Offset" value={offset} onChange={setOffset} type="number" />
          <TextAreaField
            label="Segment Table: Segment Base Limit"
            value={segmentTableText}
            onChange={setSegmentTableText}
            rows={4}
          />
        </div>
        <div className="mt-4 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <Section title="Output Table">
            <KeyValueTable rows={outputRows} />
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
