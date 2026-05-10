import { useState } from "react";
import {
  ButtonRow,
  ErrorMessage,
  ExamFormat,
  Field,
  KeyValueTable,
  Section,
  SelectField,
  SimpleTable,
  StepList,
  TextAreaField,
} from "../components/Common";
import {
  calculateEffectiveAccessTime,
  calculateLogicalBits,
  calculateNumberOfFrames,
  calculateNumberOfPages,
  calculatePageNumberOffset,
  calculatePageTableSize,
  calculatePagingFragmentation,
  calculatePagingPhysicalAddress,
  calculatePhysicalBits,
} from "../utils/pagingNumericals";
import { parseNumberList, parsePageTable } from "../utils/parsers";
import { formatNumber } from "../utils/formatters";
import { saveRecentCalculation } from "../utils/storage";

const calculationOptions = [
  { value: "page-offset", label: "A. Page Number and Offset" },
  { value: "physical-address", label: "B. Physical Address using Page Table" },
  { value: "number-pages", label: "C. Number of Pages" },
  { value: "number-frames", label: "D. Number of Frames" },
  { value: "page-table-size", label: "E. Page Table Size" },
  { value: "logical-bits", label: "F. Logical Address Bits Split" },
  { value: "physical-bits", label: "G. Physical Address Bits Split" },
  { value: "eat", label: "H. Effective Access Time with TLB" },
  { value: "fragmentation", label: "I. Paging Fragmentation" },
];

function requirePositiveNumber(value, label) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  return numberValue;
}

function requireNonNegativeNumber(value, label) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }

  return numberValue;
}

function createAddressRows(result) {
  return [
    { label: "Page Number", value: result.pageNumber },
    { label: "Offset", value: result.offset },
    { label: "Frame Number", value: result.frameNumber ?? "Invalid" },
    { label: "Physical Address", value: result.physicalAddress ?? "Page Fault" },
  ];
}

