import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  Plus,
  Undo2,
  Redo2,
  Download,
  FileJson,
  Sparkles,
  Sliders,
  Layers,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Play,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Ruler,
  Clock,
  Cpu,
  ShieldAlert,
  FileText,
  ChevronRight,
  ChevronDown,
  X,
  Info,
  Check,
  FolderOpen,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Zap,
  Settings2,
  HelpCircle,
  Code2,
  Workflow
} from 'lucide-react';

// ============================================================================
// CORE DOMAIN & DETERMINISTIC TIMING ENGINE (SYS-001, CORE-001..036, LOGIC-001..009)
// Pure mathematical model independent of UI rendering pixels.
// ============================================================================

const INITIAL_STARTER_PROJECT = {
  schemaVersion: '3.0.0',
  engineVersion: '1.0.0',
  name: 'Quick Start — Starter Timing Diagram',
  presetId: 'STARTER',
  durationMs: 250,
  channels: [
    {
      uuid: 'ch-uuid-s1-ign',
      name: 'IGN_SW',
      domainType: 'DIGITAL', // DIGITAL | ANALOG_RAMP | BUS_STATE
      mode: 'MANUAL', // MANUAL | LOGIC_DRIVEN
      unit: 'Logic',
      minVal: 0,
      maxVal: 1,
      color: '#22d3ee', // Cyan
      locked: false,
      // Keyframes for DIGITAL: transitions at t (ms), value (0=LOW, 1=HIGH, 2=HIGH_Z, 3=UNKNOWN)
      keyframes: [
        { id: 'kf-s1-0', t: 0, v: 0, type: 'STEP', jitterEarly: 0, jitterLate: 0 },
        { id: 'kf-s1-1', t: 50, v: 1, type: 'STEP', jitterEarly: 0, jitterLate: 0 },
        { id: 'kf-s1-2', t: 150, v: 0, type: 'STEP', jitterEarly: 0, jitterLate: 0 }
      ],
      logicRule: null
    },
    {
      uuid: 'ch-uuid-s2-vbat',
      name: 'VBAT_RAMP',
      domainType: 'ANALOG_RAMP',
      mode: 'MANUAL',
      unit: 'V',
      minVal: 0,
      maxVal: 15,
      color: '#f59e0b', // Amber
      locked: false,
      // Piecewise linear/RC breakpoints: (t, v, type: 'LINEAR_RAMP' | 'STEP' | 'EXP_RC', tau)
      keyframes: [
        { id: 'kf-s2-0', t: 0, v: 0, type: 'STEP' },
        { id: 'kf-s2-1', t: 20, v: 0, type: 'LINEAR_RAMP' },
        { id: 'kf-s2-2', t: 60, v: 12, type: 'LINEAR_RAMP' },
        { id: 'kf-s2-3', t: 170, v: 12, type: 'LINEAR_RAMP' },
        { id: 'kf-s2-4', t: 210, v: 0, type: 'LINEAR_RAMP' }
      ],
      logicRule: null
    },
    {
      uuid: 'ch-uuid-s3-can',
      name: 'CAN_WAKE',
      domainType: 'DIGITAL',
      mode: 'LOGIC_DRIVEN',
      unit: 'Logic',
      minVal: 0,
      maxVal: 1,
      color: '#10b981', // Emerald
      locked: false,
      keyframes: [],
      logicRule: {
        kind: 'DELAY', // FOLLOW | DELAY | CONDITION | PRIMITIVE
        sourceUuid: 'ch-uuid-s1-ign',
        secondaryUuid: null,
        operator: 'FOLLOW', // FOLLOW | AND | OR | NOT | XOR | THRESHOLD_GE
        delayMs: 20,
        offDelayMs: 20,
        delayMode: 'INERTIAL', // INERTIAL | TRANSPORT
        thresholdVal: 6.0,
        primitive: 'NONE', // NONE | QUALIFY | HYSTERESIS | DISCREPANCY_2OO2 | DEADTIME | WATCHDOG | JITTER_PROP
        paramA: 10, // e.g., tQual, Vlow, tDisc, deadtimeMs, timeoutMs, jitterEarly
        paramB: 12  // e.g., Vhigh, jitterLate
      }
    }
  ],
  measurements: [
    {
      id: 'meas-1',
      label: 'Wakeup Delay Δt',
      sourceChannelUuid: 'ch-uuid-s1-ign',
      sourceEdgeIndex: 1, // 1st rising edge
      targetChannelUuid: 'ch-uuid-s3-can',
      targetEdgeIndex: 1
    }
  ],
  deadlines: []
};

