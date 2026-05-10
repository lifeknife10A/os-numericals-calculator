import { formatNumber, isPowerOfTwo } from "./formatters";
import { calculatePagingAddress } from "./addressTranslation";

function normalizeRatio(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error("Ratio must be a valid number.");
  }

  const ratio = numberValue > 1 ? numberValue / 100 : numberValue;

  if (ratio < 0 || ratio > 1) {
    throw new Error("Ratio must be between 0 and 1, or between 0 and 100 percent.");
  }

  return ratio;
}

function getBitsFromSize(size) {
  const bits = Math.log2(size);
  return Number.isInteger(bits) ? bits : Math.ceil(bits);
}

export function calculatePageNumberOffset(logicalAddress, pageSize) {
  const pageNumber = Math.floor(logicalAddress / pageSize);
  const offset = logicalAddress % pageSize;

  return {
    rows: [
      { label: "Page Number", value: pageNumber },
      { label: "Offset", value: offset },
    ],
    stepMessages: [
      `Page number = floor(${logicalAddress} / ${pageSize}) = ${pageNumber}.`,
      `Offset = ${logicalAddress} % ${pageSize} = ${offset}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Logical Address = ${logicalAddress}, Page Size = ${pageSize}`,
      },
      {
        label: "Formula",
        value: "Page Number = floor(Logical Address / Page Size), Offset = Logical Address % Page Size",
      },
      {
        label: "Substitution",
        value: `Page Number = floor(${logicalAddress} / ${pageSize}) = ${pageNumber}, Offset = ${offset}`,
      },
      {
        label: "Final Answer",
        value: `Page Number = ${pageNumber}, Offset = ${offset}`,
      },
    ],
  };
}

export function calculatePagingPhysicalAddress(logicalAddress, pageSize, pageTable) {
  return calculatePagingAddress(logicalAddress, pageSize, pageTable);
}

export function calculateNumberOfPages(processSize, pageSize) {
  const numberOfPages = Math.ceil(processSize / pageSize);
  const remainder = processSize % pageSize;
  const lastPageUsage = remainder === 0 ? pageSize : remainder;
  const internalFragmentation = remainder === 0 ? 0 : pageSize - remainder;

  return {
    rows: [
      { label: "Number of Pages", value: numberOfPages },
      { label: "Last Page Used Space", value: lastPageUsage },
      { label: "Internal Fragmentation", value: internalFragmentation },
    ],
    stepMessages: [
      `Number of pages = ceil(${processSize} / ${pageSize}) = ${numberOfPages}.`,
      remainder === 0
        ? "Process size is exactly divisible by page size, so internal fragmentation is 0."
        : `Internal fragmentation = ${pageSize} - ${remainder} = ${internalFragmentation}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Process Size = ${processSize}, Page Size = ${pageSize}`,
      },
      {
        label: "Formula",
        value: "Number of Pages = ceil(Process Size / Page Size)",
      },
      {
        label: "Substitution",
        value: `ceil(${processSize} / ${pageSize}) = ${numberOfPages}`,
      },
      {
        label: "Final Answer",
        value: `Pages = ${numberOfPages}, Internal Fragmentation = ${internalFragmentation}`,
      },
    ],
  };
}

export function calculateNumberOfFrames(physicalMemorySize, frameSize) {
  const numberOfFrames = physicalMemorySize / frameSize;

  return {
    rows: [{ label: "Number of Frames", value: numberOfFrames }],
    stepMessages: [`Number of frames = ${physicalMemorySize} / ${frameSize} = ${numberOfFrames}.`],
    examLines: [
      {
        label: "Given",
        value: `Physical Memory Size = ${physicalMemorySize}, Frame Size = ${frameSize}`,
      },
      {
        label: "Formula",
        value: "Number of Frames = Physical Memory Size / Frame Size",
      },
      {
        label: "Substitution",
        value: `${physicalMemorySize} / ${frameSize} = ${numberOfFrames}`,
      },
      {
        label: "Final Answer",
        value: `Number of Frames = ${formatNumber(numberOfFrames)}`,
      },
    ],
  };
}

