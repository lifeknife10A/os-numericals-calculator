import { useEffect, useMemo, useState } from "react";
import BankersCalculator from "./modules/BankersCalculator";
import CpuSchedulingCalculator from "./modules/CpuSchedulingCalculator";
import DeadlockDetectionCalculator from "./modules/DeadlockDetectionCalculator";
import DiskSchedulingCalculator from "./modules/DiskSchedulingCalculator";
import MemoryAllocationCalculator from "./modules/MemoryAllocationCalculator";
import PageReplacementCalculator from "./modules/PageReplacementCalculator";
import PagingAddressCalculator from "./modules/PagingAddressCalculator";
import PagingNumericalsCalculator from "./modules/PagingNumericalsCalculator";
import ResourceAllocationGraphCalculator from "./modules/ResourceAllocationGraphCalculator";
import SegmentationCalculator from "./modules/SegmentationCalculator";
import { clearRecentCalculations, getRecentCalculations } from "./utils/storage";
import {
  Binary,
  BookOpen,
  Cpu,
  Database,
  GitBranch,
  HardDrive,
  Layers,
  LayoutDashboard,
  Moon,
  Network,
  ShieldCheck,
  Sun,
} from "lucide-react";

const modules = [
  {
    id: "cpu",
    title: "CPU Scheduling Calculator",
    group: "Process Scheduling",
    description: "FCFS, SJF, SRTF, Priority, and Round Robin with Gantt chart.",
    component: CpuSchedulingCalculator,
    icon: Cpu,
  },
  {
    id: "page-replacement",
    title: "Page Replacement Calculator",
    group: "Memory Management",
    description: "FIFO, LRU, and Optimal with frame table and fault ratios.",
    component: PageReplacementCalculator,
    icon: Layers,
  },
  {
    id: "disk",
    title: "Disk Scheduling Calculator",
    group: "I/O Management",
    description: "FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK movement.",
    component: DiskSchedulingCalculator,
    icon: HardDrive,
  },
  {
    id: "bankers",
    title: "Banker's Algorithm Calculator",
    group: "Deadlock",
    description: "Need matrix, safe sequence, and optional resource request.",
    component: BankersCalculator,
    icon: ShieldCheck,
  },
  {
    id: "deadlock-detection",
    title: "Deadlock Detection Calculator",
    group: "Deadlock",
    description: "Work vector, Finish status, and deadlocked processes.",
    component: DeadlockDetectionCalculator,
    icon: GitBranch,
  },
  {
    id: "resource-allocation-graph",
    title: "Resource Allocation Graph",
    group: "Deadlock",
    description: "Draw request and allocation edges, detect cycles, and explain deadlock risk.",
    component: ResourceAllocationGraphCalculator,
    icon: Network,
  },
  {
    id: "memory-allocation",
    title: "Memory Allocation Calculator",
    group: "Memory Management",
    description: "First Fit, Best Fit, and Worst Fit allocation tables.",
    component: MemoryAllocationCalculator,
    icon: Database,
  },
  {
    id: "paging-address",
    title: "Paging Address Translation",
    group: "Memory Management",
    description: "Page number, offset, frame number, and physical address.",
    component: PagingAddressCalculator,
    icon: Binary,
  },
  {
    id: "segmentation",
    title: "Segmentation Address Translation",
    group: "Memory Management",
    description: "Segment table validation and physical address calculation.",
    component: SegmentationCalculator,
    icon: Database,
  },
  {
    id: "paging-numericals",
    title: "Paging Numericals",
    group: "Memory Management",
    description: "Common paging formulas including bits, frames, EAT, and fragmentation.",
    component: PagingNumericalsCalculator,
    icon: BookOpen,
  },
];