// Preset Library (Section 8.2 - Preserved Domain Presets)
const INDUSTRY_PRESETS = {
  STARTER: {
    id: 'STARTER',
    title: 'Quick Start (3-Row Tutorial)',
    badge: 'UX-000 Default',
    category: 'Onboarding',
    summary: 'Self-teaching 3-track canvas: Digital pulse, Analog 12V ramp, and Linked +20ms follower.',
    project: INITIAL_STARTER_PROJECT
  },
  PRESET_001: {
    id: 'PRESET_001',
    title: 'Automotive / ECU Power-Up & CAN Wake',
    badge: 'PRESET-001',
    category: 'Automotive',
    summary: 'VBAT 0→12V ramp, IGN 2ms glitch at 45ms filtered by QUALIFY 10ms, CAN_EN threshold + delay.',
    project: {
      schemaVersion: '3.0.0',
      engineVersion: '1.0.0',
      name: 'PRESET-001: Automotive ECU Power-Up & CAN Wake',
      presetId: 'PRESET_001',
      durationMs: 250,
      channels: [
        {
          uuid: 'p1-vbat',
          name: 'VBAT_12V',
          domainType: 'ANALOG_RAMP',
          mode: 'MANUAL',
          unit: 'V',
          minVal: 0,
          maxVal: 15,
          color: '#f59e0b',
          locked: false,
          keyframes: [
            { id: 'k1', t: 0, v: 0, type: 'STEP' },
            { id: 'k2', t: 10, v: 0, type: 'LINEAR_RAMP' },
            { id: 'k3', t: 30, v: 12, type: 'LINEAR_RAMP' },
            { id: 'k4', t: 180, v: 12, type: 'LINEAR_RAMP' },
            { id: 'k5', t: 210, v: 0, type: 'LINEAR_RAMP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p1-ign-raw',
          name: 'IGN_RAW (with 2ms Glitch)',
          domainType: 'DIGITAL',
          mode: 'MANUAL',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#38bdf8',
          locked: false,
          keyframes: [
            { id: 'ig0', t: 0, v: 0, type: 'STEP' },
            { id: 'ig1', t: 45, v: 1, type: 'STEP' }, // 2ms spurious glitch
            { id: 'ig2', t: 47, v: 0, type: 'STEP' },
            { id: 'ig3', t: 50, v: 1, type: 'STEP' }, // Valid HIGH at 50ms
            { id: 'ig4', t: 150, v: 0, type: 'STEP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p1-ign-qual',
          name: 'IGN_QUALIFIED (Debounce 10ms)',
          domainType: 'DIGITAL',
          mode: 'LOGIC_DRIVEN',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#a855f7',
          locked: false,
          keyframes: [],
          logicRule: {
            kind: 'PRIMITIVE',
            sourceUuid: 'p1-ign-raw',
            secondaryUuid: null,
            operator: 'FOLLOW',
            delayMs: 0,
            offDelayMs: 0,
            delayMode: 'INERTIAL',
            thresholdVal: 6.0,
            primitive: 'QUALIFY',
            paramA: 10, // tQual = 10ms -> rejects 2ms glitch, rises at 60ms!
            paramB: 0
          }
        },
        {
          uuid: 'p1-can-en',
          name: 'CAN_EN (VBAT>=6V & IGN_QUAL +20ms)',
          domainType: 'DIGITAL',
          mode: 'LOGIC_DRIVEN',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#10b981',
          locked: false,
          keyframes: [],
          logicRule: {
            kind: 'DELAY',
            sourceUuid: 'p1-ign-qual',
            secondaryUuid: 'p1-vbat',
            operator: 'AND_THRESHOLD',
            delayMs: 20,
            offDelayMs: 10,
            delayMode: 'INERTIAL',
            thresholdVal: 6.0,
            primitive: 'NONE',
            paramA: 15,
            paramB: 5
          }
        }
      ],
      measurements: [
        {
          id: 'm-p1-1',
          label: 'Qualify 10ms',
          sourceChannelUuid: 'p1-ign-raw',
          sourceEdgeIndex: 3, // t=50ms
          targetChannelUuid: 'p1-ign-qual',
          targetEdgeIndex: 1 // t=60ms
        },
        {
          id: 'm-p1-2',
          label: 'CAN Wake Delay',
          sourceChannelUuid: 'p1-ign-qual',
          sourceEdgeIndex: 1, // t=60ms
          targetChannelUuid: 'p1-can-en',
          targetEdgeIndex: 1 // t=80ms
        }
      ],
      deadlines: [
        {
          id: 'dl-p1',
          label: 'CAN Ready <= 90ms',
          channelUuid: 'p1-can-en',
          edgeIndex: 1,
          limitMs: 90
        }
      ]
    }
  },
  PRESET_002: {
    id: 'PRESET_002',
    title: 'Truck 24V / Cold Crank Brownout',
    badge: 'PRESET-002',
    category: 'Heavy Duty',
    summary: 'VBAT drops from 24V to 10.5V during crank, recovers to 28V. RESET_N switches via HYSTERESIS (16V / 19.5V).',
    project: {
      schemaVersion: '3.0.0',
      engineVersion: '1.0.0',
      name: 'PRESET-002: Truck 24V Cold Crank Brownout (Hysteresis)',
      presetId: 'PRESET_002',
      durationMs: 250,
      channels: [
        {
          uuid: 'p2-vbat24',
          name: 'VBAT_24V_RAIL',
          domainType: 'ANALOG_RAMP',
          mode: 'MANUAL',
          unit: 'V',
          minVal: 0,
          maxVal: 32,
          color: '#f59e0b',
          locked: false,
          keyframes: [
            { id: 'b0', t: 0, v: 24, type: 'STEP' },
            { id: 'b1', t: 30, v: 24, type: 'LINEAR_RAMP' },
            { id: 'b2', t: 80, v: 10.5, type: 'LINEAR_RAMP' },
            { id: 'b3', t: 140, v: 28, type: 'LINEAR_RAMP' },
            { id: 'b4', t: 250, v: 28, type: 'LINEAR_RAMP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p2-reset',
          name: 'RESET_N (Hysteresis 16V..19.5V)',
          domainType: 'DIGITAL',
          mode: 'LOGIC_DRIVEN',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#10b981',
          locked: false,
          keyframes: [],
          logicRule: {
            kind: 'PRIMITIVE',
            sourceUuid: 'p2-vbat24',
            secondaryUuid: null,
            operator: 'THRESHOLD_GE',
            delayMs: 0,
            offDelayMs: 0,
            delayMode: 'INERTIAL',
            thresholdVal: 19.5,
            primitive: 'HYSTERESIS',
            paramA: 16.0, // Vlow
            paramB: 19.5  // Vhigh
          }
        }
      ],
      measurements: [
        {
          id: 'm-p2-1',
          label: 'Brownout Reset Active',
          sourceChannelUuid: 'p2-reset',
          sourceEdgeIndex: 1,
          targetChannelUuid: 'p2-reset',
          targetEdgeIndex: 2
        }
      ],
      deadlines: []
    }
  },
  PRESET_005: {
    id: 'PRESET_005',
    title: 'Robotics / E-Stop & STO Deadline',
    badge: 'PRESET-005',
    category: 'Safety / Robotics',
    summary: 'E_STOP_N falls at 30ms; Spindle decelerates 3000→0 RPM (35–115ms); STO engages <=50 RPM before 130ms deadline.',
    project: {
      schemaVersion: '3.0.0',
      engineVersion: '1.0.0',
      name: 'PRESET-005: Robotics E-Stop & Safe Torque Off Deadline',
      presetId: 'PRESET_005',
      durationMs: 250,
      channels: [
        {
          uuid: 'p5-estop',
          name: 'E_STOP_N',
          domainType: 'DIGITAL',
          mode: 'MANUAL',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#ef4444',
          locked: false,
          keyframes: [
            { id: 'es0', t: 0, v: 1, type: 'STEP' },
            { id: 'es1', t: 30, v: 0, type: 'STEP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p5-rpm',
          name: 'MOTOR_SPEED',
          domainType: 'ANALOG_RAMP',
          mode: 'MANUAL',
          unit: 'RPM',
          minVal: 0,
          maxVal: 3500,
          color: '#38bdf8',
          locked: false,
          keyframes: [
            { id: 'rp0', t: 0, v: 3000, type: 'STEP' },
            { id: 'rp1', t: 35, v: 3000, type: 'LINEAR_RAMP' },
            { id: 'rp2', t: 115, v: 0, type: 'LINEAR_RAMP' },
            { id: 'rp3', t: 250, v: 0, type: 'LINEAR_RAMP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p5-sto',
          name: 'STO_SAFE_STATE (Speed <= 150 RPM)',
          domainType: 'DIGITAL',
          mode: 'LOGIC_DRIVEN',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#10b981',
          locked: false,
          keyframes: [],
          logicRule: {
            kind: 'CONDITION',
            sourceUuid: 'p5-rpm',
            secondaryUuid: null,
            operator: 'THRESHOLD_LE',
            delayMs: 0,
            offDelayMs: 0,
            delayMode: 'INERTIAL',
            thresholdVal: 150,
            primitive: 'NONE',
            paramA: 0,
            paramB: 0
          }
        }
      ],
      measurements: [
        {
          id: 'm-p5-1',
          label: 'Braking to Safe State',
          sourceChannelUuid: 'p5-estop',
          sourceEdgeIndex: 1,
          targetChannelUuid: 'p5-sto',
          targetEdgeIndex: 1
        }
      ],
      deadlines: [
        {
          id: 'dl-p5-1',
          label: 'STO Deadline (130ms max)',
          channelUuid: 'p5-sto',
          edgeIndex: 1,
          limitMs: 130
        }
      ]
    }
  },
  PRESET_006: {
    id: 'PRESET_006',
    title: 'UAV / Heartbeat Loss Watchdog',
    badge: 'PRESET-006',
    category: 'Aerospace / UAV',
    summary: 'Telemetry heartbeats arrive at 10, 30, 50ms then stop; 50ms Watchdog timer triggers RTL_FAULT at exact 100ms.',
    project: {
      schemaVersion: '3.0.0',
      engineVersion: '1.0.0',
      name: 'PRESET-006: UAV Heartbeat Loss & Watchdog RTL Trigger',
      presetId: 'PRESET_006',
      durationMs: 250,
      channels: [
        {
          uuid: 'p6-hb',
          name: 'TELEM_HEARTBEAT',
          domainType: 'DIGITAL',
          mode: 'MANUAL',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#22d3ee',
          locked: false,
          keyframes: [
            { id: 'hb0', t: 0, v: 0, type: 'STEP' },
            { id: 'hb1', t: 10, v: 1, type: 'STEP' },
            { id: 'hb2', t: 16, v: 0, type: 'STEP' },
            { id: 'hb3', t: 30, v: 1, type: 'STEP' },
            { id: 'hb4', t: 36, v: 0, type: 'STEP' },
            { id: 'hb5', t: 50, v: 1, type: 'STEP' },
            { id: 'hb6', t: 56, v: 0, type: 'STEP' }
          ],
          logicRule: null
        },
        {
          uuid: 'p6-wd',
          name: 'RTL_WATCHDOG_FAULT (Timeout 50ms)',
          domainType: 'DIGITAL',
          mode: 'LOGIC_DRIVEN',
          unit: 'Logic',
          minVal: 0,
          maxVal: 1,
          color: '#f43f5e',
          locked: false,
          keyframes: [],
          logicRule: {
            kind: 'PRIMITIVE',
            sourceUuid: 'p6-hb',
            secondaryUuid: null,
            operator: 'FOLLOW',
            delayMs: 0,
            offDelayMs: 0,
            delayMode: 'INERTIAL',
            thresholdVal: 0.5,
            primitive: 'WATCHDOG',
            paramA: 50, // 50ms timeout from last rising edge (50ms + 50ms = 100ms)
            paramB: 0
          }
        }
      ],
      measurements: [
        {
          id: 'm-p6-1',
          label: 'Watchdog Timeout (50ms)',
          sourceChannelUuid: 'p6-hb',
          sourceEdgeIndex: 5, // Rising edge at 50ms
          targetChannelUuid: 'p6-wd',
          targetEdgeIndex: 1 // Fault rises at 100ms
        }
      ],
      deadlines: []
    }
  }
};

// ============================================================================
// MATHEMATICAL SIGNAL EVALUATOR (CORE-020..036, LOGIC-001..009, PRIM-001..006)
// Evaluates analog values at any instant t and resolves reactive logic channels
// analytically (independent of screen pixel density).
// ============================================================================

function evaluateAnalogAtTime(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 0;
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].v;
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].v;

  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];
    if (t >= k0.t && t <= k1.t) {
      const dt = k1.t - k0.t;
      if (dt <= 0 || k1.type === 'STEP') {
        return t === k1.t ? k1.v : k0.v;
      }
      if (k1.type === 'EXP_RC') {
        const tau = Math.max(1, dt / 4);
        return k1.v + (k0.v - k1.v) * Math.exp(-(t - k0.t) / tau);
      }
      // Default LINEAR_RAMP: v(t) = v0 + (v1 - v0) * (t - t0) / d
      const ratio = (t - k0.t) / dt;
      return k0.v + (k1.v - k0.v) * ratio;
    }
  }
  return sorted[sorted.length - 1].v;
}

function evaluateDigitalAtTime(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 0;
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  let val = sorted[0].v;
  for (let i = 0; i < sorted.length; i++) {
    if (t >= sorted[i].t) {
      val = sorted[i].v;
    } else {
      break;
    }
  }
  return val;
}

// Analytical solver for threshold crossing on an analog channel
function findAnalogThresholdCrossings(keyframes, threshold, direction = 'BOTH') {
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  const crossings = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];
    const v0 = k0.v;
    const v1 = k1.v;
    if (v0 === v1) continue;
    const minV = Math.min(v0, v1);
    const maxV = Math.max(v0, v1);
    if (threshold >= minV && threshold <= maxV) {
      const isRising = v1 > v0;
      if (direction === 'RISING' && !isRising) continue;
      if (direction === 'FALLING' && isRising) continue;
      const dt = k1.t - k0.t;
      const crossT = dt > 0 ? k0.t + ((threshold - v0) / (v1 - v0)) * dt : k0.t;
      crossings.push({ t: Number(crossT.toFixed(2)), rising: isRising });
    }
  }
  return crossings;
}

// Evaluates all channels in topological order (CORE-031, CORE-035)
function evaluateWorkspaceSignals(project) {
  const channelMap = new Map();
  project.channels.forEach((ch) => {
    const copy = {
      ...ch,
      computedKeyframes: ch.mode === 'MANUAL' ? [...ch.keyframes].sort((a, b) => a.t - b.t) : [],
      thresholdCrossings: [],
      deadtimeZones: [],
      jitterBands: []
    };
    channelMap.set(ch.uuid, copy);
  });

  // Resolve LOGIC_DRIVEN channels
  project.channels.forEach((ch) => {
    if (ch.mode !== 'LOGIC_DRIVEN' || !ch.logicRule) return;
    const target = channelMap.get(ch.uuid);
    const rule = ch.logicRule;
    const src = channelMap.get(rule.sourceUuid);
    if (!src) {
      target.computedKeyframes = [{ id: 'err-0', t: 0, v: 0, type: 'STEP' }];
      return;
    }

    const srcKfs = src.computedKeyframes.length > 0 ? src.computedKeyframes : src.keyframes;

    // Case 1: Primitive WATCHDOG (Missing pulse alert - PRIM-005)
    if (rule.primitive === 'WATCHDOG') {
      const timeoutMs = Number(rule.paramA) || 50;
      const risingEdges = srcKfs.filter((k, idx) => k.v === 1 && (idx === 0 || srcKfs[idx - 1].v !== 1));
      let faultTime = timeoutMs;
      if (risingEdges.length > 0) {
        let currentExpiry = risingEdges[0].t <= timeoutMs ? risingEdges[0].t + timeoutMs : timeoutMs;
        for (let i = 1; i < risingEdges.length; i++) {
          if (risingEdges[i].t <= currentExpiry) {
            currentExpiry = risingEdges[i].t + timeoutMs;
          } else {
            break;
          }
        }
        faultTime = currentExpiry;
      }
      const kfs = [{ id: `${ch.uuid}-wd-0`, t: 0, v: 0, type: 'STEP' }];
      if (faultTime <= project.durationMs) {
        kfs.push({ id: `${ch.uuid}-wd-1`, t: Number(faultTime.toFixed(2)), v: 1, type: 'STEP' });
      }
      target.computedKeyframes = kfs;
      return;
    }

    // Case 2: Primitive HYSTERESIS on Analog Source (PRIM-002)
    if (rule.primitive === 'HYSTERESIS' && src.domainType === 'ANALOG_RAMP') {
      const vLow = Number(rule.paramA) || 16.0;
      const vHigh = Number(rule.paramB) || 19.5;
      const vStart = evaluateAnalogAtTime(srcKfs, 0);
      let state = vStart >= vHigh ? 1 : 0;
      const kfs = [{ id: `${ch.uuid}-hys-0`, t: 0, v: state, type: 'STEP' }];

      // Check piecewise segments analytically
      const sorted = [...srcKfs].sort((a, b) => a.t - b.t);
      for (let i = 0; i < sorted.length - 1; i++) {
        const k0 = sorted[i];
        const k1 = sorted[i + 1];
        if (state === 1 && k0.v >= vLow && k1.v <= vLow && k0.v !== k1.v) {
          const crossT = k0.t + ((vLow - k0.v) / (k1.v - k0.v)) * (k1.t - k0.t);
          state = 0;
          kfs.push({ id: `${ch.uuid}-hys-f-${i}`, t: Number(crossT.toFixed(2)), v: 0, type: 'STEP' });
          src.thresholdCrossings.push({ t: Number(crossT.toFixed(2)), v: vLow, label: `Vlow ${vLow}${src.unit}` });
        } else if (state === 0 && k0.v <= vHigh && k1.v >= vHigh && k0.v !== k1.v) {
          const crossT = k0.t + ((vHigh - k0.v) / (k1.v - k0.v)) * (k1.t - k0.t);
          state = 1;
          kfs.push({ id: `${ch.uuid}-hys-r-${i}`, t: Number(crossT.toFixed(2)), v: 1, type: 'STEP' });
          src.thresholdCrossings.push({ t: Number(crossT.toFixed(2)), v: vHigh, label: `Vhigh ${vHigh}${src.unit}` });
        }
      }
      target.computedKeyframes = kfs;
      return;
    }

    // Case 3: Analog Condition Threshold (THRESHOLD_GE or THRESHOLD_LE)
    if (src.domainType === 'ANALOG_RAMP' && (rule.operator === 'THRESHOLD_GE' || rule.operator === 'THRESHOLD_LE' || rule.kind === 'CONDITION')) {
      const thresh = Number(rule.thresholdVal) || 6.0;
      const isLe = rule.operator === 'THRESHOLD_LE';
      const v0 = evaluateAnalogAtTime(srcKfs, 0);
      let state = isLe ? (v0 <= thresh ? 1 : 0) : (v0 >= thresh ? 1 : 0);
      const delay = Number(rule.delayMs) || 0;
      const kfs = [{ id: `${ch.uuid}-th-0`, t: 0, v: state, type: 'STEP' }];
      const crossings = findAnalogThresholdCrossings(srcKfs, thresh, 'BOTH');
      crossings.forEach((c, idx) => {
        src.thresholdCrossings.push({ t: c.t, v: thresh, label: `${thresh}${src.unit}` });
        const newState = isLe ? (c.rising ? 0 : 1) : (c.rising ? 1 : 0);
        if (newState !== state) {
          state = newState;
          const outT = Math.min(project.durationMs, c.t + delay);
          kfs.push({ id: `${ch.uuid}-th-${idx + 1}`, t: Number(outT.toFixed(2)), v: state, type: 'STEP' });
        }
      });
      target.computedKeyframes = kfs;
      return;
    }

    // Case 4: Digital Source -> QUALIFY (Debounce PRIM-001), DEADTIME (PRIM-004), JITTER_PROP (PRIM-006), or FOLLOW/DELAY
    const rawKfs = [...srcKfs].sort((a, b) => a.t - b.t);
    const minPulse =
      rule.primitive === 'QUALIFY'
        ? Number(rule.paramA) || 10
        : rule.delayMode === 'INERTIAL'
        ? Math.max(0, Number(rule.delayMs) || 0)
        : 0;
    const riseDelay = rule.primitive === 'QUALIFY' ? Number(rule.paramA) || 10 : Number(rule.delayMs) || 0;
    const fallDelay =
      rule.primitive === 'QUALIFY'
        ? 0
        : rule.offDelayMs !== undefined
        ? Number(rule.offDelayMs)
        : Number(rule.delayMs) || 0;

    // Extract high pulses from digital source
    const pulses = [];
    let currentStart = null;
    for (let i = 0; i < rawKfs.length; i++) {
      if (rawKfs[i].v === 1 && currentStart === null) {
        currentStart = rawKfs[i].t;
      } else if (rawKfs[i].v === 0 && currentStart !== null) {
        pulses.push({ start: currentStart, end: rawKfs[i].t });
        currentStart = null;
      }
    }
    if (currentStart !== null) {
      pulses.push({ start: currentStart, end: project.durationMs });
    }

    // Filter pulses according to QUALIFY or Inertial Delay (LOGIC-005, PRIM-001)
    const validPulses = pulses.filter((p) => {
      const width = p.end - p.start;
      if (rule.primitive === 'QUALIFY') return width >= minPulse;
      if (rule.delayMode === 'INERTIAL' && riseDelay > 0) return width >= Math.min(5, riseDelay);
      return width > 0;
    });

    // Optional Secondary Analog condition (e.g., PRESET-001 VBAT >= 6V AND IGN_QUAL)
    let secondaryReadyTime = 0;
    if (rule.secondaryUuid) {
      const sec = channelMap.get(rule.secondaryUuid);
      if (sec && sec.domainType === 'ANALOG_RAMP') {
        const crossings = findAnalogThresholdCrossings(sec.keyframes, Number(rule.thresholdVal) || 6.0, 'RISING');
        if (crossings.length > 0) {
          secondaryReadyTime = crossings[0].t;
          sec.thresholdCrossings.push({
            t: crossings[0].t,
            v: Number(rule.thresholdVal) || 6.0,
            label: `${rule.thresholdVal}${sec.unit}`
          });
        }
      }
    }

    const outKfs = [{ id: `${ch.uuid}-0`, t: 0, v: rule.operator === 'NOT' ? 1 : 0, type: 'STEP' }];
    let lastEnd = -1;
    const deadtimeMs = rule.primitive === 'DEADTIME' ? Number(rule.paramA) || 25 : 0;

    validPulses.forEach((p, idx) => {
      const effStart = Math.max(p.start, secondaryReadyTime);
      const outStart = effStart + riseDelay;
      const outEnd = p.end + fallDelay;

      if (deadtimeMs > 0 && lastEnd > 0 && outStart < lastEnd + deadtimeMs) {
        return; // Inhibited by Deadtime window (PRIM-004)
      }

      if (outStart < project.durationMs && outEnd > outStart) {
        const highVal = rule.operator === 'NOT' ? 0 : 1;
        const lowVal = rule.operator === 'NOT' ? 1 : 0;
        outKfs.push({ id: `${ch.uuid}-r-${idx}`, t: Number(outStart.toFixed(2)), v: highVal, type: 'STEP' });
        if (outEnd <= project.durationMs) {
          outKfs.push({ id: `${ch.uuid}-f-${idx}`, t: Number(outEnd.toFixed(2)), v: lowVal, type: 'STEP' });
          lastEnd = outEnd;
          if (deadtimeMs > 0) {
            target.deadtimeZones.push({ start: outEnd, end: Math.min(project.durationMs, outEnd + deadtimeMs) });
          }
        }
        if (rule.primitive === 'JITTER_PROP') {
          const early = Number(rule.paramA) || 4;
          const late = Number(rule.paramB) || 6;
          target.jitterBands.push({ t: outStart, early: outStart - early, late: outStart + late });
        }
      }
    });

    target.computedKeyframes = outKfs;
  });

  return Array.from(channelMap.values());
}

// ============================================================================
// SRS REQUIREMENTS DATASET FOR INTERACTIVE TRACEABILITY MATRIX
// ============================================================================
const SRS_REQUIREMENTS_LIST = [
  {
    id: 'UX-000',
    category: 'UX',
    release: 'Prototype',
    title: 'The starter diagram is the tutorial',
    criteria: 'First load presents 3 editable example tracks (S1 Digital, S2 Analog, S3 Linked) and a ready timeline with no onboarding modal.',
    featureJump: 'STARTER_CANVAS'
  },
  {
    id: 'UX-004',
    category: 'UX',
    release: 'Prototype',
    title: 'Three obvious creation choices',
    criteria: 'New track defaults: Digital, Analog, Linked. One click opens a 3-choice menu, one further click inserts a visible waveform.',
    featureJump: 'ADD_SIGNAL'
  },
  {
    id: 'UX-006',
    category: 'UX',
    release: 'MVP',
    title: 'Context, not hierarchy (Smart Actions)',
    criteria: 'The most probable next 1–3 actions appear near the selected edge, ramp, or track header.',
    featureJump: 'SMART_ACTIONS'
  },
  {
    id: 'UX-007',
    category: 'UX',
    release: 'Prototype',
    title: 'Progressive disclosure',
    criteria: 'Sophisticated controls (primitives, RC, tolerances) hidden in an expandable More / Advanced drawer.',
    featureJump: 'ADVANCED_DRAWER'
  },
  {
    id: 'UX-008',
    category: 'UX',
    release: 'MVP',
    title: 'Direct manipulation first',
    criteria: 'Drag an edge horizontally to move in time; drag an analog ramp breakpoint to reshape duration and voltage.',
    featureJump: 'STARTER_CANVAS'
  },
  {
    id: 'UX-010',
    category: 'UX',
    release: 'Prototype',
    title: 'Non-blocking context coach',
    criteria: 'State-driven hints (first_open -> edge_moved -> ramp_reshaped -> signal_added -> export) never block tools and can be toggled off.',
    featureJump: 'COACH_TOGGLE'
  },
  {
    id: 'SYS-001',
    category: 'ARCH',
    release: 'MVP',
    title: 'Layered deterministic architecture',
    criteria: 'Strict separation: core (math/models) -> engine (DAG/evaluation) -> analysis (measurements) -> UI (presentation).',
    featureJump: 'UML_ARCH'
  },
  {
    id: 'CORE-002',
    category: 'CORE',
    release: 'MVP',
    title: 'Exact internal time resolution',
    criteria: 'Internal nanosecond-precision representation; zooming or panning never alters mathematical timestamps.',
    featureJump: 'UML_CLASS'
  },
  {
    id: 'CORE-010',
    category: 'CORE',
    release: 'MVP',
    title: 'Immutable UUIDs & dynamic S1..Sn shortIds',
    criteria: 'Inserting, deleting, or reordering tracks automatically relabels S1..Sn while preserving UUID logic references.',
    featureJump: 'ADD_SIGNAL'
  },
  {
    id: 'CORE-032',
    category: 'CORE',
    release: 'V1.0',
    title: 'Analytical threshold crossing solver',
    criteria: 'Linear and RC ramps solve threshold crossings analytically, independent of render pixel sampling.',
    featureJump: 'PRESET_001'
  },
  {
    id: 'PRIM-001',
    category: 'PRIM',
    release: 'V1.0',
    title: 'QUALIFY / Debounce ("Ignore short glitches")',
    criteria: 'Output turns HIGH only after uninterrupted TRUE for tQual; pulses shorter than tQual are rejected.',
    featureJump: 'PRESET_001'
  },
  {
    id: 'PRIM-002',
    category: 'PRIM',
    release: 'V1.0',
    title: 'HYSTERESIS ("Two-threshold switch")',
    criteria: 'Turns HIGH at >= Vhigh and stays HIGH until <= Vlow (Vhigh > Vlow).',
    featureJump: 'PRESET_002'
  },
  {
    id: 'PRIM-005',
    category: 'PRIM',
    release: 'V1.0',
    title: 'WATCHDOG ("Missing pulse alert")',
    criteria: 'If no qualifying rising edge arrives within timeout window since last edge, assert fault at exact expiry timestamp.',
    featureJump: 'PRESET_006'
  },
  {
    id: 'MEAS-001',
    category: 'MEAS',
    release: 'MVP',
    title: 'Semantic Δt Dimension Bars & Deadlines',
    criteria: 'Dimension bar connects two event anchors across tracks and updates live Δt when waveforms move.',
    featureJump: 'STARTER_CANVAS'
  },
  {
    id: 'EXP-001',
    category: 'EXP',
    release: 'MVP',
    title: 'Polished Light-Theme Report PNG Export',
    criteria: 'Export defaults to high-contrast light report PNG without changing the dark editing workspace theme or including coach overlays.',
    featureJump: 'EXPORT_MODAL'
  }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Primary Top-Level View Mode: 'WORKSPACE' | 'UML_ARCH' | 'SRS_MATRIX'
  const [activeMainView, setActiveMainView] = useState('WORKSPACE');
  const [activeUmlSubTab, setActiveUmlSubTab] = useState('LAYERED_ARCH'); // 'LAYERED_ARCH' | 'UML_CLASS' | 'EVENT_ENGINE' | 'COACH_FSM'

  // Project State + Undo/Redo History Stack (UX-012, UI-010)
  const [project, setProject] = useState(INITIAL_STARTER_PROJECT);
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  // Viewport & Editing Controls
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [hoverTimeMs, setHoverTimeMs] = useState(null);

  // Selection & Progressive Disclosure State
  // selectedItem: { type: 'KEYFRAME' | 'CHANNEL' | 'MEASUREMENT', channelUuid, keyframeId?, measId? }
  const [selectedItem, setSelectedItem] = useState({
    type: 'KEYFRAME',
    channelUuid: 'ch-uuid-s1-ign',
    keyframeId: 'kf-s1-1'
  });
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false);
  const [insertMenuIndex, setInsertMenuIndex] = useState(null); // null or integer index (0..N)
  const [measureCreationSource, setMeasureCreationSource] = useState(null); // { channelUuid, edgeIndex, t }

  // Non-blocking Contextual Coach State Machine (Section 2.5)
  // States: 'first_open' -> 'edge_moved' -> 'ramp_reshaped' -> 'signal_added' -> 'first_measurement' -> 'export'
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [coachStep, setCoachStep] = useState('first_open');
  const [coachDismissedForStep, setCoachDismissedForStep] = useState(false);

  // Modals (New Project / Preset Chooser & Light-Theme Export Preview)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Dragging State for Interactive Canvas Manipulation
  const [dragState, setDragState] = useState(null);
  const timelineContainerRef = useRef(null);

  // SRS Matrix Filter State
  const [srsFilterCategory, setSrsFilterCategory] = useState('ALL');
  const [srsFilterRelease, setSrsFilterRelease] = useState('ALL');
  const [verifiedReqIds, setVerifiedReqIds] = useState(() =>
    new Set(SRS_REQUIREMENTS_LIST.map((r) => r.id))
  );

  // Helper to show non-blocking micro-feedback toast
  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Commit a domain mutation with Undo/Redo history (SYS-003)
  const commitProjectChange = useCallback(
    (updaterFn) => {
      setProject((prev) => {
        const next = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
        setHistoryPast((h) => [...h.slice(-49), prev]);
        setHistoryFuture([]);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((h) => h.slice(0, -1));
    setHistoryFuture((f) => [project, ...f]);
    setProject(previous);
    triggerToast('Undid last action (Ctrl+Z)');
  }, [historyPast, project, triggerToast]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((f) => f.slice(1));
    setHistoryPast((h) => [...h, project]);
    setProject(next);
    triggerToast('Redid action (Ctrl+Y)');
  }, [historyFuture, project, triggerToast]);

  // Keyboard shortcuts (UX-012, UX-014)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setDragState(null);
        setInsertMenuIndex(null);
        setMeasureCreationSource(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Evaluate all channels deterministically
  const evaluatedChannels = useMemo(() => evaluateWorkspaceSignals(project), [project]);

  // Convert pointer X coordinate to timestamp (ms)
  const clientXToTimeMs = useCallback(
    (clientX) => {
      if (!timelineContainerRef.current) return 0;
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const rawTime = (relX / rect.width) * project.durationMs;
      const snapped = snapToGrid ? Math.round(rawTime) : Number(rawTime.toFixed(1));
      return Math.max(0, Math.min(project.durationMs, snapped));
    },
    [project.durationMs, snapToGrid]
  );

  // Global Mouse/Touch Move for Interactive Waveform Dragging (UX-008, F01)
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const newT = clientXToTimeMs(clientX);

      setProject((prev) => {
        const updatedChannels = prev.channels.map((ch) => {
          if (ch.uuid !== dragState.channelUuid || ch.locked || ch.mode === 'LOGIC_DRIVEN') return ch;

          const updatedKfs = ch.keyframes.map((kf) => {
            if (kf.id !== dragState.keyframeId) return kf;
            let updatedV = kf.v;

            // If dragging an Analog Ramp handle vertically, also update voltage/value
            if (ch.domainType === 'ANALOG_RAMP' && dragState.trackRect) {
              const padY = 14;
              const usableH = Math.max(20, dragState.trackRect.height - padY * 2);
              const relY = Math.max(0, Math.min(usableH, clientY - (dragState.trackRect.top + padY)));
              const norm = 1 - relY / usableH;
              const rawVal = ch.minVal + norm * (ch.maxVal - ch.minVal);
              updatedV = snapToGrid ? Math.round(rawVal * 2) / 2 : Number(rawVal.toFixed(1));
            }

            return {
              ...kf,
              t: kf.t === 0 && dragState.lockZeroTime ? 0 : newT,
              v: updatedV
            };
          });

          return { ...ch, keyframes: updatedKfs };
        });

        return { ...prev, channels: updatedChannels };
      });
    };

    const handlePointerUp = () => {
      if (dragState.domainType === 'DIGITAL' && coachStep === 'first_open') {
        setCoachStep('edge_moved');
        setCoachDismissedForStep(false);
      } else if (dragState.domainType === 'ANALOG_RAMP' && (coachStep === 'first_open' || coachStep === 'edge_moved')) {
        setCoachStep('ramp_reshaped');
        setCoachDismissedForStep(false);
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState, clientXToTimeMs, snapToGrid, coachStep]);

  // ============================================================================
  // CHANNEL INSERTION, DUPLICATION, REORDERING (Section 2.3, UX-004, UX-005, F02)
  // ============================================================================
  const handleInsertChannel = (insertIndex, choiceType) => {
    const uid = `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const count = project.channels.length + 1;

    // Determine sensible default source for a new Linked channel (Section 5.1 Ambiguity Rule)
    const fallbackSource =
      project.channels.find((c) => c.uuid === selectedItem?.channelUuid) ||
      project.channels[Math.max(0, insertIndex - 1)] ||
      project.channels[0];

    let newChannel;
    if (choiceType === 'DIGITAL') {
      newChannel = {
        uuid: uid,
        name: `DIG_SIG_${count}`,
        domainType: 'DIGITAL',
        mode: 'MANUAL',
        unit: 'Logic',
        minVal: 0,
        maxVal: 1,
        color: '#38bdf8',
        locked: false,
        keyframes: [
          { id: `${uid}-k0`, t: 0, v: 0, type: 'STEP' },
          { id: `${uid}-k1`, t: 40, v: 1, type: 'STEP' },
          { id: `${uid}-k2`, t: 130, v: 0, type: 'STEP' }
        ],
        logicRule: null
      };
    } else if (choiceType === 'ANALOG') {
      newChannel = {
        uuid: uid,
        name: `ANALOG_${count}`,
        domainType: 'ANALOG_RAMP',
        mode: 'MANUAL',
        unit: 'V',
        minVal: 0,
        maxVal: 12,
        color: '#fb923c',
        locked: false,
        keyframes: [
          { id: `${uid}-k0`, t: 0, v: 0, type: 'STEP' },
          { id: `${uid}-k1`, t: 30, v: 0, type: 'LINEAR_RAMP' },
          { id: `${uid}-k2`, t: 80, v: 10, type: 'LINEAR_RAMP' },
          { id: `${uid}-k3`, t: 160, v: 10, type: 'LINEAR_RAMP' },
          { id: `${uid}-k4`, t: 200, v: 0, type: 'LINEAR_RAMP' }
        ],
        logicRule: null
      };
    } else {
      // LINKED
      const isAnalogSrc = fallbackSource?.domainType === 'ANALOG_RAMP';
      newChannel = {
        uuid: uid,
        name: `LINK_${fallbackSource ? fallbackSource.name.slice(0, 8) : count}`,
        domainType: 'DIGITAL',
        mode: 'LOGIC_DRIVEN',
        unit: 'Logic',
        minVal: 0,
        maxVal: 1,
        color: '#a855f7',
        locked: false,
        keyframes: [],
        logicRule: {
          kind: isAnalogSrc ? 'CONDITION' : 'DELAY',
          sourceUuid: fallbackSource ? fallbackSource.uuid : '',
          secondaryUuid: null,
          operator: isAnalogSrc ? 'THRESHOLD_GE' : 'FOLLOW',
          delayMs: 15,
          offDelayMs: 15,
          delayMode: 'INERTIAL',
          thresholdVal: 6.0,
          primitive: 'NONE',
          paramA: 10,
          paramB: 12
        }
      };
    }

    commitProjectChange((prev) => {
      const nextChannels = [...prev.channels];
      nextChannels.splice(insertIndex, 0, newChannel);
      return { ...prev, channels: nextChannels };
    });

    setSelectedItem({
      type: 'CHANNEL',
      channelUuid: uid
    });
    setInsertMenuIndex(null);

    if (coachStep === 'ramp_reshaped' || coachStep === 'edge_moved' || coachStep === 'first_open') {
      setCoachStep('signal_added');
      setCoachDismissedForStep(false);
    }
    triggerToast(`Inserted ${choiceType} track (S1..Sn automatically relabeled, UUIDs preserved)`);
  };

  const handleDuplicateChannel = (channelUuid) => {
    const idx = project.channels.findIndex((c) => c.uuid === channelUuid);
    if (idx === -1) return;
    const orig = project.channels[idx];
    const uid = `ch-${Date.now().toString(36)}`;
    const clone = {
      ...orig,
      uuid: uid,
      name: `${orig.name}_COPY`,
      keyframes: orig.keyframes.map((k, i) => ({ ...k, id: `${uid}-k${i}` })),
      logicRule: orig.logicRule ? { ...orig.logicRule } : null
    };
    commitProjectChange((prev) => {
      const next = [...prev.channels];
      next.splice(idx + 1, 0, clone);
      return { ...prev, channels: next };
    });
    setSelectedItem({ type: 'CHANNEL', channelUuid: uid });
    triggerToast(`Duplicated ${orig.name}`);
  };

  const handleMoveChannelOrder = (channelUuid, direction) => {
    const idx = project.channels.findIndex((c) => c.uuid === channelUuid);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= project.channels.length) return;
    commitProjectChange((prev) => {
      const next = [...prev.channels];
      const [removed] = next.splice(idx, 1);
      next.splice(targetIdx, 0, removed);
      return { ...prev, channels: next };
    });
    triggerToast('Reordered track — UUID references intact');
  };

  const handleDeleteChannel = (channelUuid) => {
    const dependent = project.channels.find(
      (c) => c.logicRule?.sourceUuid === channelUuid || c.logicRule?.secondaryUuid === channelUuid
    );
    if (dependent) {
      triggerToast(`Cannot silently delete: referenced by linked track "${dependent.name}" (F09)`);
      return;
    }
    commitProjectChange((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.uuid !== channelUuid),
      measurements: prev.measurements.filter(
        (m) => m.sourceChannelUuid !== channelUuid && m.targetChannelUuid !== channelUuid
      )
    }));
    setSelectedItem(null);
    triggerToast('Track removed');
  };

  // Add Glitch / Pulse or Add Ramp Point from Smart Action Bar
  const handleAddPulseOrPoint = (channelUuid) => {
    commitProjectChange((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => {
        if (ch.uuid !== channelUuid || ch.mode === 'LOGIC_DRIVEN') return ch;
        if (ch.domainType === 'DIGITAL') {
          // Insert a short 5ms glitch pulse at 25ms or available spot
          const glitchStart = 25;
          const glitchEnd = 30;
          const newKfs = [
            ...ch.keyframes.filter((k) => k.t < glitchStart || k.t > glitchEnd),
            { id: `kf-${Date.now()}-1`, t: glitchStart, v: 1, type: 'STEP' },
            { id: `kf-${Date.now()}-2`, t: glitchEnd, v: 0, type: 'STEP' }
          ].sort((a, b) => a.t - b.t);
          return { ...ch, keyframes: newKfs };
        } else {
          // Add intermediate analog inflection point
          const midT = 115;
          const newKfs = [
            ...ch.keyframes,
            { id: `kf-${Date.now()}-pt`, t: midT, v: Number((ch.maxVal * 0.6).toFixed(1)), type: 'LINEAR_RAMP' }
          ].sort((a, b) => a.t - b.t);
          return { ...ch, keyframes: newKfs };
        }
      })
    }));
    triggerToast('Inserted new transition point on waveform');
  };

  // Save Project as JSON file (DATA-001, DATA-002)
  const handleDownloadJson = () => {
    const payload = JSON.stringify(project, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.signalflow.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Saved project to local .json (DATA-001)');
  };

  // Resolve currently selected Channel and Keyframe objects
  const selectedChannelObj = useMemo(
    () => evaluatedChannels.find((c) => c.uuid === selectedItem?.channelUuid) || evaluatedChannels[0],
    [evaluatedChannels, selectedItem]
  );

  const selectedKeyframeObj = useMemo(() => {
    if (!selectedChannelObj || selectedItem?.type !== 'KEYFRAME') return null;
    return selectedChannelObj.keyframes.find((k) => k.id === selectedItem.keyframeId) || null;
  }, [selectedChannelObj, selectedItem]);

  // Jump from SRS Traceability Matrix directly to live GUI feature
  const handleJumpToFeature = (featureCode) => {
    if (featureCode === 'UML_ARCH') {
      setActiveMainView('UML_ARCH');
      setActiveUmlSubTab('LAYERED_ARCH');
      return;
    }
    if (featureCode === 'UML_CLASS') {
      setActiveMainView('UML_ARCH');
      setActiveUmlSubTab('UML_CLASS');
      return;
    }
    setActiveMainView('WORKSPACE');
    if (featureCode === 'STARTER_CANVAS') {
      setProject(INITIAL_STARTER_PROJECT);
      triggerToast('Loaded Golden First-Run 3-Track Starter (UX-000)');
    } else if (featureCode === 'ADD_SIGNAL') {
      setInsertMenuIndex(project.channels.length);
    } else if (featureCode === 'SMART_ACTIONS') {
      if (project.channels[0]?.keyframes[1]) {
        setSelectedItem({
          type: 'KEYFRAME',
          channelUuid: project.channels[0].uuid,
          keyframeId: project.channels[0].keyframes[1].id
        });
      }
      triggerToast('Selected digital edge — inspect the Contextual Smart Action bar');
    } else if (featureCode === 'ADVANCED_DRAWER') {
      setShowAdvancedDrawer(true);
    } else if (featureCode === 'COACH_TOGGLE') {
      setCoachEnabled(true);
      setCoachDismissedForStep(false);
    } else if (featureCode === 'PRESET_001') {
      setProject(INDUSTRY_PRESETS.PRESET_001.project);
      triggerToast('Loaded PRESET-001: Automotive ECU Power-Up & Debounce');
    } else if (featureCode === 'PRESET_002') {
      setProject(INDUSTRY_PRESETS.PRESET_002.project);
      triggerToast('Loaded PRESET-002: Truck 24V Brownout Hysteresis');
    } else if (featureCode === 'PRESET_006') {
      setProject(INDUSTRY_PRESETS.PRESET_006.project);
      triggerToast('Loaded PRESET-006: UAV Heartbeat Loss Watchdog');
    } else if (featureCode === 'EXPORT_MODAL') {
      setShowExportModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* ====================================================================
          TOP NAVIGATION BAR & MODE SWITCHER
         ==================================================================== */}
      <header className="h-14 border-b border-slate-800/90 bg-[#0F1522]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 sticky top-0 z-40">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm md:text-base text-white">
                SignalFlow Studio
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                SFS-SRS-003 v3.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Create like an artist. Think like an engineer.
            </p>
          </div>
        </div>

        {/* Central Mode Switcher: GUI Workspace | UML & Architecture | SRS Matrix */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMainView('WORKSPACE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMainView === 'WORKSPACE'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Workspace GUI</span>
          </button>

          <button
            onClick={() => setActiveMainView('UML_ARCH')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMainView === 'UML_ARCH'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>UML & Architecture</span>
          </button>

          <button
            onClick={() => setActiveMainView('SRS_MATRIX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMainView === 'SRS_MATRIX'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SRS Review Matrix</span>
            <span className="md:hidden">SRS</span>
          </button>
        </div>

        {/* Right Workspace Controls (UX-012, UX-013, UX-016) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition"
            title="New Project or Industry Example Presets"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">New / Examples</span>
          </button>

          <div className="hidden sm:flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 transition"
              title={`Undo (Ctrl+Z) — ${historyPast.length} steps`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setCoachEnabled((v) => !v);
              setCoachDismissedForStep(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              coachEnabled
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle non-blocking Context Coach hints (UX-010, UX-011)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{coachEnabled ? 'Tips: On' : 'Tips: Off'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition"
            title="Save project to local JSON (DATA-001)"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Save JSON</span>
          </button>

          <button
            onClick={() => {
              setShowExportModal(true);
              if (coachStep !== 'export') setCoachStep('export');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-md shadow-cyan-500/15 transition"
            title="Export Meeting-Ready High-Contrast Light PNG (EXP-001)"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          VIEW 1: INTERACTIVE WORKSPACE GUI ("THE STARTING DIAGRAM IS THE TUTORIAL")
         ==================================================================== */}
      {activeMainView === 'WORKSPACE' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-Toolbar: Project Title, Preset Pill, Contextual Smart Actions (2.4, UX-006) */}
          <div className="bg-[#111827] border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Editable Project Name & Active Timeline Range */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {project.presetId || 'CUSTOM'}
                </span>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) =>
                    setProject((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 text-sm font-semibold text-white px-2 py-0.5 rounded border border-transparent focus:border-cyan-500/50 focus:outline-none transition"
                  aria-label="Project Name"
                />
              </div>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Timeline:</span>
                <select
                  value={project.durationMs}
                  onChange={(e) =>
                    commitProjectChange((prev) => ({
                      ...prev,
                      durationMs: Number(e.target.value)
                    }))
                  }
                  className="bg-slate-900 text-slate-200 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-800"
                >
                  <option value={100}>0 – 100 ms</option>
                  <option value={250}>0 – 250 ms</option>
                  <option value={500}>0 – 500 ms</option>
                  <option value={1000}>0 – 1000 ms</option>
                </select>
              </div>
            </div>

            {/* Center: Contextual Smart Actions Bar (Section 2.4 - Context, Not Hierarchy) */}
            <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-800/90 px-3 py-1 rounded-xl shadow-inner">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Smart Actions:
              </span>

              {selectedChannelObj && (
                <>
                  <span className="text-xs font-semibold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {selectedChannelObj.name}
                  </span>

                  {/* Actions vary contextually based on Digital / Analog / Linked selection */}
                  {selectedChannelObj.mode === 'MANUAL' && selectedChannelObj.domainType === 'DIGITAL' && (
                    <>
                      <button
                        onClick={() => handleAddPulseOrPoint(selectedChannelObj.uuid)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      >
                        + Add Glitch / Pulse
                      </button>
                      <button
                        onClick={() => handleInsertChannel(project.channels.length, 'LINKED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition"
                      >
                        + Link Follower (+Delay)
                      </button>
                    </>
                  )}

                  {selectedChannelObj.mode === 'MANUAL' && selectedChannelObj.domainType === 'ANALOG_RAMP' && (
                    <>
                      <button
                        onClick={() => handleAddPulseOrPoint(selectedChannelObj.uuid)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      >
                        + Add Ramp Point
                      </button>
                      <button
                        onClick={() => handleInsertChannel(project.channels.length, 'LINKED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
                      >
                        + Add Threshold Link
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      if (measureCreationSource) {
                        setMeasureCreationSource(null);
                      } else {
                        setMeasureCreationSource({
                          channelUuid: selectedChannelObj.uuid,
                          edgeIndex: 1
                        });
                        triggerToast(`Click any second track to anchor Δt measurement from ${selectedChannelObj.name}`);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                      measureCreationSource
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Ruler className="w-3 h-3" />
                    <span>{measureCreationSource ? 'Select 2nd Track…' : 'Measure Δt'}</span>
                  </button>

                  <button
                    onClick={() => setShowAdvancedDrawer((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border transition ${
                      showAdvancedDrawer
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>{showAdvancedDrawer ? 'Hide Properties' : 'More / Properties…'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Right: Snap, Zoom & Cursor Time Readout */}
            <div className="flex items-center gap-2">
              {hoverTimeMs !== null && (
                <div className="hidden xl:flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
                  <span>t = {hoverTimeMs.toFixed(1)} ms</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-[10px] text-slate-400">
                    {(hoverTimeMs * 1_000_000).toLocaleString()} ns
                  </span>
                </div>
              )}

              <button
                onClick={() => setSnapToGrid((s) => !s)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition ${
                  snapToGrid
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle 1ms Snap Grid (UI-008)"
              >
                <Magnet className="w-3.5 h-3.5" />
                <span>Snap</span>
              </button>

              <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="px-2 font-mono text-[11px] text-slate-300 hover:text-white"
                  title="Reset Zoom (Fit All)"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Non-Blocking Contextual Coach Banner (Section 2.1 & 2.5) */}
          {coachEnabled && !coachDismissedForStep && (
            <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  <Sparkles className="w-3 h-3" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                  Coach • {coachStep}
                </span>
                <span className="text-slate-200 font-medium">
                  {coachStep === 'first_open' &&
                    'Drag the glowing cyan edge on S1 (50 ms) horizontally ↔ — watch S3 (CAN_WAKE) automatically follow +20 ms later!'}
                  {coachStep === 'edge_moved' &&
                    'Nice! S3 followed S1 automatically. Now try dragging one of the amber slope handles on S2 (VBAT_RAMP) to reshape the voltage ramp.'}
                  {coachStep === 'ramp_reshaped' &&
                    'Great ramp shaping! Next, click any "+ Add Signal" button below or between tracks to insert a Digital, Analog, or Linked track.'}
                  {coachStep === 'signal_added' &&
                    'Track added & S1..Sn relabeled! Click "More / Properties…" on any linked track to explore Debounce (QUALIFY), Hysteresis, or Watchdog primitives.'}
                  {coachStep === 'export' &&
                    'Ready for your meeting! Export creates a crisp, high-contrast light report PNG without switching your dark workspace.'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCoachDismissedForStep(true)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800/70 transition"
                >
                  Dismiss hint ×
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              MAIN SEQUENCER WORKSPACE: TRACK HEADERS + SYNCHRONIZED CANVAS
              + OPTIONAL PROGRESSIVE DISCLOSURE DRAWER (UI-001..013)
             ================================================================ */}
          <div className="flex-1 flex overflow-hidden">
            {/* Scrollable Sequencer Area */}
            <div className="flex-1 overflow-auto flex flex-col bg-[#0B0F17]">
              <div
                className="min-w-[780px] flex-1 flex flex-col"
                style={{ width: `${Math.max(100, zoomLevel * 100)}%` }}
              >
                {/* Synchronized Time Ruler Row (UI-001, UI-007) */}
                <div className="h-10 bg-[#0F1624] border-b border-slate-800 flex sticky top-0 z-20">
                  {/* Left Header Corner with "+ Insert above S1" affordance (2.3) */}
                  <div className="w-72 shrink-0 border-r border-slate-800 px-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      Channels ({evaluatedChannels.length})
                    </span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setInsertMenuIndex(insertMenuIndex === 0 ? null : 0)
                        }
                        className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 transition"
                        title="Insert new track above S1 (Section 2.3)"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert Top</span>
                      </button>
                      {insertMenuIndex === 0 && (
                        <ThreeChoiceInsertPopover
                          onSelect={(kind) => handleInsertChannel(0, kind)}
                          onClose={() => setInsertMenuIndex(null)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right Time Ruler Ticks (0 .. durationMs) */}
                  <div
                    ref={timelineContainerRef}
                    className="flex-1 relative overflow-hidden"
                  >
                    {Array.from({ length: 11 }).map((_, idx) => {
                      const pct = idx * 10;
                      const tVal = (project.durationMs * idx) / 10;
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 flex flex-col justify-end pb-1.5"
                          style={{ left: `${pct}%` }}
                        >
                          <div className="h-2.5 border-l border-slate-600/80" />
                          <span className="text-[10px] font-mono text-slate-400 -translate-x-1/2 pl-2">
                            {tVal} ms
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ============================================================
                    TRACK STACK (S1..Sn) WITH INLINE "+ INSERT HERE" GUTTERS
                   ============================================================ */}
                <div className="divide-y divide-slate-800/70">
                  {evaluatedChannels.map((ch, idx) => {
                    const shortId = `S${idx + 1}`;
                    const isChannelSelected = selectedItem?.channelUuid === ch.uuid;
                    const activeKfs =
                      ch.mode === 'LOGIC_DRIVEN' ? ch.computedKeyframes : ch.keyframes;

                    return (
                      <React.Fragment key={ch.uuid}>
                        <div
                          onClick={() => {
                            if (measureCreationSource && measureCreationSource.channelUuid !== ch.uuid) {
                              // Create semantic Δt measurement bar between source & target tracks (MEAS-001)
                              const newMeas = {
                                id: `meas-${Date.now()}`,
                                label: `Δt (${shortId})`,
                                sourceChannelUuid: measureCreationSource.channelUuid,
                                sourceEdgeIndex: 1,
                                targetChannelUuid: ch.uuid,
                                targetEdgeIndex: 1
                              };
                              commitProjectChange((prev) => ({
                                ...prev,
                                measurements: [...prev.measurements, newMeas]
                              }));
                              setMeasureCreationSource(null);
                              triggerToast('Added live semantic Δt measurement bar (MEAS-001)');
                              return;
                            }
                            setSelectedItem((prev) =>
                              prev?.channelUuid === ch.uuid ? prev : { type: 'CHANNEL', channelUuid: ch.uuid }
                            );
                          }}
                          className={`group relative flex h-28 transition-colors ${
                            isChannelSelected
                              ? 'bg-slate-900/90'
                              : 'bg-[#0B0F17] hover:bg-slate-900/40'
                          }`}
                        >
                          {/* Track Left Header (288px fixed width) */}
                          <div
                            className={`w-72 shrink-0 border-r border-slate-800 p-3 flex flex-col justify-between relative ${
                              isChannelSelected ? 'border-l-2 border-l-cyan-400' : ''
                            }`}
                          >
                            {/* Top Row: ShortId S1..Sn, Editable Channel Name, Action Icons */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded text-slate-950 shrink-0"
                                  style={{ backgroundColor: ch.color }}
                                >
                                  {shortId}
                                </span>
                                <input
                                  type="text"
                                  value={ch.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProject((prev) => ({
                                      ...prev,
                                      channels: prev.channels.map((item) =>
                                        item.uuid === ch.uuid ? { ...item, name: val } : item
                                      )
                                    }));
                                  }}
                                  className="bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 text-xs font-semibold text-slate-100 px-1.5 py-0.5 rounded truncate w-full focus:outline-none border border-transparent focus:border-slate-600"
                                  aria-label={`Channel ${shortId} Name`}
                                />
                              </div>

                              {/* Quick Track Controls (Reorder, Duplicate, Lock, Delete) */}
                              <div className="flex items-center gap-0.5 opacity-75 group-hover:opacity-100 transition">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveChannelOrder(ch.uuid, -1);
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                                  title="Move Track Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveChannelOrder(ch.uuid, 1);
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                                  title="Move Track Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateChannel(ch.uuid);
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                                  title="Duplicate Track (Ctrl+D)"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChannel(ch.uuid);
                                  }}
                                  className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400"
                                  title="Delete Track"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Middle Row: Domain Type Badge & Linked Rule Summary */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/70">
                                {ch.mode === 'LOGIC_DRIVEN'
                                  ? 'LINKED'
                                  : ch.domainType === 'ANALOG_RAMP'
                                  ? `ANALOG (${ch.minVal}..${ch.maxVal}${ch.unit})`
                                  : 'DIGITAL'}
                              </span>

                              {ch.mode === 'LOGIC_DRIVEN' && ch.logicRule && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 truncate max-w-[175px]">
                                  {formatLogicRuleBadge(ch.logicRule, evaluatedChannels)}
                                </span>
                              )}
                            </div>

                            {/* Bottom Row: Subtle UUID & Double-Click Configure Hint */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>UUID: {ch.uuid.slice(0, 10)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem({ type: 'CHANNEL', channelUuid: ch.uuid });
                                  setShowAdvancedDrawer(true);
                                }}
                                className="text-cyan-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>Configure</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* ====================================================
                              INTERACTIVE SVG WAVEFORM CANVAS FOR THIS TRACK
                             ==================================================== */}
                          <div
                            className="flex-1 relative overflow-hidden cursor-crosshair"
                            onMouseMove={(e) => {
                              setHoverTimeMs(clientXToTimeMs(e.clientX));
                            }}
                            onMouseLeave={() => setHoverTimeMs(null)}
                            onDoubleClick={() => {
                              setSelectedItem({ type: 'CHANNEL', channelUuid: ch.uuid });
                              setShowAdvancedDrawer(true);
                            }}
                          >
                            {/* Vertical Time Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none">
                              {Array.from({ length: 11 }).map((_, gIdx) => (
                                <div
                                  key={gIdx}
                                  className="absolute top-0 bottom-0 border-l border-slate-800/50"
                                  style={{ left: `${gIdx * 10}%` }}
                                />
                              ))}
                              {/* 50% Midline */}
                              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-800/40" />
                            </div>

                            {/* Anchored Floating First-Run Coach Cue on S1 Rising Edge (Section 2.1) */}
                            {coachEnabled &&
                              !coachDismissedForStep &&
                              coachStep === 'first_open' &&
                              idx === 0 &&
                              activeKfs[1] && (
                                <div
                                  className="absolute top-2 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-semibold shadow-lg shadow-cyan-500/30 animate-pulse"
                                  style={{
                                    left: `calc(${(activeKfs[1].t / project.durationMs) * 100}% + 10px)`
                                  }}
                                >
                                  <span>← Drag this edge to change its timing ↔</span>
                                </div>
                              )}

                            {/* Anchored Floating Coach Cue on S2 Analog Ramp (Section 2.1 step 5) */}
                            {coachEnabled &&
                              !coachDismissedForStep &&
                              coachStep === 'edge_moved' &&
                              idx === 1 &&
                              activeKfs[2] && (
                                <div
                                  className="absolute top-2 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-semibold shadow-lg shadow-amber-500/30"
                                  style={{
                                    left: `calc(${(activeKfs[2].t / project.durationMs) * 100}% + 10px)`
                                  }}
                                >
                                  <span>← S3 followed S1! Now drag this ramp handle ↕↔</span>
                                </div>
                              )}

                            {/* SVG Waveform Renderer */}
                            <TrackWaveformSvg
                              channel={ch}
                              keyframes={activeKfs}
                              durationMs={project.durationMs}
                              selectedItem={selectedItem}
                              onSelectKeyframe={(kfId) => {
                                setSelectedItem({
                                  type: 'KEYFRAME',
                                  channelUuid: ch.uuid,
                                  keyframeId: kfId
                                });
                              }}
                              onStartDragKeyframe={(kf, e, svgElement) => {
                                if (ch.mode === 'LOGIC_DRIVEN') {
                                  triggerToast(
                                    'Linked tracks are computed automatically! Drag the source track or edit rule in Properties.'
                                  );
                                  setSelectedItem({ type: 'CHANNEL', channelUuid: ch.uuid });
                                  setShowAdvancedDrawer(true);
                                  return;
                                }
                                const trackRect = svgElement.getBoundingClientRect();
                                // Save snapshot to undo stack before drag begins
                                setHistoryPast((h) => [...h.slice(-49), project]);
                                setHistoryFuture([]);
                                setSelectedItem({
                                  type: 'KEYFRAME',
                                  channelUuid: ch.uuid,
                                  keyframeId: kf.id
                                });
                                setDragState({
                                  channelUuid: ch.uuid,
                                  keyframeId: kf.id,
                                  domainType: ch.domainType,
                                  lockZeroTime: kf.t === 0,
                                  trackRect
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* Subtle Inline "+ Insert here" Gutter Between Adjacent Tracks (Section 2.3) */}
                        <div className="relative h-2 bg-[#0B0F17] group/gutter flex items-center justify-center">
                          <button
                            onClick={() =>
                              setInsertMenuIndex(
                                insertMenuIndex === idx + 1 ? null : idx + 1
                              )
                            }
                            className="opacity-0 group-hover/gutter:opacity-100 focus:opacity-100 z-20 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 border border-slate-700 transition shadow"
                          >
                            + Insert track here
                          </button>
                          {insertMenuIndex === idx + 1 && (
                            <div className="absolute left-24 top-3 z-30">
                              <ThreeChoiceInsertPopover
                                onSelect={(kind) => handleInsertChannel(idx + 1, kind)}
                                onClose={() => setInsertMenuIndex(null)}
                              />
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ============================================================
                    MEASUREMENT & DEADLINE OVERLAY LANE (Section 6, MEAS-001..006)
                   ============================================================ */}
                <div className="bg-[#0E1420] border-t border-slate-800 flex min-h-[76px]">
                  <div className="w-72 shrink-0 border-r border-slate-800 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" />
                        <span>Measurements & Deadlines</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Live semantic Δt bars stay attached when waveforms move (MEAS-003).
                    </p>
                  </div>

                  <div className="flex-1 relative py-2 px-0 overflow-hidden">
                    {/* Render Δt Measurement Dimension Bars */}
                    {project.measurements.map((m, mIdx) => {
                      const srcCh = evaluatedChannels.find((c) => c.uuid === m.sourceChannelUuid);
                      const tgtCh = evaluatedChannels.find((c) => c.uuid === m.targetChannelUuid);
                      if (!srcCh || !tgtCh) return null;

                      const srcKfs = srcCh.mode === 'LOGIC_DRIVEN' ? srcCh.computedKeyframes : srcCh.keyframes;
                      const tgtKfs = tgtCh.mode === 'LOGIC_DRIVEN' ? tgtCh.computedKeyframes : tgtCh.keyframes;

                      const tA = srcKfs[Math.min(m.sourceEdgeIndex, srcKfs.length - 1)]?.t ?? 0;
                      const tB = tgtKfs[Math.min(m.targetEdgeIndex, tgtKfs.length - 1)]?.t ?? 0;

                      const leftMs = Math.min(tA, tB);
                      const rightMs = Math.max(tA, tB);
                      const deltaMs = Number((rightMs - leftMs).toFixed(2));

                      const leftPct = (leftMs / project.durationMs) * 100;
                      const widthPct = Math.max(1, ((rightMs - leftMs) / project.durationMs) * 100);

                      return (
                        <div
                          key={m.id}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            top: `${10 + mIdx * 28}px`
                          }}
                          className="absolute h-6 flex items-center justify-center group/meas"
                        >
                          {/* Left & Right Anchor Ticks */}
                          <div className="absolute left-0 -top-2 bottom-0 border-l-2 border-cyan-400" />
                          <div className="absolute right-0 -top-2 bottom-0 border-r-2 border-emerald-400" />
                          {/* Horizontal Dimension Line */}
                          <div className="w-full border-t border-dashed border-cyan-400/80" />
                          {/* Live Δt Pill */}
                          <div className="absolute px-2 py-0.5 rounded-full bg-slate-900/95 border border-cyan-500/50 text-[11px] font-mono text-cyan-300 shadow flex items-center gap-1.5 whitespace-nowrap">
                            <span>{m.label}:</span>
                            <strong className="text-white">Δt = {deltaMs} ms</strong>
                            <button
                              onClick={() =>
                                commitProjectChange((prev) => ({
                                  ...prev,
                                  measurements: prev.measurements.filter((x) => x.id !== m.id)
                                }))
                              }
                              className="opacity-0 group-hover/meas:opacity-100 text-slate-400 hover:text-rose-400 transition"
                              title="Remove Measurement"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Deadline Checks (MEAS-005, MEAS-006) */}
                    {project.deadlines?.map((dl) => {
                      const ch = evaluatedChannels.find((c) => c.uuid === dl.channelUuid);
                      if (!ch) return null;
                      const kfs = ch.mode === 'LOGIC_DRIVEN' ? ch.computedKeyframes : ch.keyframes;
                      const actualT = kfs[Math.min(dl.edgeIndex, kfs.length - 1)]?.t ?? 0;
                      const passed = actualT <= dl.limitMs;
                      const limitPct = (dl.limitMs / project.durationMs) * 100;

                      return (
                        <div
                          key={dl.id}
                          style={{ left: `${limitPct}%` }}
                          className="absolute top-1 bottom-1 flex items-center"
                        >
                          <div
                            className={`h-full border-l-2 ${
                              passed ? 'border-emerald-400' : 'border-rose-500'
                            }`}
                          />
                          <div
                            className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border ${
                              passed
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                            }`}
                          >
                            {dl.label}: {actualT}ms {passed ? 'PASS (<= ' + dl.limitMs + 'ms)' : 'VIOLATION!'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ============================================================
                    PERMANENT EMBEDDED "+ ADD SIGNAL" AT BOTTOM OF STACK (2.3, UX-004)
                   ============================================================ */}
                <div className="p-4 border-t border-slate-800/80 bg-[#0B0F17] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 relative">
                    <button
                      onClick={() =>
                        setInsertMenuIndex(
                          insertMenuIndex === evaluatedChannels.length
                            ? null
                            : evaluatedChannels.length
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Signal Track</span>
                    </button>

                    {/* Quick 1-click Creation Buttons (UX-004: Digital | Analog | Linked) */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 mr-1">Quick insert:</span>
                      <button
                        onClick={() => handleInsertChannel(evaluatedChannels.length, 'DIGITAL')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition"
                      >
                        + Digital Pulse
                      </button>
                      <button
                        onClick={() => handleInsertChannel(evaluatedChannels.length, 'ANALOG')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition"
                      >
                        + Analog Ramp
                      </button>
                      <button
                        onClick={() => handleInsertChannel(evaluatedChannels.length, 'LINKED')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition"
                      >
                        + Linked Follower
                      </button>
                    </div>

                    {insertMenuIndex === evaluatedChannels.length && (
                      <div className="absolute left-0 bottom-12 z-30">
                        <ThreeChoiceInsertPopover
                          onSelect={(kind) =>
                            handleInsertChannel(evaluatedChannels.length, kind)
                          }
                          onClose={() => setInsertMenuIndex(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Quick Scenario Switcher Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400 mr-1">
                      Industry Presets:
                    </span>
                    {Object.values(INDUSTRY_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          commitProjectChange(preset.project);
                          triggerToast(`Loaded ${preset.title}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          project.presetId === preset.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {preset.badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================
                PROGRESSIVE DISCLOSURE DRAWER (Section 9, UX-007, UX-009, 4.3)
                Hidden by default; reveals exact numeric timing and the 6 V1.0
                engineering primitives when explicitly opened.
               ================================================================ */}
            {showAdvancedDrawer && selectedChannelObj && (
              <aside className="w-80 md:w-96 border-l border-slate-800 bg-[#0F1522] p-4 overflow-y-auto flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      Progressive Disclosure (UX-007)
                    </span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedChannelObj.name}</span>
                      <span className="text-xs font-mono text-slate-400">
                        ({selectedChannelObj.mode})
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAdvancedDrawer(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Channel Mode Toggle: MANUAL vs LOGIC_DRIVEN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Channel Driving Mode (CORE-012)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        commitProjectChange((prev) => ({
                          ...prev,
                          channels: prev.channels.map((c) =>
                            c.uuid === selectedChannelObj.uuid
                              ? {
                                  ...c,
                                  mode: 'MANUAL',
                                  keyframes:
                                    c.keyframes.length > 0
                                      ? c.keyframes
                                      : c.computedKeyframes || [
                                          { id: `k-${Date.now()}`, t: 0, v: 0, type: 'STEP' }
                                        ]
                                }
                              : c
                          )
                        }))
                      }
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                        selectedChannelObj.mode === 'MANUAL'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Manual Keyframes
                    </button>
                    <button
                      onClick={() =>
                        commitProjectChange((prev) => ({
                          ...prev,
                          channels: prev.channels.map((c) =>
                            c.uuid === selectedChannelObj.uuid
                              ? {
                                  ...c,
                                  mode: 'LOGIC_DRIVEN',
                                  logicRule: c.logicRule || {
                                    kind: 'DELAY',
                                    sourceUuid:
                                      prev.channels.find((x) => x.uuid !== c.uuid)?.uuid || '',
                                    secondaryUuid: null,
                                    operator: 'FOLLOW',
                                    delayMs: 20,
                                    offDelayMs: 20,
                                    delayMode: 'INERTIAL',
                                    thresholdVal: 6.0,
                                    primitive: 'NONE',
                                    paramA: 10,
                                    paramB: 12
                                  }
                                }
                              : c
                          )
                        }))
                      }
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                        selectedChannelObj.mode === 'LOGIC_DRIVEN'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Linked / Logic Rule
                    </button>
                  </div>
                </div>

                {/* IF MANUAL: Exact Numeric Keyframe Table (UX-009) */}
                {selectedChannelObj.mode === 'MANUAL' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">
                        Exact Keyframes (UX-009)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Unit: {selectedChannelObj.unit}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedChannelObj.keyframes.map((kf, kIdx) => (
                        <div
                          key={kf.id}
                          className={`p-2.5 rounded-xl border text-xs space-y-2 ${
                            selectedKeyframeObj?.id === kf.id
                              ? 'bg-slate-800/90 border-cyan-500/50'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-cyan-300">
                              Point #{kIdx + 1}
                            </span>
                            {kIdx > 0 && (
                              <button
                                onClick={() =>
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? {
                                            ...c,
                                            keyframes: c.keyframes.filter((x) => x.id !== kf.id)
                                          }
                                        : c
                                    )
                                  }))
                                }
                                className="text-slate-400 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Time (ms)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={project.durationMs}
                                step={1}
                                value={kf.t}
                                onChange={(e) => {
                                  const newT = Math.max(
                                    0,
                                    Math.min(project.durationMs, Number(e.target.value))
                                  );
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? {
                                            ...c,
                                            keyframes: c.keyframes.map((x) =>
                                              x.id === kf.id ? { ...x, t: newT } : x
                                            )
                                          }
                                        : c
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Value ({selectedChannelObj.unit})
                              </label>
                              {selectedChannelObj.domainType === 'DIGITAL' ? (
                                <select
                                  value={kf.v}
                                  onChange={(e) => {
                                    const newV = Number(e.target.value);
                                    commitProjectChange((prev) => ({
                                      ...prev,
                                      channels: prev.channels.map((c) =>
                                        c.uuid === selectedChannelObj.uuid
                                          ? {
                                              ...c,
                                              keyframes: c.keyframes.map((x) =>
                                                x.id === kf.id ? { ...x, v: newV } : x
                                              )
                                            }
                                          : c
                                      )
                                    }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                                >
                                  <option value={0}>0 (LOW)</option>
                                  <option value={1}>1 (HIGH)</option>
                                  <option value={2}>Hi-Z (CORE-027)</option>
                                  <option value={3}>UNKNOWN</option>
                                </select>
                              ) : (
                                <input
                                  type="number"
                                  step={0.5}
                                  value={kf.v}
                                  onChange={(e) => {
                                    const newV = Number(e.target.value);
                                    commitProjectChange((prev) => ({
                                      ...prev,
                                      channels: prev.channels.map((c) =>
                                        c.uuid === selectedChannelObj.uuid
                                          ? {
                                              ...c,
                                              keyframes: c.keyframes.map((x) =>
                                                x.id === kf.id ? { ...x, v: newV } : x
                                              )
                                            }
                                          : c
                                      )
                                    }));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                                />
                              )}
                            </div>
                          </div>

                          {/* Analog Interpolation Selector: STEP | LINEAR_RAMP | EXP_RC (CORE-021) */}
                          {selectedChannelObj.domainType === 'ANALOG_RAMP' && kIdx > 0 && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Segment Shape (CORE-021)
                              </label>
                              <select
                                value={kf.type}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? {
                                            ...c,
                                            keyframes: c.keyframes.map((x) =>
                                              x.id === kf.id ? { ...x, type: newType } : x
                                            )
                                          }
                                        : c
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                              >
                                <option value="LINEAR_RAMP">Linear Ramp (v0 → v1)</option>
                                <option value="EXP_RC">Smooth RC Exponential (EXP_RC)</option>
                                <option value="STEP">Instant Step</option>
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IF LOGIC_DRIVEN: Reactive Rules & 6 V1.0 Primitives Editor (Section 4.2, 4.3) */}
                {selectedChannelObj.mode === 'LOGIC_DRIVEN' && selectedChannelObj.logicRule && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Upstream Source Channel (UUID Reference - CORE-013)
                      </label>
                      <select
                        value={selectedChannelObj.logicRule.sourceUuid}
                        onChange={(e) => {
                          const srcUuid = e.target.value;
                          commitProjectChange((prev) => ({
                            ...prev,
                            channels: prev.channels.map((c) =>
                              c.uuid === selectedChannelObj.uuid
                                ? { ...c, logicRule: { ...c.logicRule, sourceUuid: srcUuid } }
                                : c
                            )
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {project.channels
                          .filter((c) => c.uuid !== selectedChannelObj.uuid)
                          .map((c, i) => (
                            <option key={c.uuid} value={c.uuid}>
                              S{i + 1}: {c.name} ({c.domainType})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* V1.0 Timing Primitive Selector (Section 4.3 - PRIM-001..006) */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        V1.0 Timing Primitive (Section 4.3)
                      </label>
                      <select
                        value={selectedChannelObj.logicRule.primitive}
                        onChange={(e) => {
                          const prim = e.target.value;
                          commitProjectChange((prev) => ({
                            ...prev,
                            channels: prev.channels.map((c) =>
                              c.uuid === selectedChannelObj.uuid
                                ? { ...c, logicRule: { ...c.logicRule, primitive: prim } }
                                : c
                            )
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-medium"
                      >
                        <option value="NONE">Standard Follow / Delay / Threshold</option>
                        <option value="QUALIFY">PRIM-001: QUALIFY (Ignore short glitches)</option>
                        <option value="HYSTERESIS">PRIM-002: HYSTERESIS (Two-threshold switch)</option>
                        <option value="DEADTIME">PRIM-004: DEADTIME (Block for X ms)</option>
                        <option value="WATCHDOG">PRIM-005: WATCHDOG (Missing pulse alert)</option>
                        <option value="JITTER_PROP">PRIM-006: JITTER_PROP (Timing tolerance band)</option>
                      </select>
                    </div>

                    {/* Dynamic Parameter Controls based on Selected Rule/Primitive */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      {selectedChannelObj.logicRule.primitive === 'NONE' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Turn-On Delay (ms)
                              </label>
                              <input
                                type="number"
                                value={selectedChannelObj.logicRule.delayMs}
                                onChange={(e) => {
                                  const d = Number(e.target.value);
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? {
                                            ...c,
                                            logicRule: { ...c.logicRule, delayMs: d, offDelayMs: d }
                                          }
                                        : c
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Threshold (if Analog)
                              </label>
                              <input
                                type="number"
                                step={0.5}
                                value={selectedChannelObj.logicRule.thresholdVal}
                                onChange={(e) => {
                                  const th = Number(e.target.value);
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? {
                                            ...c,
                                            logicRule: { ...c.logicRule, thresholdVal: th }
                                          }
                                        : c
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {selectedChannelObj.logicRule.primitive === 'QUALIFY' && (
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">
                            Qualification Time tQual (ms) — Rejects pulses &lt; tQual
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={selectedChannelObj.logicRule.paramA}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              commitProjectChange((prev) => ({
                                ...prev,
                                channels: prev.channels.map((c) =>
                                  c.uuid === selectedChannelObj.uuid
                                    ? { ...c, logicRule: { ...c.logicRule, paramA: val } }
                                    : c
                                )
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                          />
                        </div>
                      )}

                      {selectedChannelObj.logicRule.primitive === 'HYSTERESIS' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Vlow Threshold
                            </label>
                            <input
                              type="number"
                              step={0.5}
                              value={selectedChannelObj.logicRule.paramA}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                commitProjectChange((prev) => ({
                                  ...prev,
                                  channels: prev.channels.map((c) =>
                                    c.uuid === selectedChannelObj.uuid
                                      ? { ...c, logicRule: { ...c.logicRule, paramA: val } }
                                      : c
                                  )
                                }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Vhigh Threshold
                            </label>
                            <input
                              type="number"
                              step={0.5}
                              value={selectedChannelObj.logicRule.paramB}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                commitProjectChange((prev) => ({
                                  ...prev,
                                  channels: prev.channels.map((c) =>
                                    c.uuid === selectedChannelObj.uuid
                                      ? { ...c, logicRule: { ...c.logicRule, paramB: val } }
                                      : c
                                  )
                                }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {selectedChannelObj.logicRule.primitive === 'WATCHDOG' && (
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">
                            Watchdog Timeout Window (ms)
                          </label>
                          <input
                            type="number"
                            min={5}
                            value={selectedChannelObj.logicRule.paramA}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              commitProjectChange((prev) => ({
                                ...prev,
                                channels: prev.channels.map((c) =>
                                  c.uuid === selectedChannelObj.uuid
                                    ? { ...c, logicRule: { ...c.logicRule, paramA: val } }
                                    : c
                                )
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                          />
                        </div>
                      )}

                      {(selectedChannelObj.logicRule.primitive === 'DEADTIME' ||
                        selectedChannelObj.logicRule.primitive === 'JITTER_PROP') && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              {selectedChannelObj.logicRule.primitive === 'DEADTIME'
                                ? 'Inhibit Window (ms)'
                                : 'Early Tolerance (-ms)'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={selectedChannelObj.logicRule.paramA}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                commitProjectChange((prev) => ({
                                  ...prev,
                                  channels: prev.channels.map((c) =>
                                    c.uuid === selectedChannelObj.uuid
                                      ? { ...c, logicRule: { ...c.logicRule, paramA: val } }
                                      : c
                                  )
                                }));
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                            />
                          </div>
                          {selectedChannelObj.logicRule.primitive === 'JITTER_PROP' && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">
                                Late Tolerance (+ms)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={selectedChannelObj.logicRule.paramB}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  commitProjectChange((prev) => ({
                                    ...prev,
                                    channels: prev.channels.map((c) =>
                                      c.uuid === selectedChannelObj.uuid
                                        ? { ...c, logicRule: { ...c.logicRule, paramB: val } }
                                        : c
                                    )
                                  }));
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 2: INTERACTIVE UML & SYSTEM ARCHITECTURE REVIEW HUB
          Allows the engineer to visually review the specification architecture,
          UML domain classes, Event Evaluator sequence, and Coach FSM.
         ==================================================================== */}
      {activeMainView === 'UML_ARCH' && (
        <UmlAndArchitectureReviewer
          activeSubTab={activeUmlSubTab}
          setActiveSubTab={setActiveUmlSubTab}
          onJumpToFeature={handleJumpToFeature}
        />
      )}

      {/* ====================================================================
          VIEW 3: INTERACTIVE SRS REVIEW & TRACEABILITY MATRIX
         ==================================================================== */}
      {activeMainView === 'SRS_MATRIX' && (
        <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Specification Verification • SFS-SRS-003 v3.0
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Interactive Requirements & Traceability Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Review each requirement, filter by release gate (Prototype / MVP / V1.0), and jump directly to the live implementation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={srsFilterCategory}
                onChange={(e) => setSrsFilterCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Categories</option>
                <option value="UX">UX (Non-Negotiable Usability)</option>
                <option value="ARCH">SYS / Architecture</option>
                <option value="CORE">CORE (Time & Signal Model)</option>
                <option value="PRIM">PRIM (V1.0 Timing Primitives)</option>
                <option value="MEAS">MEAS & EXP (Analysis & Export)</option>
              </select>

              <select
                value={srsFilterRelease}
                onChange={(e) => setSrsFilterRelease(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Releases</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
                <option value="V1.0">V1.0</option>
              </select>
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Release</th>
                  <th className="py-3 px-4">Requirement & Acceptance Criterion</th>
                  <th className="py-3 px-4 text-right">Interactive Demo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {SRS_REQUIREMENTS_LIST.filter((r) => {
                  if (srsFilterCategory !== 'ALL' && r.category !== srsFilterCategory && !(srsFilterCategory === 'MEAS' && (r.category === 'MEAS' || r.category === 'EXP'))) {
                    return false;
                  }
                  if (srsFilterRelease !== 'ALL' && r.release !== srsFilterRelease) {
                    return false;
                  }
                  return true;
                }).map((req) => {
                  const isChecked = verifiedReqIds.has(req.id);
                  return (
                    <tr key={req.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setVerifiedReqIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(req.id)) next.delete(req.id);
                              else next.add(req.id);
                              return next;
                            });
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-slate-900 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                        {req.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            req.release === 'Prototype'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : req.release === 'MVP'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {req.release}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{req.title}</div>
                        <div className="text-slate-400 mt-0.5">{req.criteria}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleJumpToFeature(req.featureJump)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 transition"
                        >
                          <span>Inspect Live</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          NEW PROJECT & SCENARIO CHOOSER MODAL (Section 2.2 & Section 8)
          3 Prominent Cards: Quick Start | Blank Canvas | Industry Examples
         ==================================================================== */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Section 2.2 • New Project Semantics
                </span>
                <h3 className="text-lg font-bold text-white">
                  Choose Workspace Starting Point or Industry Example
                </h3>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Prominent Cards (Section 2.2) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  commitProjectChange(INITIAL_STARTER_PROJECT);
                  setCoachStep('first_open');
                  setCoachDismissedForStep(false);
                  setShowNewProjectModal(false);
                  triggerToast('Loaded Quick Start (3-Row Self-Teaching Diagram)');
                }}
                className="text-left p-4 rounded-xl bg-gradient-to-br from-cyan-500/15 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">
                    Recommended • UX-000
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">
                    1. Quick Start (3-Row Tutorial)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Immediately loads S1 Digital, S2 Analog Ramp, and S3 Linked Follower (+20ms).
                  </p>
                </div>
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <span>Load Starter Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                onClick={() => {
                  commitProjectChange({
                    schemaVersion: '3.0.0',
                    engineVersion: '1.0.0',
                    name: 'Untitled Timing Diagram',
                    presetId: 'BLANK',
                    durationMs: 250,
                    channels: [],
                    measurements: [],
                    deadlines: []
                  });
                  setShowNewProjectModal(false);
                  triggerToast('Opened Blank Canvas — use "+ Add Signal" to begin');
                }}
                className="text-left p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Expert Mode
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">
                    2. Blank Canvas
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Clean 0–250ms timeline for experienced users who want to build from scratch.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <span>Start Blank</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Section 8 • Presets
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">
                    3. Industry Examples Library
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any of the verified engineering scenarios below (opens an editable copy).
                  </p>
                </div>
                <span className="text-xs text-purple-300 font-mono">
                  Choose from cards below ↓
                </span>
              </div>
            </div>

            {/* Industry Scenario Cards with Visual Waveform Preview (Section 8.1, 8.2) */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Featured Industry Scenarios (Editable Copies)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(INDUSTRY_PRESETS)
                  .filter((p) => p.id !== 'STARTER')
                  .map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        commitProjectChange(preset.project);
                        setShowNewProjectModal(false);
                        triggerToast(`Loaded ${preset.title}`);
                      }}
                      className="text-left p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                            {preset.badge} • {preset.category}
                          </span>
                          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                            <span>Open Copy</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white mt-2">
                          {preset.title}
                        </h5>
                        <p className="text-xs text-slate-400 mt-1">
                          {preset.summary}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          LIGHT-THEME MEETING REPORT PNG EXPORT MODAL (EXP-001..005)
          Generates a high-contrast light-background diagram without altering
          the dark editing workspace or including coach hints/handles.
         ==================================================================== */}
      {showExportModal && (
        <LightThemeExportModal
          project={project}
          evaluatedChannels={evaluatedChannels}
          onClose={() => setShowExportModal(false)}
          onNotify={triggerToast}
        />
      )}

      {/* Non-Blocking Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-xs font-medium text-cyan-200 shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: 3-CHOICE TRACK INSERTION POPOVER (UX-004, UX-005)
// ============================================================================
function ThreeChoiceInsertPopover({ onSelect, onClose }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-64 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-2 space-y-1 z-40"
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Add Track (UX-004)
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={() => onSelect('DIGITAL')}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between"
      >
        <div>
          <div className="text-xs font-semibold text-cyan-300">1. Digital</div>
          <div className="text-[10px] text-slate-400">Ready LOW/HIGH pulse shape</div>
        </div>
        <span className="font-mono text-xs text-cyan-400">⎍</span>
      </button>
      <button
        onClick={() => onSelect('ANALOG')}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between"
      >
        <div>
          <div className="text-xs font-semibold text-amber-300">2. Analog</div>
          <div className="text-[10px] text-slate-400">Linear or RC voltage/RPM ramp</div>
        </div>
        <span className="font-mono text-xs text-amber-400">╱╲</span>
      </button>
      <button
        onClick={() => onSelect('LINKED')}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-between"
      >
        <div>
          <div className="text-xs font-semibold text-emerald-300">3. Linked</div>
          <div className="text-[10px] text-slate-400">Follows source with delay/rule</div>
        </div>
        <span className="font-mono text-xs text-emerald-400">→</span>
      </button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: SVG WAVEFORM RENDERER WITH DRAGGABLE HANDLES
// Supports DIGITAL (LOW, HIGH, Hi-Z, UNKNOWN), ANALOG_RAMP (LINEAR, EXP_RC),
// dashed threshold crossings (UI-005), Deadtime zones, and Jitter bands.
// ============================================================================
function TrackWaveformSvg({
  channel,
  keyframes,
  durationMs,
  selectedItem,
  onSelectKeyframe,
  onStartDragKeyframe
}) {
  const svgRef = useRef(null);
  const viewW = 1000;
  const viewH = 100;
  const padTop = 16;
  const padBottom = 16;
  const usableH = viewH - padTop - padBottom;

  const timeToX = (t) => (Math.max(0, Math.min(durationMs, t)) / durationMs) * viewW;
  const valToY = (v) => {
    const min = channel.minVal ?? 0;
    const max = channel.maxVal ?? 1;
    const norm = max > min ? (v - min) / (max - min) : 0;
    const clamped = Math.max(0, Math.min(1, norm));
    return padTop + (1 - clamped) * usableH;
  };

  // Build SVG path string for DIGITAL or ANALOG_RAMP
  const { strokePath, fillPath } = useMemo(() => {
    if (!keyframes || keyframes.length === 0) {
      return { strokePath: '', fillPath: '' };
    }
    const sorted = [...keyframes].sort((a, b) => a.t - b.t);

    if (channel.domainType === 'DIGITAL') {
      let d = '';
      let currentY = valToY(sorted[0].v === 1 ? 1 : sorted[0].v === 2 ? 0.5 : 0);
      d += `M 0 ${currentY} `;

      sorted.forEach((kf) => {
        const x = timeToX(kf.t);
        const nextY = valToY(kf.v === 1 ? 1 : kf.v === 2 ? 0.5 : 0);
        d += `L ${x} ${currentY} L ${x} ${nextY} `;
        currentY = nextY;
      });
      d += `L ${viewW} ${currentY}`;
      const baselineY = valToY(0);
      const area = `${d} L ${viewW} ${baselineY} L 0 ${baselineY} Z`;
      return { strokePath: d, fillPath: area };
    } else {
      // ANALOG_RAMP (supports STEP, LINEAR_RAMP, EXP_RC)
      let d = '';
      const firstX = timeToX(sorted[0].t);
      const firstY = valToY(sorted[0].v);
      d += `M 0 ${firstY} L ${firstX} ${firstY} `;

      for (let i = 0; i < sorted.length - 1; i++) {
        const k0 = sorted[i];
        const k1 = sorted[i + 1];
        const x0 = timeToX(k0.t);
        const y0 = valToY(k0.v);
        const x1 = timeToX(k1.t);
        const y1 = valToY(k1.v);

        if (k1.type === 'STEP') {
          d += `L ${x1} ${y0} L ${x1} ${y1} `;
        } else if (k1.type === 'EXP_RC' && k1.t > k0.t) {
          const steps = 16;
          for (let s = 1; s <= steps; s++) {
            const subT = k0.t + ((k1.t - k0.t) * s) / steps;
            const subV = evaluateAnalogAtTime(sorted, subT);
            d += `L ${timeToX(subT)} ${valToY(subV)} `;
          }
        } else {
          d += `L ${x1} ${y1} `;
        }
      }

      const lastKf = sorted[sorted.length - 1];
      d += `L ${viewW} ${valToY(lastKf.v)}`;
      const baselineY = valToY(channel.minVal ?? 0);
      const area = `${d} L ${viewW} ${baselineY} L 0 ${baselineY} Z`;
      return { strokePath: d, fillPath: area };
    }
  }, [keyframes, channel, durationMs]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
    >
      {/* Subtle Gradient Fill Under Waveform */}
      {fillPath && (
        <path
          d={fillPath}
          fill={channel.color}
          fillOpacity={0.11}
          className="pointer-events-none"
        />
      )}

      {/* Deadtime Inhibited Zones (PRIM-004 Hatched Overlay) */}
      {channel.deadtimeZones?.map((dz, i) => {
        const xStart = timeToX(dz.start);
        const xEnd = timeToX(dz.end);
        return (
          <g key={i}>
            <rect
              x={xStart}
              y={padTop}
              width={Math.max(4, xEnd - xStart)}
              height={usableH}
              fill="#f43f5e"
              fillOpacity={0.18}
              stroke="#f43f5e"
              strokeDasharray="4 4"
            />
            <text
              x={xStart + 6}
              y={padTop + 14}
              fill="#fda4af"
              fontSize="11"
              fontFamily="monospace"
            >
              DEADTIME
            </text>
          </g>
        );
      })}

      {/* Jitter Tolerance Shaded Bands (PRIM-006) */}
      {channel.jitterBands?.map((jb, i) => {
        const xEarly = timeToX(jb.early);
        const xLate = timeToX(jb.late);
        return (
          <rect
            key={i}
            x={xEarly}
            y={padTop}
            width={Math.max(6, xLate - xEarly)}
            height={usableH}
            fill="#a855f7"
            fillOpacity={0.28}
          />
        );
      })}

      {/* Dashed Threshold Line & Highlighted Analytical Crossing on Analog Track (UI-005, F03) */}
      {channel.thresholdCrossings?.map((tc, idx) => {
        const yThresh = valToY(tc.v);
        const xCross = timeToX(tc.t);
        return (
          <g key={idx} className="pointer-events-none">
            <line
              x1={0}
              y1={yThresh}
              x2={viewW}
              y2={yThresh}
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              opacity={0.7}
            />
            <circle cx={xCross} cy={yThresh} r={5} fill="#10b981" />
            <text
              x={xCross + 8}
              y={Math.max(14, yThresh - 6)}
              fill="#6ee7b7"
              fontSize="11"
              fontFamily="monospace"
            >
              {tc.label} @ {tc.t}ms
            </text>
          </g>
        );
      })}

      {/* Main Signal Trace */}
      {strokePath && (
        <path
          d={strokePath}
          fill="none"
          stroke={channel.color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Interactive Draggable Handles for Edges and Ramp Endpoints (UX-008) */}
      {keyframes.map((kf, idx) => {
        // Skip t=0 handle for digital tracks to keep start clean
        if (channel.domainType === 'DIGITAL' && idx === 0) return null;

        const cx = timeToX(kf.t);
        const cy =
          channel.domainType === 'DIGITAL'
            ? padTop + usableH / 2
            : valToY(kf.v);
        const isSelected =
          selectedItem?.type === 'KEYFRAME' && selectedItem?.keyframeId === kf.id;

        return (
          <g
            key={kf.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelectKeyframe(kf.id);
              onStartDragKeyframe(kf, e, svgRef.current);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onSelectKeyframe(kf.id);
              onStartDragKeyframe(kf, e, svgRef.current);
            }}
            className={
              channel.mode === 'MANUAL'
                ? channel.domainType === 'DIGITAL'
                  ? 'cursor-ew-resize'
                  : 'cursor-move'
                : 'cursor-pointer'
            }
          >
            {/* Invisible Expanded Hit Target for Easy Touch/Mouse Grabbing */}
            <rect x={cx - 12} y={padTop - 6} width={24} height={usableH + 12} fill="transparent" />

            {/* Vertical Edge Handle Bar for Digital Transitions */}
            {channel.domainType === 'DIGITAL' ? (
              <>
                <line
                  x1={cx}
                  y1={padTop}
                  x2={cx}
                  y2={padTop + usableH}
                  stroke={isSelected ? '#ffffff' : channel.color}
                  strokeWidth={isSelected ? '4' : '2.5'}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6.5 : 5}
                  fill={isSelected ? '#ffffff' : '#0B0F17'}
                  stroke={channel.color}
                  strokeWidth="2.5"
                />
              </>
            ) : (
              /* Circular Breakpoint Handle for Analog Ramps */
              <circle
                cx={cx}
                cy={cy}
                r={isSelected ? 7 : 5.5}
                fill={isSelected ? '#ffffff' : '#0B0F17'}
                stroke={channel.color}
                strokeWidth="2.5"
              />
            )}

            {/* Live Timestamp & Value Callout Pill on Handle */}
            <text
              x={cx + 6}
              y={channel.domainType === 'DIGITAL' ? padTop + 11 : Math.max(13, cy - 8)}
              fill={isSelected ? '#ffffff' : '#94a3b8'}
              fontSize="11"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {kf.t}ms
              {channel.domainType === 'ANALOG_RAMP' ? ` (${kf.v}${channel.unit})` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// SUB-COMPONENT: INTERACTIVE UML & SYSTEM ARCHITECTURE REVIEWER
// Provides 4 rich visual tabs to inspect the specification's architecture:
// 1. Layered System Architecture (SYS-001..005)
// 2. UML Domain Class Diagram (CORE, LOGIC, MEAS)
// 3. Event-Driven Evaluator & Coincident Tie-Breaking (CORE-030..036)
// 4. Contextual Coach State Machine & First-Click Grammar (Section 2.5, 5.1)
// ============================================================================
function UmlAndArchitectureReviewer({ activeSubTab, setActiveSubTab, onJumpToFeature }) {
  const [selectedArchLayer, setSelectedArchLayer] = useState('ENGINE');

  const ARCH_LAYERS = {
    UI: {
      id: 'UI',
      title: '1. UI & Interaction Layer (src/ui/*)',
      badge: 'UI-001..013, UX-000..020',
      color: 'cyan',
      summary:
        'Synchronized track headers and interactive Canvas/SVG renderer, embedded + Add Signal controls, Smart Action Bar, and non-blocking Context Coach.',
      rules: [
        'SYS-003: Visual drag gestures are translated into validated, undoable domain commands; renderer is NEVER the source of mathematical truth.',
        'UX-000: First load opens immediately into the 3-row Quick Start diagram with zero modal wizards.',
        'UX-007: Progressive disclosure keeps advanced primitives one click away without cluttering basic workflows.'
      ]
    },
    CORE: {
      id: 'CORE',
      title: '2. Core Math & Domain Model (src/core/*)',
      badge: 'CORE-001..029',
      color: 'amber',
      summary:
        'Pure TypeScript models with immutable UUID channel identities, 64-bit nanosecond internal timestamps, physical unit enforcement, and piecewise signal keyframes.',
      rules: [
        'SYS-001: Zero UI or DOM dependencies allowed inside src/core.',
        'CORE-002: Internal time stored as exact integer nanoseconds; viewport zoom never mutates timestamps.',
        'CORE-013: All logic rules reference immutable channel UUIDs so reordering/inserting relabels S1..Sn safely.'
      ]
    },
    ENGINE: {
      id: 'ENGINE',
      title: '3. Event-Driven Reactive Engine (src/engine/*)',
      badge: 'CORE-030..036, LOGIC-001..009, PRIM-001..006',
      color: 'emerald',
      summary:
        'DAG dependency solver, analytical ramp threshold solver, priority event queue, and the 6 cross-industry timing primitives (Qualify, Hysteresis, Discrepancy, Deadtime, Watchdog, Jitter).',
      rules: [
        'SYS-002: Computed event timestamps are 100% deterministic and independent of zoom, DPI, or frame rate.',
        'CORE-032: Linear and RC threshold crossings are solved analytically rather than pixel-sampled.',
        'CORE-033: Coincident-event tie order: (1) Update source state -> (2) Settle combinational DAG -> (3) Process/cancel timers.'
      ]
    },
    ANALYSIS: {
      id: 'ANALYSIS',
      title: '4. Analysis, Persistence & Export (src/analysis/*, src/export/*)',
      badge: 'MEAS-001..008, DATA-001..006, EXP-001..005',
      color: 'purple',
      summary:
        'Semantic Δt dimension bars anchored to events, deadline pass/violation evaluators, versioned JSON serialization, and high-DPI Light-Theme Report PNG/SVG generator.',
      rules: [
        'MEAS-003: Measurements attach semantically to event edges and recompute live Δt when traces move.',
        'SEC-001: Strict schema validation on JSON load; never evaluate arbitrary JS strings.',
        'EXP-005: Export renders directly from mathematical scene positions without coach overlays or handles.'
      ]
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Header & Diagram Sub-Navigation */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Interactive Specification Review • SFS-SRS-003
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            UML Class Model, System Architecture & State Machines
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'LAYERED_ARCH', label: '1. Layered Architecture (SYS-001)' },
            { id: 'UML_CLASS', label: '2. UML Domain Class Diagram' },
            { id: 'EVENT_ENGINE', label: '3. Event Evaluator & Tie-Order' },
            { id: 'COACH_FSM', label: '4. UX Coach State Machine' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeSubTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================================
          SUB-TAB 1: LAYERED SYSTEM ARCHITECTURE (SYS-001..005)
         ==================================================================== */}
      {activeSubTab === 'LAYERED_ARCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Architecture Stack Diagram */}
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Unidirectional Layered Architecture (Click any layer to inspect)</span>
            </h3>

            <div className="space-y-3">
              {Object.values(ARCH_LAYERS).map((layer, idx) => {
                const isSel = selectedArchLayer === layer.id;
                return (
                  <React.Fragment key={layer.id}>
                    <button
                      onClick={() => setSelectedArchLayer(layer.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSel
                          ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{layer.title}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {layer.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{layer.summary}</p>
                    </button>
                    {idx < 3 && (
                      <div className="flex justify-center text-slate-500 font-mono text-xs">
                        ↓ Validated Domain Commands / Pure Mathematical State ↓
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Inspector Panel for Selected Layer */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Architectural Contract Inspector
              </span>
              <h3 className="text-lg font-bold text-white">
                {ARCH_LAYERS[selectedArchLayer].title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ARCH_LAYERS[selectedArchLayer].summary}
              </p>

              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-mono uppercase text-slate-400">
                  Enforced Specification Rules:
                </h4>
                {ARCH_LAYERS[selectedArchLayer].rules.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400">
                Repository Structure (Section 10.2)
              </div>
              <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`signalflow-studio/
  src/
    core/{model,math,units,serialization}/
    engine/{events,logic,primitives,validation}/
    analysis/{measurements,deadlines,uncertainty}/
    ui/{canvas,tracks,toolbar,smart-actions,coach}/
    examples/{starter,industry}/
    export/{png-light-report,svg-pdf}/`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: UML DOMAIN CLASS DIAGRAM (CORE, LOGIC, MEAS)
         ==================================================================== */}
      {activeSubTab === 'UML_CLASS' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">
                UML Domain Class Diagram (Sections 3, 4, 6, 7)
              </h3>
              <p className="text-xs text-slate-400">
                Complete entity relationships for Workspace, Channel, Keyframe, LogicRule, TimingPrimitives, and MeasurementBar.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              UUID Integrity (CORE-010, CORE-013)
            </span>
          </div>

          {/* Visual UML Class Grid with Multiplicity Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* UML Box 1: Workspace */}
            <UmlClassBox
              stereotype="«AggregateRoot»"
              classNameTitle="WorkspaceProject"
              headerColor="border-cyan-500/50 bg-cyan-950/30"
              attributes={[
                '+ schemaVersion: "3.0.0"',
                '+ engineVersion: "1.0.0"',
                '+ durationNs: bigint (default 250ms)',
                '+ theme: "DARK_SALEAE" | "LIGHT_DOC"',
                '+ channels: Channel[0..*]',
                '+ measurements: MeasurementBar[0..*]',
                '+ deadlines: DeadlineRule[0..*]'
              ]}
              methods={[
                '+ evaluateDAG(): EvaluatedScene',
                '+ serializeToJson(): string',
                '+ exportLightReportPng(): Blob'
              ]}
            />

            {/* UML Box 2: Channel */}
            <UmlClassBox
              stereotype="«Entity • CORE-010»"
              classNameTitle="Channel"
              headerColor="border-amber-500/50 bg-amber-950/30"
              attributes={[
                '+ uuid: UUID (immutable primary key)',
                '+ index: number (1-based visual order)',
                '+ shortId: string (computed "S1..Sn")',
                '+ name: string',
                '+ domainType: DIGITAL | ANALOG_RAMP | BUS_STATE',
                '+ mode: MANUAL | LOGIC_DRIVEN',
                '+ unit: PhysicalUnit ("V" | "RPM" | "Logic")'
              ]}
              methods={[
                '+ evaluateAt(tNs: bigint): number | State',
                '+ relabelShortId(newIdx: number): void'
              ]}
            />

            {/* UML Box 3: Keyframe */}
            <UmlClassBox
              stereotype="«ValueObject • CORE-020»"
              classNameTitle="SignalKeyframe"
              headerColor="border-sky-500/50 bg-sky-950/30"
              attributes={[
                '+ id: string',
                '+ timeNs: bigint (exact timestamp)',
                '+ value: number | DigitalState',
                '+ type: STEP | LINEAR_RAMP | EXP_RC',
                '+ tauNs?: bigint (for EXP_RC)',
                '+ jitterTolerance?: [-earlyNs, +lateNs]'
              ]}
              methods={[
                '+ interpolateTo(next: Keyframe, t: bigint)',
                '+ solveThresholdExact(vThresh: number): bigint'
              ]}
            />

            {/* UML Box 4: LogicRule */}
            <UmlClassBox
              stereotype="«DomainRule • LOGIC-001»"
              classNameTitle="LogicRule"
              headerColor="border-emerald-500/50 bg-emerald-950/30"
              attributes={[
                '+ sourceUuids: UUID[1..4] (never S#)',
                '+ operator: FOLLOW | AND | OR | NOT | XOR | THRESH',
                '+ turnOnDelayNs: bigint',
                '+ turnOffDelayNs: bigint',
                '+ delayMode: INERTIAL | TRANSPORT',
                '+ primitive: TimingPrimitiveType'
              ]}
              methods={[
                '+ detectCycle(dag: DependencyGraph): boolean',
                '+ computeOutputTransitions(): SignalKeyframe[]'
              ]}
            />

            {/* UML Box 5: Six V1.0 Primitives */}
            <UmlClassBox
              stereotype="«Enumeration • Section 4.3»"
              classNameTitle="TimingPrimitive (V1.0)"
              headerColor="border-purple-500/50 bg-purple-950/30"
              attributes={[
                '• QUALIFY (tQual debounce filter - PRIM-001)',
                '• HYSTERESIS (Vlow / Vhigh switch - PRIM-002)',
                '• DISCREPANCY_2OO2 (tDisc fault - PRIM-003)',
                '• DEADTIME (inhibit window - PRIM-004)',
                '• WATCHDOG (missing pulse timeout - PRIM-005)',
                '• JITTER_PROP ([-early, +late] band - PRIM-006)'
              ]}
              methods={[
                '+ applyBoundaryPolicy(edgeT, expiryT): State'
              ]}
            />

            {/* UML Box 6: MeasurementBar & Deadline */}
            <UmlClassBox
              stereotype="«AnalysisEntity • Section 6»"
              classNameTitle="MeasurementBar & Deadline"
              headerColor="border-rose-500/50 bg-rose-950/30"
              attributes={[
                '+ id: UUID',
                '+ anchorA: EventAnchor (channelUuid, edgeIdx)',
                '+ anchorB: EventAnchor (channelUuid, edgeIdx)',
                '+ computedDeltaNs: bigint (live reactive)',
                '+ deadlineLimitNs?: bigint',
                '+ strictOperator: "<" | "<="'
              ]}
              methods={[
                '+ recomputeOnTrackEdit(): bigint',
                '+ checkViolation(): PASS | VIOLATION'
              ]}
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 3: EVENT-DRIVEN EVALUATOR & TIE-BREAKING (CORE-030..036)
         ==================================================================== */}
      {activeSubTab === 'EVENT_ENGINE' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">
              Event-Driven Evaluator Pipeline & Coincident-Event Tie Order (CORE-030..036)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              How SignalFlow Studio guarantees mathematical precision independent of screen zoom or frame rate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: 'Step 1',
                title: 'Piecewise Analytical Crossing',
                code: 't_cross = t0 + ((V_th - v0)/(v1 - v0)) * d',
                desc: 'Linear ramps and EXP_RC curves solve threshold crossings analytically in 64-bit ns (CORE-032). Never approximated from canvas pixels.'
              },
              {
                step: 'Step 2',
                title: 'Coincident Priority #1: Sources',
                code: '1. Update all Source States at t',
                desc: 'When multiple events occur at identical timestamp t, primary manual source edges and threshold crossings update first (CORE-033).'
              },
              {
                step: 'Step 3',
                title: 'Coincident Priority #2: DAG Settle',
                code: '2. Settle Combinational Network',
                desc: 'Propagate instantaneous combinational logic (AND/OR/NOT/Thresholds) in topological order before advancing timers.'
              },
              {
                step: 'Step 4',
                title: 'Coincident Priority #3: Timers',
                code: '3. Cancel or Fire Pending Timers',
                desc: 'Inertial delays, QUALIFY filters, and WATCHDOG timers evaluate boundary rules: a valid pulse arriving AT expiry cancels timeout (Section 4.3).'
              }
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                    {item.step}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
                  {item.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 4: CONTEXT COACH STATE MACHINE (Section 2.5 & 5.1)
         ==================================================================== */}
      {activeSubTab === 'COACH_FSM' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">
              Non-Blocking Context Coach State Machine (Section 2.5 & Golden First-Run 2.1)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic offline guidance driven by observed user actions—never modal popups or forced "Next" buttons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                state: '1. first_open',
                trigger: 'App loads 3-row starter',
                hint: '“Drag this edge to change its timing ↔” (anchored to S1 50ms edge)'
              },
              {
                state: '2. edge_moved',
                trigger: 'User drags S1 edge -> S3 follows',
                hint: '“S3 follows S1 (+20ms). Try reshaping the S2 analog ramp.”'
              },
              {
                state: '3. ramp_reshaped',
                trigger: 'User drags S2 slope handle',
                hint: '“Try inserting a track with the embedded + Add Signal button.”'
              },
              {
                state: '4. signal_added',
                trigger: 'User inserts Digital/Analog/Linked',
                hint: '“Select two events to add a live Δt measurement bar.”'
              },
              {
                state: '5. first_measurement',
                trigger: 'User places Δt bar',
                hint: '“Click Export for a meeting-ready Light Report PNG.”'
              },
              {
                state: '6. export',
                trigger: 'User clicks Export',
                hint: 'Onboarding complete! Coach fades quietly.'
              }
            ].map((st, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div>
                  <span className="text-[11px] font-mono font-bold text-cyan-300">
                    {st.state}
                  </span>
                  <div className="text-[11px] text-amber-300 mt-1 font-medium">
                    Trigger: {st.trigger}
                  </div>
                  <p className="text-xs text-slate-300 mt-2 italic">{st.hint}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
                  Non-blocking • Skippable
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for UML Class Box rendering
function UmlClassBox({ stereotype, classNameTitle, headerColor, attributes, methods }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col shadow-md">
      <div className={`p-3 border-b ${headerColor}`}>
        <div className="text-[10px] font-mono text-slate-300">{stereotype}</div>
        <div className="text-sm font-bold font-mono text-white mt-0.5">{classNameTitle}</div>
      </div>
      <div className="p-3 border-b border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300 flex-1">
        {attributes.map((attr, idx) => (
          <div key={idx} className="truncate" title={attr}>
            {attr}
          </div>
        ))}
      </div>
      <div className="p-3 bg-slate-950/60 space-y-1 text-[11px] font-mono text-cyan-300">
        {methods.map((m, idx) => (
          <div key={idx} className="truncate" title={m}>
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: LIGHT-THEME MEETING REPORT PNG EXPORT MODAL (EXP-001..005)
// Renders the entire timing diagram onto a high-DPI light-background HTML5
// Canvas for instant meeting export/download without changing the dark editor.
// ============================================================================
function LightThemeExportModal({ project, evaluatedChannels, onClose, onNotify }) {
  const exportCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1200;
    const rowH = 82;
    const headerH = 74;
    const footerH = 70;
    const H = headerH + evaluatedChannels.length * rowH + footerH;

    canvas.width = W;
    canvas.height = H;

    // High-contrast Light Report Background (EXP-001, EXP-004)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Title Block Header (UI-013)
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillText(project.name, 28, 36);

    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.fillText(
      `SignalFlow Studio v3.0 Engineering Report  |  Timeline: 0 .. ${project.durationMs} ms  |  Deterministic Evaluation`,
      28,
      56
    );

    const leftColW = 260;
    const plotW = W - leftColW - 36;

    // Time Ruler ticks
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = leftColW + (plotW * i) / 10;
      const tVal = (project.durationMs * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, headerH - 10);
      ctx.lineTo(x, H - footerH);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      ctx.fillText(`${tVal}ms`, x - 14, headerH - 14);
    }

    // Draw Each Track Row
    evaluatedChannels.forEach((ch, idx) => {
      const topY = headerH + idx * rowH;
      const padY = 16;
      const uH = rowH - padY * 2;

      // Row divider
      ctx.strokeStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(20, topY);
      ctx.lineTo(W - 20, topY);
      ctx.stroke();

      // Track Label S1..Sn & Name
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(`S${idx + 1}  ${ch.name}`, 28, topY + 32);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(
        ch.mode === 'LOGIC_DRIVEN'
          ? `LINKED: ${formatLogicRuleBadge(ch.logicRule, evaluatedChannels)}`
          : `${ch.domainType} (${ch.minVal}..${ch.maxVal} ${ch.unit})`,
        28,
        topY + 52
      );

      // Plot Waveform (No editing handles or coach cues - EXP-005)
      const kfs = ch.mode === 'LOGIC_DRIVEN' ? ch.computedKeyframes : ch.keyframes;
      if (!kfs || kfs.length === 0) return;
      const sorted = [...kfs].sort((a, b) => a.t - b.t);

      const tToX = (t) => leftColW + (Math.max(0, Math.min(project.durationMs, t)) / project.durationMs) * plotW;
      const vToY = (v) => {
        const min = ch.minVal ?? 0;
        const max = ch.maxVal ?? 1;
        const norm = max > min ? (v - min) / (max - min) : 0;
        return topY + padY + (1 - Math.max(0, Math.min(1, norm))) * uH;
      };

      ctx.strokeStyle = '#0284C7';
      if (ch.domainType === 'ANALOG_RAMP') ctx.strokeStyle = '#D97706';
      if (ch.mode === 'LOGIC_DRIVEN') ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      if (ch.domainType === 'DIGITAL') {
        let curY = vToY(sorted[0].v === 1 ? 1 : 0);
        ctx.moveTo(leftColW, curY);
        sorted.forEach((k) => {
          const x = tToX(k.t);
          const nextY = vToY(k.v === 1 ? 1 : 0);
          ctx.lineTo(x, curY);
          ctx.lineTo(x, nextY);
          curY = nextY;
        });
        ctx.lineTo(leftColW + plotW, curY);
      } else {
        ctx.moveTo(leftColW, vToY(sorted[0].v));
        sorted.forEach((k) => {
          ctx.lineTo(tToX(k.t), vToY(k.v));
        });
        ctx.lineTo(leftColW + plotW, vToY(sorted[sorted.length - 1].v));
      }
      ctx.stroke();
    });
  }, [project, evaluatedChannels]);

  const handleDownloadPng = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.png`;
    a.click();
    onNotify('Downloaded high-contrast Light Report PNG (EXP-001)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              EXP-001..005 • Meeting-Ready Report Export
            </span>
            <h3 className="text-lg font-bold text-white">
              High-Contrast Light PNG Export (Clean Engineering Report)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Per <strong>EXP-004</strong> and <strong>EXP-005</strong>, export automatically renders in a crisp Light Report theme and strips out all interactive drag handles and coach hints—while keeping your workspace in dark mode.
        </p>

        <div className="rounded-xl overflow-hidden border border-slate-700 bg-white p-2 max-h-[60vh] overflow-y-auto">
          <canvas ref={exportCanvasRef} className="w-full h-auto block" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Close Preview
          </button>
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Download Light PNG Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to format human-friendly rule badges (Section 4.1 & 4.3)
function formatLogicRuleBadge(rule, channels) {
  if (!rule) return 'Linked';
  const srcIdx = channels.findIndex((c) => c.uuid === rule.sourceUuid);
  const srcLabel = srcIdx >= 0 ? `S${srcIdx + 1}` : 'Src';

  if (rule.primitive === 'QUALIFY') {
    return `Qualify(${srcLabel}, ${rule.paramA}ms)`;
  }
  if (rule.primitive === 'HYSTERESIS') {
    return `Hyst(${srcLabel}, ${rule.paramA}..${rule.paramB}V)`;
  }
  if (rule.primitive === 'WATCHDOG') {
    return `Watchdog(${srcLabel}, ${rule.paramA}ms)`;
  }
  if (rule.primitive === 'DEADTIME') {
    return `Deadtime(${srcLabel}, ${rule.paramA}ms)`;
  }
  if (rule.primitive === 'JITTER_PROP') {
    return `Jitter(${srcLabel}, -${rule.paramA}/+${rule.paramB}ms)`;
  }
  if (rule.operator === 'THRESHOLD_GE' || rule.kind === 'CONDITION') {
    return `${srcLabel} >= ${rule.thresholdVal} (+${rule.delayMs}ms)`;
  }
  if (rule.operator === 'THRESHOLD_LE') {
    return `${srcLabel} <= ${rule.thresholdVal}`;
  }
  return `Follow(${srcLabel}) +${rule.delayMs}ms`;
}