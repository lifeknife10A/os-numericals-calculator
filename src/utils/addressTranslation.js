import { formatNumber } from "./formatters";

export function calculatePagingAddress(logicalAddress, pageSize, pageTable) {
  if (!Number.isInteger(logicalAddress) || logicalAddress < 0) {
    throw new Error("Logical address must be a non-negative whole number.");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("Page size must be a positive whole number.");
  }

  const pageNumber = Math.floor(logicalAddress / pageSize);
  const offset = logicalAddress % pageSize;
  const frameNumber = pageTable[pageNumber];

  if (frameNumber === undefined || frameNumber === null || frameNumber === "") {
    return {
      pageNumber,
      offset,
      frameNumber: null,
      physicalAddress: null,
      isValid: false,
      stepMessages: [
        `Page number = floor(${logicalAddress} / ${pageSize}) = ${pageNumber}.`,
        `Offset = ${logicalAddress} % ${pageSize} = ${offset}.`,
        `Page ${pageNumber} is not present in the page table.`,
      ],
      examLines: [
        {
          label: "Given",
          value: `Logical Address = ${logicalAddress}, Page Size = ${pageSize}`,
        },
        {
          label: "Formula",
          value: "Page Number = floor(LA / Page Size), Offset = LA % Page Size",
        },
        {
          label: "Substitution",
          value: `Page Number = ${pageNumber}, Offset = ${offset}`,
        },
        {
          label: "Final Answer",
          value: "Page fault / invalid page.",
        },
      ],
    };
  }

  const physicalAddress = frameNumber * pageSize + offset;

  return {
    pageNumber,
    offset,
    frameNumber,
    physicalAddress,
    isValid: true,
    stepMessages: [
      `Page number = floor(${logicalAddress} / ${pageSize}) = ${pageNumber}.`,
      `Offset = ${logicalAddress} % ${pageSize} = ${offset}.`,
      `From page table, page ${pageNumber} maps to frame ${frameNumber}.`,
      `Physical address = ${frameNumber} x ${pageSize} + ${offset} = ${physicalAddress}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Logical Address = ${logicalAddress}, Page Size = ${pageSize}`,
      },
      {
        label: "Formula",
        value: "Physical Address = Frame Number x Page Size + Offset",
      },
      {
        label: "Substitution",
        value: `${frameNumber} x ${pageSize} + ${offset} = ${physicalAddress}`,
      },
      {
        label: "Final Answer",
        value: `Physical Address = ${formatNumber(physicalAddress)}`,
      },
    ],
  };
}

export function calculateSegmentationAddress(segmentNumber, offset, segmentTable) {
  if (!Number.isInteger(segmentNumber) || segmentNumber < 0) {
    throw new Error("Segment number must be a non-negative whole number.");
  }

  if (!Number.isFinite(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative number.");
  }

  const segmentEntry = segmentTable[segmentNumber];

  if (!segmentEntry) {
    return {
      segmentNumber,
      offset,
      baseAddress: null,
      limit: null,
      physicalAddress: null,
      isValid: false,
      stepMessages: [`Segment ${segmentNumber} is not present in the segment table.`],
      examLines: [
        {
          label: "Given",
          value: `Segment = ${segmentNumber}, Offset = ${offset}`,
        },
        {
          label: "Formula",
          value: "Address is valid only if offset < limit.",
        },
        {
          label: "Substitution",
          value: `Segment ${segmentNumber} not found.`,
        },
        {
          label: "Final Answer",
          value: "Trap / segmentation fault.",
        },
      ],
    };
  }

  const isValid = offset < segmentEntry.limit;
  const physicalAddress = isValid ? segmentEntry.baseAddress + offset : null;

  return {
    segmentNumber,
    offset,
    baseAddress: segmentEntry.baseAddress,
    limit: segmentEntry.limit,
    physicalAddress,
    isValid,
    stepMessages: isValid
      ? [
          `Check offset < limit: ${offset} < ${segmentEntry.limit}, so address is valid.`,
          `Physical address = base + offset = ${segmentEntry.baseAddress} + ${offset} = ${physicalAddress}.`,
        ]
      : [
          `Check offset < limit: ${offset} < ${segmentEntry.limit} is false.`,
          "The address is invalid and causes trap / segmentation fault.",
        ],
    examLines: [
      {
        label: "Given",
        value: `Segment = ${segmentNumber}, Offset = ${offset}, Base = ${segmentEntry.baseAddress}, Limit = ${segmentEntry.limit}`,
      },
      {
        label: "Formula",
        value: "If offset < limit, Physical Address = Base + Offset.",
      },
      {
        label: "Substitution",
        value: isValid
          ? `${segmentEntry.baseAddress} + ${offset} = ${physicalAddress}`
          : `${offset} is not less than ${segmentEntry.limit}`,
      },
      {
        label: "Final Answer",
        value: isValid
          ? `Physical Address = ${formatNumber(physicalAddress)}`
          : "Trap / segmentation fault.",
      },
    ],
  };
}
