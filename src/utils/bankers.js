import { formatVector } from "./formatters";

function validateMatrices(allocationMatrix, maximumMatrix, availableVector) {
  if (allocationMatrix.length === 0) {
    throw new Error("Allocation matrix cannot be empty.");
  }

  const resourceCount = availableVector.length;

  allocationMatrix.forEach((row, rowIndex) => {
    if (row.length !== resourceCount) {
      throw new Error(`Allocation row ${rowIndex + 1} has wrong number of resources.`);
    }
  });

  maximumMatrix.forEach((row, rowIndex) => {
    if (row.length !== resourceCount) {
      throw new Error(`Max row ${rowIndex + 1} has wrong number of resources.`);
    }
  });
}

function subtractVectors(firstVector, secondVector) {
  return firstVector.map((value, index) => value - secondVector[index]);
}

function addVectors(firstVector, secondVector) {
  return firstVector.map((value, index) => value + secondVector[index]);
}

function isLessThanOrEqual(firstVector, secondVector) {
  return firstVector.every((value, index) => value <= secondVector[index]);
}

function createNeedMatrix(allocationMatrix, maximumMatrix) {
  return maximumMatrix.map((maximumRow, rowIndex) => {
    return maximumRow.map((maximumValue, columnIndex) => {
      const needValue = maximumValue - allocationMatrix[rowIndex][columnIndex];

      if (needValue < 0) {
        throw new Error(`Max must be greater than or equal to Allocation at P${rowIndex}.`);
      }

      return needValue;
    });
  });
}

export function runBankerSafety(allocationMatrix, needMatrix, availableVector) {
  const processCount = allocationMatrix.length;
  let work = [...availableVector];
  const finish = Array(processCount).fill(false);
  const safeSequence = [];
  const steps = [];
  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (let processIndex = 0; processIndex < processCount; processIndex += 1) {
      if (!finish[processIndex] && isLessThanOrEqual(needMatrix[processIndex], work)) {
        const workBefore = [...work];
        work = addVectors(work, allocationMatrix[processIndex]);
        finish[processIndex] = true;
        safeSequence.push(`P${processIndex}`);
        steps.push({
          processId: `P${processIndex}`,
          workBefore,
          need: [...needMatrix[processIndex]],
          allocation: [...allocationMatrix[processIndex]],
          workAfter: [...work],
          finish: [...finish],
          message: `P${processIndex} can finish because Need ${formatVector(
            needMatrix[processIndex],
          )} <= Work ${formatVector(workBefore)}.`,
        });
        progressMade = true;
      }
    }
  }

  return {
    isSafe: finish.every(Boolean),
    safeSequence,
    finish,
    steps,
  };
}

export function calculateBankers({
  allocationMatrix,
  maximumMatrix,
  availableVector,
  requestProcessIndex,
  requestVector,
}) {
  validateMatrices(allocationMatrix, maximumMatrix, availableVector);

  const needMatrix = createNeedMatrix(allocationMatrix, maximumMatrix);
  const safetyResult = runBankerSafety(allocationMatrix, needMatrix, availableVector);
  let requestResult = null;

  if (requestVector && requestVector.length > 0) {
    if (requestVector.length !== availableVector.length) {
      throw new Error("Request vector must match the number of resources.");
    }

    if (
      !Number.isInteger(requestProcessIndex) ||
      requestProcessIndex < 0 ||
      requestProcessIndex >= allocationMatrix.length
    ) {
      throw new Error("Selected request process is invalid.");
    }

    const requestSteps = [];
    const selectedNeed = needMatrix[requestProcessIndex];

    if (!isLessThanOrEqual(requestVector, selectedNeed)) {
      requestSteps.push(
        `Request ${formatVector(requestVector)} is greater than Need ${formatVector(
          selectedNeed,
        )}. Request cannot be granted.`,
      );
      requestResult = {
        canGrant: false,
        requestSteps,
      };
    } else if (!isLessThanOrEqual(requestVector, availableVector)) {
      requestSteps.push(
        `Request ${formatVector(requestVector)} is greater than Available ${formatVector(
          availableVector,
        )}. Process must wait.`,
      );
      requestResult = {
        canGrant: false,
        requestSteps,
      };
    } else {
      requestSteps.push("Request <= Need is true.");
      requestSteps.push("Request <= Available is true.");

      const newAllocationMatrix = allocationMatrix.map((row, rowIndex) =>
        rowIndex === requestProcessIndex ? addVectors(row, requestVector) : [...row],
      );
      const newNeedMatrix = needMatrix.map((row, rowIndex) =>
        rowIndex === requestProcessIndex ? subtractVectors(row, requestVector) : [...row],
      );
      const newAvailableVector = subtractVectors(availableVector, requestVector);
      const newSafetyResult = runBankerSafety(
        newAllocationMatrix,
        newNeedMatrix,
        newAvailableVector,
      );

      requestSteps.push(
        `Pretend Available = ${formatVector(availableVector)} - ${formatVector(
          requestVector,
        )} = ${formatVector(newAvailableVector)}.`,
      );
      requestSteps.push(
        newSafetyResult.isSafe
          ? "After pretend allocation, system is safe. Request can be granted."
          : "After pretend allocation, system is unsafe. Request cannot be granted.",
      );

      requestResult = {
        canGrant: newSafetyResult.isSafe,
        requestSteps,
        safetyResult: newSafetyResult,
      };
    }
  }

  return {
    needMatrix,
    safetyResult,
    requestResult,
    stepMessages: safetyResult.steps.map((step) => step.message),
    examLines: [
      {
        label: "Given",
        value: `Allocation, Max, and Available = ${formatVector(availableVector)}`,
      },
      {
        label: "Formula",
        value: "Need = Max - Allocation. A state is safe if all processes can finish.",
      },
      {
        label: "Substitution",
        value: `Safe sequence = ${
          safetyResult.safeSequence.length > 0 ? safetyResult.safeSequence.join(" -> ") : "Not found"
        }`,
      },
      {
        label: "Final Answer",
        value: safetyResult.isSafe ? "System is in safe state." : "System is in unsafe state.",
      },
    ],
  };
}
