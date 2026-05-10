import { formatVector } from "./formatters";

function addVectors(firstVector, secondVector) {
  return firstVector.map((value, index) => value + secondVector[index]);
}

function isLessThanOrEqual(firstVector, secondVector) {
  return firstVector.every((value, index) => value <= secondVector[index]);
}

function hasAllocatedResources(allocationRow) {
  return allocationRow.some((value) => value > 0);
}

export function calculateDeadlockDetection(allocationMatrix, requestMatrix, availableVector) {
  if (allocationMatrix.length === 0) {
    throw new Error("Allocation matrix cannot be empty.");
  }

  if (allocationMatrix.length !== requestMatrix.length) {
    throw new Error("Allocation and Request matrices must have the same number of rows.");
  }

  const resourceCount = availableVector.length;

  allocationMatrix.forEach((row, rowIndex) => {
    if (row.length !== resourceCount || requestMatrix[rowIndex].length !== resourceCount) {
      throw new Error(`Row ${rowIndex + 1} must have ${resourceCount} resource values.`);
    }
  });

  let work = [...availableVector];
  const finish = allocationMatrix.map((row) => !hasAllocatedResources(row));
  const completionSequence = [];
  const steps = [];
  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (let processIndex = 0; processIndex < allocationMatrix.length; processIndex += 1) {
      if (!finish[processIndex] && isLessThanOrEqual(requestMatrix[processIndex], work)) {
        const workBefore = [...work];
        work = addVectors(work, allocationMatrix[processIndex]);
        finish[processIndex] = true;
        completionSequence.push(`P${processIndex}`);
        steps.push({
          processId: `P${processIndex}`,
          workBefore,
          request: [...requestMatrix[processIndex]],
          allocation: [...allocationMatrix[processIndex]],
          workAfter: [...work],
          finish: [...finish],
          message: `P${processIndex} can complete because Request ${formatVector(
            requestMatrix[processIndex],
          )} <= Work ${formatVector(workBefore)}.`,
        });
        progressMade = true;
      }
    }
  }

  const deadlockedProcesses = finish
    .map((isFinished, index) => (isFinished ? null : `P${index}`))
    .filter(Boolean);

  return {
    finish,
    steps,
    completionSequence,
    deadlockedProcesses,
    hasDeadlock: deadlockedProcesses.length > 0,
    stepMessages: steps.map((step) => step.message),
    examLines: [
      {
        label: "Given",
        value: `Available = ${formatVector(availableVector)}`,
      },
      {
        label: "Formula",
        value: "If Request <= Work, process finishes and Work = Work + Allocation.",
      },
      {
        label: "Substitution",
        value:
          completionSequence.length > 0
            ? `Completion sequence = ${completionSequence.join(" -> ")}`
            : "No process can complete.",
      },
      {
        label: "Final Answer",
        value:
          deadlockedProcesses.length > 0
            ? `Deadlocked processes: ${deadlockedProcesses.join(", ")}`
            : "No deadlock is present.",
      },
    ],
  };
}
