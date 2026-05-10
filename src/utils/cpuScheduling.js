import { averageValues, formatNumber } from "./formatters";

function validateProcesses(processes, needsPriority) {
  if (processes.length === 0) {
    throw new Error("Enter at least one process.");
  }

  processes.forEach((process, index) => {
    if (!process.processId.trim()) {
      throw new Error(`Process ID is missing in row ${index + 1}.`);
    }

    if (!Number.isInteger(process.arrivalTime) || process.arrivalTime < 0) {
      throw new Error(`Arrival time in row ${index + 1} must be a whole number.`);
    }

    if (!Number.isInteger(process.burstTime) || process.burstTime <= 0) {
      throw new Error(`Burst time in row ${index + 1} must be a positive whole number.`);
    }

    if (needsPriority && !Number.isFinite(process.priority)) {
      throw new Error(`Priority is missing in row ${index + 1}.`);
    }
  });
}

function addSegment(segments, processId, startTime, endTime) {
  if (startTime === endTime) {
    return;
  }

  const lastSegment = segments[segments.length - 1];

  if (lastSegment && lastSegment.processId === processId && lastSegment.endTime === startTime) {
    lastSegment.endTime = endTime;
    return;
  }

  segments.push({
    processId,
    startTime,
    endTime,
  });
}

function createProcessCopies(processes) {
  return processes.map((process, index) => ({
    ...process,
    originalIndex: index,
    remainingTime: process.burstTime,
    completionTime: null,
    firstStartTime: null,
  }));
}

function sortByArrivalAndInputOrder(firstProcess, secondProcess) {
  if (firstProcess.arrivalTime !== secondProcess.arrivalTime) {
    return firstProcess.arrivalTime - secondProcess.arrivalTime;
  }

  return firstProcess.originalIndex - secondProcess.originalIndex;
}

function getPriorityValue(process, smallerNumberHigherPriority) {
  return smallerNumberHigherPriority ? process.priority : -process.priority;
}

function chooseNonPreemptiveProcess(availableProcesses, algorithm, smallerNumberHigherPriority) {
  const sortedProcesses = [...availableProcesses];

  sortedProcesses.sort((firstProcess, secondProcess) => {
    if (algorithm === "fcfs") {
      return sortByArrivalAndInputOrder(firstProcess, secondProcess);
    }

    if (algorithm === "sjf") {
      if (firstProcess.burstTime !== secondProcess.burstTime) {
        return firstProcess.burstTime - secondProcess.burstTime;
      }

      return sortByArrivalAndInputOrder(firstProcess, secondProcess);
    }

    const firstPriority = getPriorityValue(firstProcess, smallerNumberHigherPriority);
    const secondPriority = getPriorityValue(secondProcess, smallerNumberHigherPriority);

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return sortByArrivalAndInputOrder(firstProcess, secondProcess);
  });

  return sortedProcesses[0];
}

function choosePreemptiveProcess(availableProcesses, algorithm, smallerNumberHigherPriority) {
  const sortedProcesses = [...availableProcesses];

  sortedProcesses.sort((firstProcess, secondProcess) => {
    if (algorithm === "srtf") {
      if (firstProcess.remainingTime !== secondProcess.remainingTime) {
        return firstProcess.remainingTime - secondProcess.remainingTime;
      }
    } else {
      const firstPriority = getPriorityValue(firstProcess, smallerNumberHigherPriority);
      const secondPriority = getPriorityValue(secondProcess, smallerNumberHigherPriority);

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
      }
    }

    return sortByArrivalAndInputOrder(firstProcess, secondProcess);
  });

  return sortedProcesses[0];
}

