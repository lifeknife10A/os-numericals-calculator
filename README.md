# Operating Systems Numericals Calculator

React + Tailwind CSS web app for Operating Systems exam numericals.

Live site:

```text
https://lifeknife10a.github.io/os-numericals-calculator/
```

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build for Deployment

```bash
npm run build
```

The generated `dist` folder can be deployed on Vercel, Netlify, or any static hosting service.

## Included Modules

- CPU Scheduling: FCFS, SJF, SRTF, Priority, Round Robin
- Page Replacement: FIFO, LRU, Optimal
- Disk Scheduling: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
- Banker's Algorithm
- Deadlock Detection
- Deadlock Resource Allocation Graph with visual cycle simulator
- Memory Allocation: First Fit, Best Fit, Worst Fit
- Paging Address Translation
- Segmentation Address Translation
- Paging Numericals: page offset, physical address, pages, frames, page table size, address bits, EAT, fragmentation

## Sample Test Cases

| Module | Sample Input |
| --- | --- |
| CPU Scheduling | P1 AT 0 BT 8, P2 AT 1 BT 4, P3 AT 2 BT 9, P4 AT 3 BT 5 |
| Round Robin | P1 BT 12, P2 BT 7, P3 BT 9, P4 BT 4, Quantum 4 |
| Page Replacement | Reference string `7 0 1 2 0 3 0 4 2 3 0 3 2`, Frames `3` |
| Disk Scheduling | Queue `98 183 37 122 14 124 65 67`, Head `53`, Range `0-199` |
| Banker | Allocation `0 1 0 / 2 0 0 / 3 0 2 / 2 1 1 / 0 0 2`, Available `3 3 2` |
| Deadlock Detection | Allocation and Request matrices from the Example button |
| Resource Allocation Graph | Create Cycle example: Processes `3`, Resources `1 1 1`, Allocation `R0 P1 / R1 P2 / R2 P0`, Request `P0 R0 / P1 R1 / P2 R2` |
| Memory Allocation | Blocks `100 500 200 300 600`, Processes `212 417 112 426` |
| Paging Address | Logical address `2500`, Page size `1000`, Page table `0 5 / 1 8 / 2 3 / 3 6` |
| Segmentation | Segment `2`, Offset `400`, Segment table `0 219 600 / 1 2300 14 / 2 90 500 / 3 1327 580` |
| Paging Numericals | Use each sub-module's Example button for direct exam-style cases |

Each calculator has Calculate, Example, Reset, output tables, step-by-step working, and an Exam Writing Format section.