export function calculatePageTableSize(logicalAddressSpaceSize, pageSize, entrySize) {
  const numberOfPages = logicalAddressSpaceSize / pageSize;
  const pageTableSize = numberOfPages * entrySize;

  return {
    rows: [
      { label: "Number of Pages", value: numberOfPages },
      { label: "Page Table Entries", value: numberOfPages },
      { label: "Page Table Size", value: pageTableSize },
    ],
    stepMessages: [
      `Number of pages = ${logicalAddressSpaceSize} / ${pageSize} = ${numberOfPages}.`,
      `Page table size = ${numberOfPages} x ${entrySize} = ${pageTableSize}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Logical Address Space = ${logicalAddressSpaceSize}, Page Size = ${pageSize}, Entry Size = ${entrySize}`,
      },
      {
        label: "Formula",
        value: "Page Table Size = Number of Entries x Page Table Entry Size",
      },
      {
        label: "Substitution",
        value: `(${logicalAddressSpaceSize} / ${pageSize}) x ${entrySize} = ${pageTableSize}`,
      },
      {
        label: "Final Answer",
        value: `Page Table Size = ${formatNumber(pageTableSize)}`,
      },
    ],
  };
}

export function calculateLogicalBits({ logicalAddressSpaceSize, logicalAddressBits, pageSize }) {
  const totalBits =
    logicalAddressBits !== "" && logicalAddressBits !== null
      ? Number(logicalAddressBits)
      : getBitsFromSize(Number(logicalAddressSpaceSize));
  const offsetBits = getBitsFromSize(Number(pageSize));
  const pageNumberBits = totalBits - offsetBits;
  const note = isPowerOfTwo(Number(pageSize))
    ? ""
    : " Page size is not a power of 2, so bits are rounded up.";

  return {
    rows: [
      { label: "Total Logical Address Bits", value: totalBits },
      { label: "Offset Bits", value: offsetBits },
      { label: "Page Number Bits", value: pageNumberBits },
    ],
    stepMessages: [
      `Offset bits = log2(${pageSize}) = ${offsetBits}.${note}`,
      `Page number bits = ${totalBits} - ${offsetBits} = ${pageNumberBits}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Logical Bits = ${totalBits}, Page Size = ${pageSize}`,
      },
      {
        label: "Formula",
        value: "Offset Bits = log2(Page Size), Page Number Bits = Logical Bits - Offset Bits",
      },
      {
        label: "Substitution",
        value: `${totalBits} - ${offsetBits} = ${pageNumberBits}`,
      },
      {
        label: "Final Answer",
        value: `Page Number Bits = ${pageNumberBits}, Offset Bits = ${offsetBits}`,
      },
    ],
  };
}

export function calculatePhysicalBits({ physicalMemorySize, physicalAddressBits, frameSize }) {
  const totalBits =
    physicalAddressBits !== "" && physicalAddressBits !== null
      ? Number(physicalAddressBits)
      : getBitsFromSize(Number(physicalMemorySize));
  const offsetBits = getBitsFromSize(Number(frameSize));
  const frameNumberBits = totalBits - offsetBits;
  const note = isPowerOfTwo(Number(frameSize))
    ? ""
    : " Frame size is not a power of 2, so bits are rounded up.";

  return {
    rows: [
      { label: "Total Physical Address Bits", value: totalBits },
      { label: "Offset Bits", value: offsetBits },
      { label: "Frame Number Bits", value: frameNumberBits },
    ],
    stepMessages: [
      `Offset bits = log2(${frameSize}) = ${offsetBits}.${note}`,
      `Frame number bits = ${totalBits} - ${offsetBits} = ${frameNumberBits}.`,
    ],
    examLines: [
      {
        label: "Given",
        value: `Physical Bits = ${totalBits}, Frame Size = ${frameSize}`,
      },
      {
        label: "Formula",
        value: "Offset Bits = log2(Frame Size), Frame Number Bits = Physical Bits - Offset Bits",
      },
      {
        label: "Substitution",
        value: `${totalBits} - ${offsetBits} = ${frameNumberBits}`,
      },
      {
        label: "Final Answer",
        value: `Frame Number Bits = ${frameNumberBits}, Offset Bits = ${offsetBits}`,
      },
    ],
  };
}