function createResult(processes, segments, algorithmName, extraLines = []) {
  const rows = processes
    .map((process) => {
      const turnaroundTime = process.completionTime - process.arrivalTime;
      const waitingTime = turnaroundTime - process.burstTime;
      const responseTime = process.firstStartTime - process.arrivalTime;

      return {
        processId: process.processId,
        arrivalTime: process.arrivalTime,
        burstTime: process.burstTime,
        priority: process.priority,
        completionTime: process.completionTime,
        turnaroundTime,
        waitingTime,
        responseTime,
        firstStartTime: process.firstStartTime,
        originalIndex: process.originalIndex,
      };
    })
    .sort((firstRow, secondRow) => firstRow.originalIndex - secondRow.originalIndex);

  const averageWaitingTime = averageValues(rows.map((row) => row.waitingTime));
  const averageTurnaroundTime = averageValues(rows.map((row) => row.turnaroundTime));
  const averageResponseTime = averageValues(rows.map((row) => row.responseTime));

  const waitingSubstitution = rows.map((row) => formatNumber(row.waitingTime)).join(" + ");
  const turnaroundSubstitution = rows.map((row) => formatNumber(row.turnaroundTime)).join(" + ");
  const responseSubstitution = rows.map((row) => formatNumber(row.responseTime)).join(" + ");

  const stepMessages = [
    `Algorithm selected: ${algorithmName}.`,
    ...extraLines,
    ...segments.map(
      (segment) =>
        `${segment.processId} runs from ${formatNumber(segment.startTime)} to ${formatNumber(
          segment.endTime,
        )}.`,
    ),
    "Turnaround Time = Completion Time - Arrival Time.",
    "Waiting Time = Turnaround Time - Burst Time.",
    "Response Time = First Start Time - Arrival Time.",
  ];

  const examLines = [
    {
      label: "Given",
      value: `${algorithmName} process table with arrival time and burst time.`,
    },
    {
      label: "Formula",
      value: "TAT = CT - AT, WT = TAT - BT, RT = First Start - AT",
    },
    {
      label: "Substitution",
      value: `Average WT = (${waitingSubstitution}) / ${rows.length} = ${formatNumber(
        averageWaitingTime,
      )}`,
    },
    {
      label: "Substitution",
      value: `Average TAT = (${turnaroundSubstitution}) / ${rows.length} = ${formatNumber(
        averageTurnaroundTime,
      )}`,
    },
    {
      label: "Substitution",
      value: `Average RT = (${responseSubstitution}) / ${rows.length} = ${formatNumber(
        averageResponseTime,
      )}`,
    },
    {
      label: "Final Answer",
      value: `AWT = ${formatNumber(averageWaitingTime)}, ATAT = ${formatNumber(
        averageTurnaroundTime,
      )}, ART = ${formatNumber(averageResponseTime)}`,
    },
  ];

  return {
    rows,
    segments,
    averageWaitingTime,
    averageTurnaroundTime,
    averageResponseTime,
    stepMessages,
    examLines,
  };
}

function calculateNonPreemptive(processes, algorithm, smallerNumberHigherPriority) {
  const processCopies = createProcessCopies(processes);
  const segments = [];
  let currentTime = 0;
  let completedCount = 0;

  while (completedCount < processCopies.length) {
    const availableProcesses = processCopies.filter(
      (process) => process.completionTime === null && process.arrivalTime <= currentTime,
    );

    if (availableProcesses.length === 0) {
      const nextArrivalTime = Math.min(
        ...processCopies
          .filter((process) => process.completionTime === null)
          .map((process) => process.arrivalTime),
      );
      addSegment(segments, "Idle", currentTime, nextArrivalTime);
      currentTime = nextArrivalTime;
      continue;
    }

    const selectedProcess = chooseNonPreemptiveProcess(
      availableProcesses,
      algorithm,
      smallerNumberHigherPriority,
    );

    selectedProcess.firstStartTime = currentTime;
    addSegment(
      segments,
      selectedProcess.processId,
      currentTime,
      currentTime + selectedProcess.burstTime,
    );
    currentTime += selectedProcess.burstTime;
    selectedProcess.remainingTime = 0;
    selectedProcess.completionTime = currentTime;
    completedCount += 1;
  }

  return {
    processCopies,
    segments,
  };
}

