import { formatNumber } from "./formatters";

function validateDiskInput(requests, headPosition, minimumTrack, maximumTrack) {
  if (requests.length === 0) {
    throw new Error("Request queue cannot be empty.");
  }

  if (!Number.isFinite(headPosition)) {
    throw new Error("Initial head position must be a valid number.");
  }

  if (!Number.isFinite(minimumTrack) || !Number.isFinite(maximumTrack)) {
    throw new Error("Disk range must be valid.");
  }

  if (minimumTrack >= maximumTrack) {
    throw new Error("Disk minimum must be less than disk maximum.");
  }

  const outOfRangeRequest = requests.find(
    (request) => request < minimumTrack || request > maximumTrack,
  );

  if (outOfRangeRequest !== undefined) {
    throw new Error(`${outOfRangeRequest} is outside the disk range.`);
  }

  if (headPosition < minimumTrack || headPosition > maximumTrack) {
    throw new Error("Initial head position is outside the disk range.");
  }
}

function removeRepeatedNeighborValues(sequence) {
  return sequence.filter((value, index) => index === 0 || value !== sequence[index - 1]);
}

function calculateTotalMovement(sequence) {
  let totalMovement = 0;
  const movements = [];

  for (let index = 1; index < sequence.length; index += 1) {
    const fromTrack = sequence[index - 1];
    const toTrack = sequence[index];
    const movement = Math.abs(toTrack - fromTrack);
    totalMovement += movement;
    movements.push({
      fromTrack,
      toTrack,
      movement,
    });
  }

  return {
    totalMovement,
    movements,
  };
}

function getServiceOrderFromSequence(sequence, requests, headPosition, minimumTrack, maximumTrack) {
  const requestCounts = {};

  requests.forEach((request) => {
    requestCounts[request] = (requestCounts[request] || 0) + 1;
  });

  const serviceOrder = [];

  sequence.slice(1).forEach((track) => {
    const isBoundary = track === minimumTrack || track === maximumTrack;
    const isOnlyBoundaryMove = isBoundary && !requestCounts[track];

    if (!isOnlyBoundaryMove && requestCounts[track] > 0) {
      serviceOrder.push(track);
      requestCounts[track] -= 1;
    }
  });

  if (requests.includes(headPosition)) {
    serviceOrder.unshift(headPosition);
  }

  return serviceOrder;
}

function calculateSstf(requests, headPosition) {
  const pendingRequests = [...requests];
  const sequence = [headPosition];
  let currentHead = headPosition;

  while (pendingRequests.length > 0) {
    let bestIndex = 0;

    for (let index = 1; index < pendingRequests.length; index += 1) {
      const currentDistance = Math.abs(pendingRequests[index] - currentHead);
      const bestDistance = Math.abs(pendingRequests[bestIndex] - currentHead);

      if (
        currentDistance < bestDistance ||
        (currentDistance === bestDistance && pendingRequests[index] < pendingRequests[bestIndex])
      ) {
        bestIndex = index;
      }
    }

    const nextRequest = pendingRequests.splice(bestIndex, 1)[0];
    sequence.push(nextRequest);
    currentHead = nextRequest;
  }

  return sequence;
}

function calculateDirectionalSequence(
  algorithm,
  requests,
  headPosition,
  minimumTrack,
  maximumTrack,
  direction,
) {
  const leftRequests = requests.filter((request) => request < headPosition).sort((a, b) => a - b);
  const rightRequests = requests.filter((request) => request >= headPosition).sort((a, b) => a - b);

  if (algorithm === "scan") {
    if (direction === "right") {
      return [headPosition, ...rightRequests, maximumTrack, ...leftRequests.reverse()];
    }

    return [headPosition, ...leftRequests.reverse(), minimumTrack, ...rightRequests];
  }

  if (algorithm === "c-scan") {
    if (direction === "right") {
      return [headPosition, ...rightRequests, maximumTrack, minimumTrack, ...leftRequests];
    }

    return [headPosition, ...leftRequests.reverse(), minimumTrack, maximumTrack, ...rightRequests.reverse()];
  }

  if (algorithm === "look") {
    if (direction === "right") {
      return [headPosition, ...rightRequests, ...leftRequests.reverse()];
    }

    return [headPosition, ...leftRequests.reverse(), ...rightRequests];
  }

  if (direction === "right") {
    return [headPosition, ...rightRequests, ...leftRequests];
  }

  return [headPosition, ...leftRequests.reverse(), ...rightRequests.reverse()];
}

export function calculateDiskScheduling({
  algorithm,
  requests,
  headPosition,
  minimumTrack,
  maximumTrack,
  direction,
}) {
  validateDiskInput(requests, headPosition, minimumTrack, maximumTrack);

  let sequence;

  if (algorithm === "fcfs") {
    sequence = [headPosition, ...requests];
  } else if (algorithm === "sstf") {
    sequence = calculateSstf(requests, headPosition);
  } else {
    sequence = calculateDirectionalSequence(
      algorithm,
      requests,
      headPosition,
      minimumTrack,
      maximumTrack,
      direction,
    );
  }

  sequence = removeRepeatedNeighborValues(sequence);
  const { totalMovement, movements } = calculateTotalMovement(sequence);
  const serviceOrder =
    algorithm === "fcfs" || algorithm === "sstf"
      ? sequence.slice(1)
      : getServiceOrderFromSequence(sequence, requests, headPosition, minimumTrack, maximumTrack);

  const algorithmNames = {
    fcfs: "FCFS",
    sstf: "SSTF",
    scan: "SCAN",
    "c-scan": "C-SCAN",
    look: "LOOK",
    "c-look": "C-LOOK",
  };

  return {
    sequence,
    serviceOrder,
    movements,
    totalMovement,
    stepMessages: movements.map(
      (movement) =>
        `Move from ${movement.fromTrack} to ${movement.toTrack}: |${movement.toTrack} - ${movement.fromTrack}| = ${movement.movement}`,
    ),
    examLines: [
      {
        label: "Given",
        value: `Head = ${headPosition}, Queue = ${requests.join(", ")}, Direction = ${direction}`,
      },
      {
        label: "Formula",
        value: "Total head movement = Sum of absolute differences between consecutive positions",
      },
      {
        label: "Substitution",
        value: movements
          .map((movement) => formatNumber(movement.movement))
          .join(" + "),
      },
      {
        label: "Final Answer",
        value: `${algorithmNames[algorithm]} total head movement = ${formatNumber(totalMovement)}`,
      },
    ],
  };
}