export function calculateEffectiveAccessTime({
  hitRatio,
  memoryAccessTime,
  tlbAccessTime,
  pageFaultRate,
  pageFaultServiceTime,
}) {
  const memoryTime = Number(memoryAccessTime);
  const hitRatioValue = normalizeRatio(hitRatio);
  const missRatio = 1 - hitRatioValue;

  if (
    (pageFaultRate === "" && pageFaultServiceTime !== "") ||
    (pageFaultRate !== "" && pageFaultServiceTime === "")
  ) {
    throw new Error("Enter both page fault rate and page fault service time.");
  }

  if (pageFaultRate !== "" && pageFaultServiceTime !== "") {
    const pageFaultRateValue = normalizeRatio(pageFaultRate);
    const pageFaultService = Number(pageFaultServiceTime);

    if (!Number.isFinite(pageFaultService) || pageFaultService < 0) {
      throw new Error("Page fault service time must be a valid non-negative number.");
    }

    const eat =
      (1 - pageFaultRateValue) * memoryTime + pageFaultRateValue * pageFaultService;

    return {
      rows: [{ label: "Effective Access Time", value: eat }],
      stepMessages: [
        `EAT = (1 - ${pageFaultRateValue}) x ${memoryTime} + ${pageFaultRateValue} x ${pageFaultService}.`,
        `EAT = ${eat}.`,
      ],
      examLines: [
        {
          label: "Given",
          value: `Memory Access Time = ${memoryTime}, Page Fault Rate = ${pageFaultRateValue}`,
        },
        {
          label: "Formula",
          value: "EAT = (1 - Page Fault Rate) x Memory Access Time + Page Fault Rate x Page Fault Service Time",
        },
        {
          label: "Substitution",
          value: `(1 - ${pageFaultRateValue}) x ${memoryTime} + ${pageFaultRateValue} x ${pageFaultService} = ${formatNumber(
            eat,
          )}`,
        },
        {
          label: "Final Answer",
          value: `EAT = ${formatNumber(eat)}`,
        },
      ],
    };
  }

  let eat;
  let formula;
  let substitution;

  if (tlbAccessTime !== "") {
    const tlbTime = Number(tlbAccessTime);

    if (!Number.isFinite(tlbTime) || tlbTime < 0) {
      throw new Error("TLB access time must be a valid non-negative number.");
    }

    eat = hitRatioValue * (tlbTime + memoryTime) + missRatio * (tlbTime + 2 * memoryTime);
    formula =
      "EAT = Hit Ratio x (TLB Time + Memory Time) + Miss Ratio x (TLB Time + 2 x Memory Time)";
    substitution = `${hitRatioValue} x (${tlbTime} + ${memoryTime}) + ${missRatio} x (${tlbTime} + 2 x ${memoryTime}) = ${formatNumber(
      eat,
    )}`;
  } else {
    eat = hitRatioValue * memoryTime + missRatio * 2 * memoryTime;
    formula = "EAT = Hit Ratio x Memory Time + Miss Ratio x 2 x Memory Time";
    substitution = `${hitRatioValue} x ${memoryTime} + ${missRatio} x 2 x ${memoryTime} = ${formatNumber(
      eat,
    )}`;
  }

  return {
    rows: [
      { label: "Hit Ratio", value: hitRatioValue },
      { label: "Miss Ratio", value: missRatio },
      { label: "Effective Access Time", value: eat },
    ],
    stepMessages: [formula, substitution],
    examLines: [
      {
        label: "Given",
        value: `Hit Ratio = ${hitRatioValue}, Memory Access Time = ${memoryTime}`,
      },
      {
        label: "Formula",
        value: formula,
      },
      {
        label: "Substitution",
        value: substitution,
      },
      {
        label: "Final Answer",
        value: `EAT = ${formatNumber(eat)}`,
      },
    ],
  };
}

export function calculatePagingFragmentation(processSizes, pageSize) {
  const rows = processSizes.map((processSize, index) => {
    const pagesRequired = Math.ceil(processSize / pageSize);
    const remainder = processSize % pageSize;
    const internalFragmentation = remainder === 0 ? 0 : pageSize - remainder;

    return {
      processId: `P${index + 1}`,
      processSize,
      pagesRequired,
      internalFragmentation,
    };
  });

  const totalInternalFragmentation = rows.reduce(
    (total, row) => total + row.internalFragmentation,
    0,
  );
  const averageInternalFragmentation = totalInternalFragmentation / rows.length;

  return {
    rows,
    totalInternalFragmentation,
    averageInternalFragmentation,
    stepMessages: rows.map(
      (row) =>
        `${row.processId}: Pages = ceil(${row.processSize} / ${pageSize}) = ${row.pagesRequired}, Internal Fragmentation = ${row.internalFragmentation}.`,
    ),
    examLines: [
      {
        label: "Given",
        value: `Process Sizes = ${processSizes.join(", ")}, Page Size = ${pageSize}`,
      },
      {
        label: "Formula",
        value: "Internal Fragmentation = Page Size - Last Page Used Space",
      },
      {
        label: "Substitution",
        value: `Total Internal Fragmentation = ${rows
          .map((row) => row.internalFragmentation)
          .join(" + ")} = ${totalInternalFragmentation}`,
      },
      {
        label: "Final Answer",
        value: `Total IF = ${totalInternalFragmentation}, Average IF = ${formatNumber(
          averageInternalFragmentation,
        )}`,
      },
    ],
  };
}