export default function PagingNumericalsCalculator() {
  const [calculationType, setCalculationType] = useState("page-offset");
  const [logicalAddress, setLogicalAddress] = useState("2500");
  const [pageSize, setPageSize] = useState("1000");
  const [pageTableText, setPageTableText] = useState("0 5\n1 8\n2 3\n3 6");
  const [processSize, setProcessSize] = useState("5000");
  const [physicalMemorySize, setPhysicalMemorySize] = useState("65536");
  const [frameSize, setFrameSize] = useState("1024");
  const [logicalAddressSpaceSize, setLogicalAddressSpaceSize] = useState("65536");
  const [pageTableEntrySize, setPageTableEntrySize] = useState("4");
  const [logicalAddressBits, setLogicalAddressBits] = useState("16");
  const [physicalAddressBits, setPhysicalAddressBits] = useState("20");
  const [hitRatio, setHitRatio] = useState("0.8");
  const [memoryAccessTime, setMemoryAccessTime] = useState("100");
  const [tlbAccessTime, setTlbAccessTime] = useState("20");
  const [pageFaultRate, setPageFaultRate] = useState("");
  const [pageFaultServiceTime, setPageFaultServiceTime] = useState("");
  const [processSizes, setProcessSizes] = useState("5000 7000 6200");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function calculateResult() {
    try {
      let nextResult;

      if (calculationType === "page-offset") {
        nextResult = calculatePageNumberOffset(
          requireNonNegativeNumber(logicalAddress, "Logical address"),
          requirePositiveNumber(pageSize, "Page size"),
        );
      } else if (calculationType === "physical-address") {
        nextResult = calculatePagingPhysicalAddress(
          requireNonNegativeNumber(logicalAddress, "Logical address"),
          requirePositiveNumber(pageSize, "Page size"),
          parsePageTable(pageTableText),
        );
        nextResult = {
          ...nextResult,
          rows: createAddressRows(nextResult),
        };
      } else if (calculationType === "number-pages") {
        nextResult = calculateNumberOfPages(
          requirePositiveNumber(processSize, "Process size"),
          requirePositiveNumber(pageSize, "Page size"),
        );
      } else if (calculationType === "number-frames") {
        nextResult = calculateNumberOfFrames(
          requirePositiveNumber(physicalMemorySize, "Physical memory size"),
          requirePositiveNumber(frameSize, "Frame size"),
        );
      } else if (calculationType === "page-table-size") {
        nextResult = calculatePageTableSize(
          requirePositiveNumber(logicalAddressSpaceSize, "Logical address space size"),
          requirePositiveNumber(pageSize, "Page size"),
          requirePositiveNumber(pageTableEntrySize, "Page table entry size"),
        );
      } else if (calculationType === "logical-bits") {
        if (logicalAddressBits === "") {
          requirePositiveNumber(logicalAddressSpaceSize, "Logical address space size");
        } else {
          requirePositiveNumber(logicalAddressBits, "Logical address bits");
        }

        nextResult = calculateLogicalBits({
          logicalAddressSpaceSize,
          logicalAddressBits,
          pageSize: requirePositiveNumber(pageSize, "Page size"),
        });
      } else if (calculationType === "physical-bits") {
        if (physicalAddressBits === "") {
          requirePositiveNumber(physicalMemorySize, "Physical memory size");
        } else {
          requirePositiveNumber(physicalAddressBits, "Physical address bits");
        }

        nextResult = calculatePhysicalBits({
          physicalMemorySize,
          physicalAddressBits,
          frameSize: requirePositiveNumber(frameSize, "Frame size"),
        });
      } else if (calculationType === "eat") {
        nextResult = calculateEffectiveAccessTime({
          hitRatio: requireNonNegativeNumber(hitRatio, "TLB hit ratio"),
          memoryAccessTime: requirePositiveNumber(memoryAccessTime, "Memory access time"),
          tlbAccessTime,
          pageFaultRate,
          pageFaultServiceTime,
        });
      } else {
        nextResult = calculatePagingFragmentation(
          parseNumberList(processSizes, "Process sizes"),
          requirePositiveNumber(pageSize, "Page size"),
        );
      }

      setResult(nextResult);
      setErrorMessage("");
      saveRecentCalculation(
        "Paging Numericals",
        calculationOptions.find((option) => option.value === calculationType).label,
      );
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message);
    }
  }

  function fillExample() {
    if (calculationType === "page-offset" || calculationType === "physical-address") {
      setLogicalAddress("2500");
      setPageSize("1000");
      setPageTableText("0 5\n1 8\n2 3\n3 6");
    } else if (calculationType === "number-pages") {
      setProcessSize("5000");
      setPageSize("1024");
    } else if (calculationType === "number-frames") {
      setPhysicalMemorySize("65536");
      setFrameSize("1024");
    } else if (calculationType === "page-table-size") {
      setLogicalAddressSpaceSize("65536");
      setPageSize("1024");
      setPageTableEntrySize("4");
    } else if (calculationType === "logical-bits") {
      setLogicalAddressBits("16");
      setPageSize("1024");
    } else if (calculationType === "physical-bits") {
      setPhysicalAddressBits("20");
      setFrameSize("1024");
    } else if (calculationType === "eat") {
      setHitRatio("0.8");
      setMemoryAccessTime("100");
      setTlbAccessTime("20");
      setPageFaultRate("");
      setPageFaultServiceTime("");
    } else {
      setProcessSizes("5000 7000 6200");
      setPageSize("1024");
    }
  }

  function resetForm() {
    setLogicalAddress("");
    setPageSize("");
    setPageTableText("");
    setProcessSize("");
    setPhysicalMemorySize("");
    setFrameSize("");
    setLogicalAddressSpaceSize("");
    setPageTableEntrySize("");
    setLogicalAddressBits("");
    setPhysicalAddressBits("");
    setHitRatio("");
    setMemoryAccessTime("");
    setTlbAccessTime("");
    setPageFaultRate("");
    setPageFaultServiceTime("");
    setProcessSizes("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-4">
      <Section title="Input Section">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Paging Numerical Type"
            value={calculationType}
            onChange={setCalculationType}
            options={calculationOptions}
          />

          {(calculationType === "page-offset" || calculationType === "physical-address") && (
            <>
              <Field
                label="Logical Address"
                value={logicalAddress}
                onChange={setLogicalAddress}
                type="number"
              />
              <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
            </>
          )}

          {calculationType === "physical-address" && (
            <TextAreaField
              label="Page Table: Page Frame"
              value={pageTableText}
              onChange={setPageTableText}
              rows={4}
            />
          )}

          {calculationType === "number-pages" && (
            <>
              <Field
                label="Process Size"
                value={processSize}
                onChange={setProcessSize}
                type="number"
              />
              <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
            </>
          )}

          {calculationType === "number-frames" && (
            <>
              <Field
                label="Physical Memory Size"
                value={physicalMemorySize}
                onChange={setPhysicalMemorySize}
                type="number"
              />
              <Field label="Frame Size" value={frameSize} onChange={setFrameSize} type="number" />
            </>
          )}

          {calculationType === "page-table-size" && (
            <>
              <Field
                label="Logical Address Space Size"
                value={logicalAddressSpaceSize}
                onChange={setLogicalAddressSpaceSize}
                type="number"
              />
              <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
              <Field
                label="Page Table Entry Size"
                value={pageTableEntrySize}
                onChange={setPageTableEntrySize}
                type="number"
              />
            </>
          )}

          {calculationType === "logical-bits" && (
            <>
              <Field
                label="Logical Address Space Size"
                value={logicalAddressSpaceSize}
                onChange={setLogicalAddressSpaceSize}
                type="number"
              />
              <Field
                label="Or Logical Address Bits"
                value={logicalAddressBits}
                onChange={setLogicalAddressBits}
                type="number"
              />
              <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
            </>
          )}

          {calculationType === "physical-bits" && (
            <>
              <Field
                label="Physical Memory Size"
                value={physicalMemorySize}
                onChange={setPhysicalMemorySize}
                type="number"
              />
              <Field
                label="Or Physical Address Bits"
                value={physicalAddressBits}
                onChange={setPhysicalAddressBits}
                type="number"
              />
              <Field label="Frame Size" value={frameSize} onChange={setFrameSize} type="number" />
            </>
          )}

          {calculationType === "eat" && (
            <>
              <Field label="TLB Hit Ratio" value={hitRatio} onChange={setHitRatio} />
              <Field
                label="Memory Access Time"
                value={memoryAccessTime}
                onChange={setMemoryAccessTime}
                type="number"
              />
              <Field
                label="TLB Access Time"
                value={tlbAccessTime}
                onChange={setTlbAccessTime}
                placeholder="Optional"
              />
              <Field
                label="Page Fault Rate"
                value={pageFaultRate}
                onChange={setPageFaultRate}
                placeholder="Optional"
              />
              <Field
                label="Page Fault Service Time"
                value={pageFaultServiceTime}
                onChange={setPageFaultServiceTime}
                placeholder="Optional"
              />
            </>
          )}

          {calculationType === "fragmentation" && (
            <>
              <Field
                label="Process Sizes"
                value={processSizes}
                onChange={setProcessSizes}
                placeholder="Example: 5000 7000"
              />
              <Field label="Page Size" value={pageSize} onChange={setPageSize} type="number" />
            </>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <ButtonRow onCalculate={calculateResult} onExample={fillExample} onReset={resetForm} />
          <ErrorMessage message={errorMessage} />
        </div>
      </Section>

      {result && (
        <>
          <Section title="Output Table">
            {calculationType === "fragmentation" ? (
              <>
                <SimpleTable
                  columns={[
                    { key: "processId", label: "Process", render: (row) => row.processId },
                    { key: "processSize", label: "Process Size" },
                    { key: "pagesRequired", label: "Pages Required" },
                    { key: "internalFragmentation", label: "Internal Fragmentation" },
                  ]}
                  rows={result.rows}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="exam-line">
                    Total Internal Fragmentation: {formatNumber(result.totalInternalFragmentation)}
                  </div>
                  <div className="exam-line">
                    Average Internal Fragmentation:{" "}
                    {formatNumber(result.averageInternalFragmentation)}
                  </div>
                </div>
              </>
            ) : (
              <KeyValueTable rows={result.rows} />
            )}
          </Section>
          <StepList steps={result.stepMessages} />
          <ExamFormat lines={result.examLines} />
        </>
      )}
    </div>
  );
}