function ModuleVisual({ moduleId }) {
  if (moduleId === "cpu") {
    return (
      <div className="flex h-16 items-end gap-1 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        {[45, 70, 35, 55].map((height, index) => (
          <div
            className="flex-1 rounded-sm bg-cyan-600"
            key={index}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }

  if (moduleId === "disk") {
    return (
      <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        <svg viewBox="0 0 220 56" className="h-16 w-full" aria-hidden="true">
          <polyline
            points="12,42 55,18 88,34 138,12 198,30"
            fill="none"
            stroke="#0891b2"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[12, 55, 88, 138, 198].map((xValue, index) => (
            <circle cx={xValue} cy={[42, 18, 34, 12, 30][index]} r="6" fill="#0f766e" key={xValue} />
          ))}
        </svg>
      </div>
    );
  }

  if (moduleId === "bankers" || moduleId === "deadlock-detection") {
    return (
      <div className="grid h-16 grid-cols-5 gap-1 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        {Array.from({ length: 15 }).map((_, index) => (
          <div
            className={`rounded-sm ${
              index % 4 === 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            key={index}
          />
        ))}
      </div>
    );
  }

  if (moduleId === "resource-allocation-graph") {
    return (
      <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        <svg viewBox="0 0 220 64" className="h-16 w-full" aria-hidden="true">
          <circle cx="74" cy="16" r="11" fill="#0891b2" />
          <circle cx="74" cy="48" r="11" fill="#0891b2" />
          <rect x="138" y="6" width="28" height="20" rx="5" fill="#14b8a6" />
          <rect x="138" y="38" width="28" height="20" rx="5" fill="#14b8a6" />
          <path
            d="M85 16 C103 6, 126 6, 138 16"
            fill="none"
            stroke="#f97316"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <path
            d="M138 48 C120 58, 97 58, 85 48"
            fill="none"
            stroke="#14b8a6"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <path
            d="M74 27 C61 38, 61 50, 74 48"
            fill="none"
            stroke="#ef4444"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <path
            d="M166 16 C182 28, 182 38, 166 48"
            fill="none"
            stroke="#ef4444"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
        </svg>
      </div>
    );
  }

  if (moduleId === "memory-allocation") {
    return (
      <div className="space-y-2 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        {[80, 45, 65].map((widthValue, index) => (
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800" key={index}>
            <div className="h-full rounded-full bg-cyan-600" style={{ width: `${widthValue}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (moduleId === "page-replacement") {
    return (
      <div className="grid h-16 grid-cols-6 gap-1 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            className={`rounded-sm ${
              index % 5 === 0 ? "bg-red-400" : "bg-cyan-500"
            }`}
            key={index}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
      <div className="flex h-16 items-center justify-center">
        <div className="relative h-12 w-12 rounded-md border-4 border-cyan-600">
          <div className="absolute left-2 top-2 h-3 w-3 rounded-sm bg-cyan-600" />
          <div className="absolute bottom-2 right-2 h-3 w-3 rounded-sm bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function RecentCalculations() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function refreshItems() {
      setItems(getRecentCalculations());
    }

    refreshItems();
    window.addEventListener("recent-calculations-updated", refreshItems);
    return () => window.removeEventListener("recent-calculations-updated", refreshItems);
  }, []);

  if (items.length === 0) {
    return (
      <div className="panel p-4">
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          Recent Calculations
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">No recent calculations yet.</p>
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Calculations
        </h2>
        <button className="small-button" type="button" onClick={clearRecentCalculations}>
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950" key={item.id}>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {item.moduleName}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">{item.summary}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ onSelectModule }) {
  const groupedModules = useMemo(() => {
    const groups = {};

    modules.forEach((moduleItem) => {
      if (!groups[moduleItem.group]) {
        groups[moduleItem.group] = [];
      }

      groups[moduleItem.group].push(moduleItem);
    });

    return groups;
  }, []);

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          Operating Systems Numericals Calculator
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          A revision dashboard for solving OS numericals in table, formula, and final-answer format.
        </p>
      </section>

      {Object.entries(groupedModules).map(([groupName, groupModules]) => (
        <section key={groupName}>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            {groupName}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groupModules.map((moduleItem) => (
              <button
                className="panel p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-lg dark:hover:border-cyan-500"
                key={moduleItem.id}
                type="button"
                onClick={() => onSelectModule(moduleItem.id)}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">
                    <moduleItem.icon size={21} />
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {moduleItem.group}
                  </span>
                </div>
                <div className="mb-4">
                  <ModuleVisual moduleId={moduleItem.id} />
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-white">
                  {moduleItem.title}
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {moduleItem.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      <RecentCalculations />
    </div>
  );
}

export default function App() {
  const [selectedModuleId, setSelectedModuleId] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("os-numericals-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("os-numericals-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const selectedModule = modules.find((moduleItem) => moduleItem.id === selectedModuleId);
  const SelectedComponent = selectedModule?.component;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#070a12]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <button
            className="inline-flex items-center gap-3 text-left text-lg font-bold text-slate-950 dark:text-white"
            type="button"
            onClick={() => setSelectedModuleId("dashboard")}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-700 text-white">
              <BookOpen size={20} />
            </span>
            OS Numericals Calculator
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className="small-button"
              type="button"
              onClick={() => setSelectedModuleId("dashboard")}
            >
              <LayoutDashboard size={17} />
              Dashboard
            </button>
            <button
              className="small-button"
              type="button"
              onClick={() => setIsDarkMode((oldValue) => !oldValue)}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit p-3">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Modules
          </div>
          <nav className="space-y-1">
            {modules.map((moduleItem) => (
              <button
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selectedModuleId === moduleItem.id
                    ? "bg-cyan-700 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
                key={moduleItem.id}
                type="button"
                onClick={() => setSelectedModuleId(moduleItem.id)}
              >
                <moduleItem.icon size={17} />
                {moduleItem.title}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          {selectedModuleId === "dashboard" ? (
            <Dashboard onSelectModule={setSelectedModuleId} />
          ) : (
            <div className="space-y-4">
              <section className="panel p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-center">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-100">
                      <selectedModule.icon size={16} />
                      {selectedModule.group}
                    </div>
                    <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                      {selectedModule.title}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {selectedModule.description}
                    </p>
                  </div>
                  <ModuleVisual moduleId={selectedModule.id} />
                </div>
              </section>
              <SelectedComponent />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