function calculatePreemptive(processes, algorithm, smallerNumberHigherPriority) {
  const processCopies = createProcessCopies(processes);
  const segments = [];
  let currentTime = 0;
  let completedCount = 0;

  while (completedCount < processCopies.length) {
    const availableProcesses = processCopies.filter(
      (process) => process.remainingTime > 0 && process.arrivalTime <= currentTime,
    );

    if (availableProcesses.length === 0) {
      const nextArrivalTime = Math.min(
        ...processCopies
          .filter((process) => process.remainingTime > 0)
          .map((process) => process.arrivalTime),
      );
      addSegment(segments, "Idle", currentTime, nextArrivalTime);
      currentTime = nextArrivalTime;
      continue;
    }

    const selectedProcess = choosePreemptiveProcess(
      availableProcesses,
      algorithm,
      smallerNumberHigherPriority,
    );

    if (selectedProcess.firstStartTime === null) {
      selectedProcess.firstStartTime = currentTime;
    }

    addSegment(segments, selectedProcess.processId, currentTime, currentTime + 1);
    selectedProcess.remainingTime -= 1;
    currentTime += 1;

    if (selectedProcess.remainingTime === 0) {
      selectedProcess.completionTime = currentTime;
      completedCount += 1;
    }
  }

  return {
    processCopies,
    segments,
  };
}

function addArrivedProcesses(readyQueue, processCopies, nextProcessIndex, currentTime) {
  let newNextProcessIndex = nextProcessIndex;

  while (
    newNextProcessIndex < processCopies.length &&
    processCopies[newNextProcessIndex].arrivalTime <= currentTime
  ) {
    readyQueue.push(processCopies[newNextProcessIndex]);
    newNextProcessIndex += 1;
  }

  return newNextProcessIndex;
}

function calculateRoundRobin(processes, timeQuantum) {
  if (!Number.isInteger(timeQuantum) || timeQuantum <= 0) {
    throw new Error("Time quantum must be a positive whole number.");
  }

  const processCopies = createProcessCopies(processes).sort(sortByArrivalAndInputOrder);
  const segments = [];
  const readyQueue = [];
  let nextProcessIndex = 0;
  let completedCount = 0;
  let currentTime = 0;

  while (completedCount < processCopies.length) {
    nextProcessIndex = addArrivedProcesses(
      readyQueue,
      processCopies,
      nextProcessIndex,
      currentTime,
    );

    if (readyQueue.length === 0) {
      const nextArrivalTime = processCopies[nextProcessIndex].arrivalTime;
      addSegment(segments, "Idle", currentTime, nextArrivalTime);
      currentTime = nextArrivalTime;
      continue;
    }

    const selectedProcess = readyQueue.shift();

    if (selectedProcess.firstStartTime === null) {
      selectedProcess.firstStartTime = currentTime;
    }

    const runningTime = Math.min(timeQuantum, selectedProcess.remainingTime);
    const endTime = currentTime + runningTime;
    addSegment(segments, selectedProcess.processId, currentTime, endTime);
    selectedProcess.remainingTime -= runningTime;
    currentTime = endTime;

    nextProcessIndex = addArrivedProcesses(
      readyQueue,
      processCopies,
      nextProcessIndex,
      currentTime,
    );

    if (selectedProcess.remainingTime > 0) {
      readyQueue.push(selectedProcess);
    } else {
      selectedProcess.completionTime = currentTime;
      completedCount += 1;
    }
  }

  return {
    processCopies,
    segments,
  };
}

export function calculateCpuScheduling({
  algorithm,
  processes,
  timeQuantum,
  smallerNumberHigherPriority,
}) {
  const needsPriority = algorithm.includes("priority");
  validateProcesses(processes, needsPriority);

  const algorithmNames = {
    fcfs: "First Come First Served",
    sjf: "SJF Non-Preemptive",
    srtf: "SRTF / SJF Preemptive",
    "priority-non-preemptive": "Priority Non-Preemptive",
    "priority-preemptive": "Priority Preemptive",
    "round-robin": "Round Robin",
  };

  let result;
  const extraLines = [];

  if (algorithm === "round-robin") {
    result = calculateRoundRobin(processes, timeQuantum);
    extraLines.push(`Time quantum = ${timeQuantum}.`);
  } else if (algorithm === "srtf" || algorithm === "priority-preemptive") {
    result = calculatePreemptive(processes, algorithm, smallerNumberHigherPriority);
    extraLines.push("At every time unit, choose the best arrived process.");
  } else {
    result = calculateNonPreemptive(processes, algorithm, smallerNumberHigherPriority);
    extraLines.push("Once a process starts, it runs until completion.");
  }

  if (needsPriority) {
    extraLines.push(
      smallerNumberHigherPriority
        ? "Smaller priority number means higher priority."
        : "Larger priority number means higher priority.",
    );
  }

  return createResult(result.processCopies, result.segments, algorithmNames[algorithm], extraLines);
}
