import { formatNumber } from "../utils/formatters";
import { Calculator, RotateCcw, Sparkles, Table2 } from "lucide-react";

const processColorClasses = [
  "bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-50 dark:border-cyan-700",
  "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-50 dark:border-emerald-700",
  "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-900 dark:text-amber-50 dark:border-amber-700",
  "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-900 dark:text-rose-50 dark:border-rose-700",
  "bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-50 dark:border-indigo-700",
  "bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-900 dark:text-teal-50 dark:border-teal-700",
];

function getProcessColorClass(processId) {
  if (processId === "Idle") {
    return "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }

  const characterTotal = String(processId)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return processColorClasses[characterTotal % processColorClasses.length];
}

export function Section({ title, children }) {
  return (
    <section className="panel">
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-cyan-600" />
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        className="input-box"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function shouldShowTablePreview(label) {
  const lowerLabel = label.toLowerCase();
  return (
    lowerLabel.includes("matrix") ||
    lowerLabel.includes("vector") ||
    lowerLabel.includes("mapping") ||
    lowerLabel.includes("table")
  );
}

function parsePreviewRows(value) {
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[:=\s,]+/).filter(Boolean))
    .filter((row) => row.length > 0)
    .slice(0, 6);
}

function MatrixPreview({ label, value }) {
  const previewRows = parsePreviewRows(value);

  if (!shouldShowTablePreview(label) || previewRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Table2 size={14} />
        Visual Preview
      </div>
      <div className="inline-grid gap-1">
        {previewRows.map((row, rowIndex) => (
          <div className="flex gap-1" key={rowIndex}>
            {row.slice(0, 8).map((cell, cellIndex) => (
              <span
                className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                key={`${cell}-${cellIndex}`}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <textarea
        className="input-box min-h-24 font-mono leading-7"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <MatrixPreview label={label} value={value} />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <select
        className="input-box"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ButtonRow({ onCalculate, onExample, onReset }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="primary-button" type="button" onClick={onCalculate}>
        <Calculator size={17} />
        Calculate
      </button>
      <button className="small-button" type="button" onClick={onExample}>
        <Sparkles size={17} />
        Example
      </button>
      <button className="small-button" type="button" onClick={onReset}>
        <RotateCcw size={17} />
        Reset
      </button>
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {message}
    </div>
  );
}

export function SimpleTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th className="table-head" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.processId || row.label || rowIndex}>
              {columns.map((column) => (
                <td className="table-cell" key={column.key}>
                  {column.render ? column.render(row) : formatNumber(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KeyValueTable({ rows }) {
  return (
    <SimpleTable
      columns={[
        { key: "label", label: "Item", render: (row) => row.label },
        {
          key: "value",
          label: "Value",
          render: (row) =>
            typeof row.value === "number" ? formatNumber(row.value) : String(row.value),
        },
      ]}
      rows={rows}
    />
  );
}

export function StepList({ steps }) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Section title="Step-by-Step Working">
      <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {steps.map((step, index) => (
          <li className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950" key={index}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function ExamFormat({ lines }) {
  if (!lines || lines.length === 0) {
    return null;
  }

  return (
    <Section title="Exam Writing Format">
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div className="exam-line" key={`${line.label}-${index}`}>
            <span className="font-semibold">{line.label}: </span>
            <span>{line.value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function MetricCards({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
          key={item.label}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.label}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {item.value}
          </div>
          {item.note && (
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SequenceChips({ title, values }) {
  if (!values || values.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((value, index) => (
          <div className="flex items-center gap-2" key={`${value}-${index}`}>
            <span className="rounded-md border border-cyan-200 bg-white px-3 py-1 text-sm font-semibold text-cyan-900 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-100">
              {value}
            </span>
            {index < values.length - 1 && (
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                -&gt;
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GanttChart({ segments }) {
  if (!segments || segments.length === 0) {
    return null;
  }

  const totalTime = segments[segments.length - 1].endTime - segments[0].startTime;

  return (
    <Section title="Gantt Chart">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px]">
          <div className="flex h-20 overflow-hidden rounded-t-lg border border-slate-300 dark:border-slate-700">
            {segments.map((segment, index) => {
              const duration = segment.endTime - segment.startTime;
              const widthPercent = Math.max((duration / totalTime) * 100, 7);

              return (
                <div
                  className={`flex flex-col items-center justify-center border-r text-sm font-semibold ${getProcessColorClass(
                    segment.processId,
                  )}`}
                  key={`${segment.processId}-${segment.startTime}-${index}`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span>{segment.processId}</span>
                  <span className="mt-1 text-xs font-medium opacity-80">
                    {formatNumber(duration)} unit
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative flex text-xs font-semibold text-slate-700 dark:text-slate-200">
            {segments.map((segment, index) => {
              const duration = segment.endTime - segment.startTime;
              const widthPercent = Math.max((duration / totalTime) * 100, 7);

              return (
                <div
                  className="relative pt-2"
                  key={`${segment.startTime}-${segment.endTime}`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="absolute left-0 -translate-x-1/2">
                    {formatNumber(segment.startTime)}
                  </span>
                  {index === segments.length - 1 && (
                    <span className="absolute right-0 translate-x-1/2">
                      {formatNumber(segment.endTime)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment, index) => (
              <div
                className={`rounded-md border px-3 py-2 text-xs font-semibold ${getProcessColorClass(
                  segment.processId,
                )}`}
                key={`${segment.processId}-legend-${index}`}
              >
                {segment.processId}: {formatNumber(segment.startTime)} to{" "}
                {formatNumber(segment.endTime)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function DiskMovementChart({ sequence, minimumTrack, maximumTrack, totalMovement }) {
  if (!sequence || sequence.length < 2) {
    return null;
  }

  const width = 860;
  const padding = 54;
  const rowHeight = 44;
  const height = padding * 2 + rowHeight * (sequence.length - 1);
  const trackRange = maximumTrack - minimumTrack || 1;
  const points = sequence.map((track, index) => {
    const x = padding + ((track - minimumTrack) / trackRange) * (width - padding * 2);
    const y = padding + index * rowHeight;
    return { track, x, y };
  });
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Section title="Head Movement Graph">
      <div className="overflow-x-auto">
        <svg
          className="min-w-[700px] rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Disk head movement graph"
        >
          <line
            x1={padding}
            x2={width - padding}
            y1={height - padding / 2}
            y2={height - padding / 2}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="2"
          />
          {[minimumTrack, maximumTrack].map((track) => {
            const x = padding + ((track - minimumTrack) / trackRange) * (width - padding * 2);
            return (
              <g key={track}>
                <line
                  x1={x}
                  x2={x}
                  y1={height - padding / 2 - 8}
                  y2={height - padding / 2 + 8}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-600 text-xs font-semibold dark:fill-slate-300"
                >
                  {track}
                </text>
              </g>
            );
          })}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#0891b2"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) => (
            <g key={`${point.track}-${index}`}>
              <circle cx={point.x} cy={point.y} r="9" fill="#0891b2" />
              <circle cx={point.x} cy={point.y} r="4" fill="white" />
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                className="fill-slate-800 text-xs font-semibold dark:fill-slate-100"
              >
                {point.track}
              </text>
            </g>
          ))}
          <text x={padding} y={28} className="fill-slate-700 text-sm font-semibold dark:fill-slate-200">
            Total head movement = {formatNumber(totalMovement)}
          </text>
        </svg>
      </div>
    </Section>
  );
}

export function MemoryBlockVisual({ blockSizes, remainingBlocks }) {
  if (!blockSizes || !remainingBlocks || blockSizes.length === 0) {
    return null;
  }

  const maximumBlockSize = Math.max(...blockSizes);

  return (
    <Section title="Memory Block Diagram">
      <div className="space-y-4">
        {blockSizes.map((blockSize, index) => {
          const remainingSize = remainingBlocks[index];
          const usedSize = blockSize - remainingSize;
          const usedPercent = Math.max((usedSize / blockSize) * 100, usedSize > 0 ? 8 : 0);
          const barWidthPercent = Math.max((blockSize / maximumBlockSize) * 100, 18);

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  B{index + 1} total {formatNumber(blockSize)}
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Used {formatNumber(usedSize)} | Free {formatNumber(remainingSize)}
                </span>
              </div>
              <div
                className="h-10 overflow-hidden rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                style={{ width: `${barWidthPercent}%` }}
              >
                <div
                  className="flex h-full items-center justify-center bg-cyan-600 text-xs font-semibold text-white"
                  style={{ width: `${usedPercent}%` }}
                >
                  {usedSize > 0 ? `Allocated ${formatNumber(usedSize)}` : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-6 rounded-sm bg-cyan-600" />
            Allocated
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-6 rounded-sm border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
            Free
          </span>
        </div>
      </div>
    </Section>
  );
}

export function MatrixDisplay({ title, matrix, rowPrefix = "P" }) {
  if (!matrix || matrix.length === 0) {
    return null;
  }

  const columns = [
    { key: "name", label: "Process", render: (row) => row.name },
    ...matrix[0].map((_, index) => ({
      key: `resource${index}`,
      label: `R${index}`,
      render: (row) => formatNumber(row.values[index]),
    })),
  ];
  const rows = matrix.map((values, index) => ({
    name: `${rowPrefix}${index}`,
    values,
  }));

  return (
    <Section title={title}>
      <SimpleTable columns={columns} rows={rows} />
    </Section>
  );
}

export function PageFrameTable({ steps }) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const frameCount = steps[0].frames.length;

  return (
    <Section title="Frame Table">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="table-head">Item</th>
              {steps.map((step, index) => (
                <th className="table-head text-center" key={`${step.reference}-${index}`}>
                  {step.reference}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: frameCount }).map((_, frameIndex) => (
              <tr key={frameIndex}>
                <td className="table-cell font-semibold">Frame {frameIndex + 1}</td>
                {steps.map((step, stepIndex) => (
                  <td
                    className={`table-cell text-center ${
                      step.isHit
                        ? "bg-emerald-50 dark:bg-emerald-950"
                        : "bg-red-50 dark:bg-red-950"
                    }`}
                    key={stepIndex}
                  >
                    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md bg-white px-2 font-semibold shadow-sm dark:bg-slate-900">
                      {step.frames[frameIndex] === null ? "-" : step.frames[frameIndex]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="table-cell font-semibold">Result</td>
              {steps.map((step, stepIndex) => (
                <td
                  className={`table-cell text-center font-semibold ${
                    step.isHit
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                  key={stepIndex}
                >
                  {step.isHit ? "Hit" : "Fault"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}
