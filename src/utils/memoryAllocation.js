import { formatNumber } from "./formatters";

function findBlockIndex(algorithm, remainingBlocks, processSize) {
  let selectedIndex = -1;

  remainingBlocks.forEach((blockSize, index) => {
    if (blockSize < processSize) {
      return;
    }

    if (selectedIndex === -1) {
      selectedIndex = index;
      return;
    }

    if (algorithm === "best-fit" && blockSize < remainingBlocks[selectedIndex]) {
      selectedIndex = index;
    }

    if (algorithm === "worst-fit" && blockSize > remainingBlocks[selectedIndex]) {
      selectedIndex = index;
    }
  });

  return selectedIndex;
}

export function calculateMemoryAllocation(algorithm, blockSizes, processSizes) {
  if (blockSizes.length === 0 || processSizes.length === 0) {
    throw new Error("Enter memory blocks and process sizes.");
  }

  const hasInvalidBlock = blockSizes.some((blockSize) => blockSize <= 0);
  const hasInvalidProcess = processSizes.some((processSize) => processSize <= 0);

  if (hasInvalidBlock || hasInvalidProcess) {
    throw new Error("Block sizes and process sizes must be positive.");
  }

  const remainingBlocks = [...blockSizes];
  const allocations = [];
  const stepMessages = [];

  processSizes.forEach((processSize, processIndex) => {
    const blockIndex = findBlockIndex(algorithm, remainingBlocks, processSize);

    if (blockIndex === -1) {
      allocations.push({
        processId: `P${processIndex + 1}`,
        processSize,
        blockId: "-",
        blockOriginalSize: "-",
        remainingAfterAllocation: "-",
        status: "Not Allocated",
      });
      stepMessages.push(`P${processIndex + 1} of size ${processSize} cannot be allocated.`);
      return;
    }

    const originalRemainingSize = remainingBlocks[blockIndex];
    remainingBlocks[blockIndex] -= processSize;
    allocations.push({
      processId: `P${processIndex + 1}`,
      processSize,
      blockId: `B${blockIndex + 1}`,
      blockOriginalSize: originalRemainingSize,
      remainingAfterAllocation: remainingBlocks[blockIndex],
      status: "Allocated",
    });
    stepMessages.push(
      `P${processIndex + 1} of size ${processSize} is allocated to B${blockIndex + 1}. Remaining size = ${remainingBlocks[blockIndex]}.`,
    );
  });

  const unallocatedProcesses = allocations
    .filter((allocation) => allocation.status !== "Allocated")
    .map((allocation) => allocation.processId);
  const totalRemainingMemory = remainingBlocks.reduce((total, blockSize) => total + blockSize, 0);
  const largestRemainingBlock = Math.max(...remainingBlocks);
  const totalUnallocatedNeed = allocations
    .filter((allocation) => allocation.status !== "Allocated")
    .reduce((total, allocation) => total + allocation.processSize, 0);

  const algorithmNames = {
    "first-fit": "First Fit",
    "best-fit": "Best Fit",
    "worst-fit": "Worst Fit",
  };

  return {
    blockSizes,
    allocations,
    remainingBlocks,
    unallocatedProcesses,
    totalRemainingMemory,
    largestRemainingBlock,
    totalUnallocatedNeed,
    stepMessages,
    examLines: [
      {
        label: "Given",
        value: `Blocks = ${blockSizes.join(", ")}, Processes = ${processSizes.join(", ")}`,
      },
      {
        label: "Formula",
        value: `${algorithmNames[algorithm]} selects a suitable block and reduces its remaining size.`,
      },
      {
        label: "Substitution",
        value: `Total remaining memory = ${remainingBlocks
          .map((blockSize) => formatNumber(blockSize))
          .join(" + ")} = ${formatNumber(totalRemainingMemory)}`,
      },
      {
        label: "Final Answer",
        value:
          unallocatedProcesses.length > 0
            ? `Not allocated: ${unallocatedProcesses.join(", ")}`
            : "All processes are allocated.",
      },
    ],
  };
}
