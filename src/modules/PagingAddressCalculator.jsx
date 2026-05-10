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
import { calculatePagingAddress } from "../utils/addressTranslation";
import { parsePageTable } from "../utils/parsers";
import { saveRecentCalculation } from "../utils/storage";

export default function PagingAddressCalculator() {
  const [logicalAddress, setLogicalAddress] = useState("2500");
  const [pageSize, setPageSize] = useState("1000");
  const [pageTableText, setPageTableText] = useState("0 5\n1 8\n2 3\n3 6");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      const nextResult = calculatePagingAddress(
        Number(logicalAddress),
        Number(pageSize),
        parsePageTable(pageTableText),
      );
      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Paging Address Translation",
        nextResult.isValid ? `PA ${nextResult.physicalAddress}` : "Page fault",
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    setLogicalAddress("2500");
    setPageSize("1000");
    setPageTableText("0 5\n1 8\n2 3\n3 6");
  }

  function resetForm() {
    setLogicalAddress("");
    setPageSize("");
    setPageTableText("");
    setResult(null);
    setErrorMessage("");
  }

  const outputRows = result
    ? [
        { label: "Page Number", value: result.pageNumber },
        { label: "Offset", value: result.offset },
        { label: "Frame Number", value: result.frameNumber ?? "Invalid" },
        { label: "Physical Address", value: result.physicalAddress ?? "Page Fault" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Logical Address"
            value={logicalAddress}
            onChange={setLogicalAddress}
            type="number"
          />
          <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
          <TextAreaField
            label="Page Table Mapping"
            value={pageTableText}
            onChange={setPageTableText}
            placeholder="0 5"
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
