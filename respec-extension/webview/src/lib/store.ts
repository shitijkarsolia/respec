import { create } from 'zustand';
import type { Annotation, AgentInsight, AgentLogEntry, ParsedSpec } from './types';

type ApprovalStatus = 'pending' | 'approved' | 'changes-requested';

const EMPTY_ANNOTATIONS: Annotation[] = [];

interface RespecState {
  spec: ParsedSpec | null;
  annotations: Record<string, Annotation[]>;
  agentActivity: AgentLogEntry[];
  insights: AgentInsight[];
  approvalStatus: ApprovalStatus;
  railOpen: boolean;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;

  setSpec: (spec: ParsedSpec) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (targetId: string, annotationId: string) => void;
  clearAnnotations: () => void;
  addInsight: (insight: AgentInsight) => void;
  setInsights: (insights: AgentInsight[]) => void;
  acceptInsight: (id: string) => void;
  dismissInsight: (id: string) => void;
  addAgentLog: (entry: AgentLogEntry) => void;
  updateAgentLog: (id: string, updates: Partial<AgentLogEntry>) => void;
  setApprovalStatus: (status: ApprovalStatus) => void;
  setRailOpen: (open: boolean) => void;
  setHoveredNodeId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  approve: () => void;
  requestChanges: () => void;
}

export const useRespecStore = create<RespecState>((set) => ({
  spec: null,
  annotations: {},
  agentActivity: [],
  insights: [],
  approvalStatus: 'pending',
  railOpen: true,
  hoveredNodeId: null,
  selectedNodeId: null,

  setSpec: (spec) => set({ spec }),

  addAnnotation: (annotation) =>
    set((state) => {
      const existing = state.annotations[annotation.targetId] || [];
      return {
        annotations: {
          ...state.annotations,
          [annotation.targetId]: [...existing, annotation],
        },
      };
    }),

  removeAnnotation: (targetId, annotationId) =>
    set((state) => {
      const existing = state.annotations[targetId] || [];
      return {
        annotations: {
          ...state.annotations,
          [targetId]: existing.filter((a) => a.id !== annotationId),
        },
      };
    }),

  clearAnnotations: () => set({ annotations: {} }),

  addInsight: (insight) =>
    set((state) => ({ insights: [...state.insights, insight] })),

  setInsights: (insights) => set({ insights }),

  acceptInsight: (id) =>
    set((state) => ({
      insights: state.insights.map((i) =>
        i.id === id ? { ...i, accepted: true } : i
      ),
    })),

  dismissInsight: (id) =>
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    })),

  addAgentLog: (entry) =>
    set((state) => ({
      agentActivity: [entry, ...state.agentActivity],
    })),

  updateAgentLog: (id, updates) =>
    set((state) => ({
      agentActivity: state.agentActivity.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  setApprovalStatus: (status) => set({ approvalStatus: status }),
  setRailOpen: (open) => set({ railOpen: open }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  approve: () => set({ approvalStatus: 'approved', annotations: {} }),
  requestChanges: () => set({ approvalStatus: 'changes-requested' }),
}));

export const useAnnotationsForTarget = (targetId: string) =>
  useRespecStore((state) => state.annotations[targetId] ?? EMPTY_ANNOTATIONS);

export const useAnnotationCount = () =>
  useRespecStore((state) =>
    Object.values(state.annotations).reduce((sum, arr) => sum + arr.length, 0)
  );
