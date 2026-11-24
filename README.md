# SignalFlow Studio

**Create like an artist. Think like an engineer.**  
*Draw fast. Analyze deeply.*

SignalFlow Studio is a browser-first, client-side interactive timing-diagram editor and deterministic signal analysis workspace. It combines a fast, track-based editing workflow with an analytical, event-driven timing engine designed for embedded systems, hardware-in-the-loop (HIL), and system integration engineers.

> **Live Demo:** [https://github.com/danielstefaneng/signalflow-studio/](https://github.com/danielstefaneng/signalflow-studio/)  
> **Specification Baseline:** `SFS-SRS-003 v3.0`

---

## Core Design Principles

- **The starting diagram IS the tutorial:** Opens directly into an editable 3-track workspace (`Digital`, `Analog`, `Linked`) with no login, setup wizard, or blocking onboarding modal.
- **Direct manipulation first:** Drag digital edges horizontally, reshape analog ramp handles, and insert tracks inline (`+` above, between, or below tracks).
- **Progressive disclosure:** Common editing actions stay clean and immediate; advanced timing primitives, physical units, and formula rules are available on demand.
- **Deterministic math core:** Internal timestamps use exact nanosecond resolution; event evaluation and threshold crossings are computed analytically, independent of zoom level, DPI, or screen pixels.
- **Local-first & private:** Runs 100% client-side with local `.json` project persistence, browser auto-recovery, and zero mandatory cloud accounts or telemetry.

---

## Key Features

### Track & Waveform Editing
- **Three primary track types:** `Digital` (STEP), `Analog` (Linear Ramp / EXP_RC), and `Linked` (reactive logic-driven tracks).
- **UUID-based channel references:** Reordering, inserting, or deleting tracks automatically updates visual labels (`S1..Sn`) without breaking downstream logic links.
- **Context-aware guidance:** Non-blocking, offline state-machine hints that react to user actions and can be permanently disabled.

### Event-Driven Engine & V1.0 Timing Primitives
| Primitive | Behavior |
|---|---|
| `QUALIFY` | Debounce / glitch filter: asserts output after uninterrupted TRUE for `tQual`. |
| `HYSTERESIS` | Dual-threshold analog comparator (`Vhigh` / `Vlow`). |
| `DISCREPANCY_2OO2` | Redundant channel disagreement detector with configurable `tDisc` window and optional latch. |
| `DEADTIME` | Post-event inhibit window with hatched visual zone. |
| `WATCHDOG` | Missing-pulse timeout monitor with exact boundary semantics. |
| `JITTER_PROP` | Asymmetric early/late timing tolerance propagation (`[-early, +late]`). |

### Measurements, Deadlines & Export
- **Semantic Δt measurements:** Dimension bars remain attached to logical events (edges, ramp endpoints, threshold crossings) when waveforms move.
- **Deadlines:** Absolute or relative timing constraints with explicit `<` / `<=` strictness and visual violation flags.
- **Meeting-ready export:** Dark workspace theme by default with one-click high-contrast light-background PNG export (without editing handles or UI overlays).

---

## Built-in Industry Presets

*Note: All presets are conceptual educational illustrations, not certified safety or control specifications.*

1. **Automotive / ECU Power-Up & CAN Wake** (`QUALIFY`, analog threshold, inertial delay, ramp)
2. **Truck 24V / Cold Crank Brownout** (`HYSTERESIS` dual-threshold power recovery)
3. **Railway / Redundant Switch Discrepancy** (`DISCREPANCY_2OO2` fault window)
4. **Space / Command Glitch Immunity** (Spurious pulse rejection + delayed output)
5. **Robotics / E-Stop & STO Deadline** (Speed ramp vs. safety deadline check)
6. **UAV / Heartbeat Loss** (`WATCHDOG` timeout trigger)
7. **Medical / HV Charge & Refractory** (Qualification + `DEADTIME` inhibit window)

---

## System Architecture

The codebase enforces a strict layered separation with no UI dependencies inside the math or simulation core:

```text
[ Core (Models, ns Time, Math, Units) ]
                  │
                  ▼
[ Engine (DAG, Event Queue, Primitives) ]
                  │
                  ▼
[ Analysis (Δt Measurements, Deadlines) ]
                  │
                  ▼
[ UI (Canvas 2D, Track Headers, Coach) ]  +  [ Persistence / Export ]
