import { formatNumber } from "./formatters";

function validatePageReplacement(referenceString, frameCount) {
  if (referenceString.length === 0) {
    throw new Error("Reference string cannot be empty.");
  }

  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new Error("Number of frames must be a positive whole number.");
  }
}

function makeStep(reference, frames, isHit, replacedPage, message) {
  return {
    reference,
    frames: [...frames],
    isHit,
    replacedPage,
    message,
  };
}

export function calculatePageReplacement(algorithm, referenceString, frameCount) {
  validatePageReplacement(referenceString, frameCount);

  const frames = Array(frameCount).fill(null);
  const steps = [];
  const fifoQueue = [];
  const lastUsed = {};
  let pageFaults = 0;
  let hits = 0;

  referenceString.forEach((reference, referenceIndex) => {
    const pageIndex = frames.indexOf(reference);

    if (pageIndex !== -1) {
      hits += 1;
      lastUsed[reference] = referenceIndex;
      steps.push(
        makeStep(
          reference,
          frames,
          true,
          null,
          `${reference} is already present in a frame. It is a hit.`,
        ),
      );
      return;
    }

    pageFaults += 1;
    let replacedPage = null;
    const emptyFrameIndex = frames.indexOf(null);

    if (emptyFrameIndex !== -1) {
      frames[emptyFrameIndex] = reference;

      if (algorithm === "fifo") {
        fifoQueue.push(reference);
      }
    } else if (algorithm === "fifo") {
      replacedPage = fifoQueue.shift();
      const replaceIndex = frames.indexOf(replacedPage);
      frames[replaceIndex] = reference;
      fifoQueue.push(reference);
    } else if (algorithm === "lru") {
      let leastRecentPage = frames[0];

      frames.forEach((page) => {
        if (lastUsed[page] < lastUsed[leastRecentPage]) {
          leastRecentPage = page;
        }
      });

      replacedPage = leastRecentPage;
      const replaceIndex = frames.indexOf(leastRecentPage);
      frames[replaceIndex] = reference;
    } else {
      let farthestPage = frames[0];
      let farthestNextUse = -1;

      frames.forEach((page) => {
        const nextUse = referenceString
          .slice(referenceIndex + 1)
          .findIndex((futurePage) => futurePage === page);
        const realNextUse = nextUse === -1 ? Infinity : referenceIndex + 1 + nextUse;

        if (realNextUse > farthestNextUse) {
          farthestNextUse = realNextUse;
          farthestPage = page;
        }
      });

      replacedPage = farthestPage;
      const replaceIndex = frames.indexOf(farthestPage);
      frames[replaceIndex] = reference;
    }

    lastUsed[reference] = referenceIndex;
    steps.push(
      makeStep(
        reference,
        frames,
        false,
        replacedPage,
        replacedPage === null
          ? `${reference} is not present, so it is loaded into an empty frame.`
          : `${reference} is not present, so ${replacedPage} is replaced.`,
      ),
    );
  });

  const pageFaultRatio = pageFaults / referenceString.length;
  const hitRatio = hits / referenceString.length;
  const algorithmNames = {
    fifo: "FIFO",
    lru: "LRU",
    optimal: "Optimal",
  };

  return {
    steps,
    pageFaults,
    hits,
    pageFaultRatio,
    hitRatio,
    stepMessages: steps.map((step, index) => {
      const status = step.isHit ? "Hit" : "Fault";
      return `Reference ${index + 1}: ${step.reference} gives ${status}. ${step.message}`;
    }),
    examLines: [
      {
        label: "Given",
        value: `Reference string = ${referenceString.join(", ")}, Frames = ${frameCount}`,
      },
      {
        label: "Formula",
        value: "Page fault ratio = Page faults / Total references, Hit ratio = Hits / Total references",
      },
      {
        label: "Substitution",
        value: `Page fault ratio = ${pageFaults} / ${referenceString.length} = ${formatNumber(
          pageFaultRatio,
        )}`,
      },
      {
        label: "Substitution",
        value: `Hit ratio = ${hits} / ${referenceString.length} = ${formatNumber(hitRatio)}`,
      },
      {
        label: "Final Answer",
        value: `${algorithmNames[algorithm]} gives ${pageFaults} page faults and ${hits} hits.`,
      },
    ],
  };
}
