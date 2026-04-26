import { create } from 'zustand';
import type {
  ParsedSpec,
  Annotation,
  AgentInsight,
  AgentLogEntry,
  ApprovalStatus,
} from './types';

interface RespecState {
  // Spec data
  spec: ParsedSpec | null;
  rawMarkdown: { requirements: string; design: string; tasks: string } | null;

  // Annotations
  annotations: Record<string, Annotation[]>;

  // Agent state
  agentActivity: AgentLogEntry[];
  insights: AgentInsight[];

  // UI state
  approvalStatus: ApprovalStatus;
  railOpen: boolean;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  isStreaming: boolean;

  // Actions
  setSpec: (spec: ParsedSpec) => void;
  setRawMarkdown: (raw: { requirements: string; design: string; tasks: string }) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (targetId: string, annotationId: string) => void;
  clearAnnotations: () => void;
  setInsights: (insights: AgentInsight[]) => void;
  addInsight: (insight: AgentInsight) => void;
  acceptInsight: (id: string) => void;
  dismissInsight: (id: string) => void;
  addAgentLog: (entry: AgentLogEntry) => void;
  updateAgentLog: (id: string, updates: Partial<AgentLogEntry>) => void;
  setApprovalStatus: (status: ApprovalStatus) => void;
  setRailOpen: (open: boolean) => void;
  setHoveredNodeId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  approve: () => void;
  requestChanges: () => void;
  reset: () => void;
}

const initialState = {
  spec: null,
  rawMarkdown: null,
  annotations: {} as Record<string, Annotation[]>,
  agentActivity: [] as AgentLogEntry[],
  insights: [] as AgentInsight[],
  approvalStatus: 'pending' as ApprovalStatus,
  railOpen: true,
  hoveredNodeId: null as string | null,
  selectedNodeId: null as string | null,
  isStreaming: false,
};

export const useRespecStore = create<RespecState>((set, get) => ({
  ...initialState,

  setSpec: (spec) => set({ spec }),

  setRawMarkdown: (raw) => set({ rawMarkdown: raw }),

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

  setInsights: (insights) => set({ insights }),

  addInsight: (insight) =>
    set((state) => ({ insights: [...state.insights, insight] })),

  acceptInsight: (id) =>
    set((state) => {
      const insight = state.insights.find((i) => i.id === id);
      if (!insight || !state.spec) {
        return {
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, accepted: true } : i
          ),
        };
      }

      const index = state.spec.requirements.length + 1;
      const newRequirement: import('./types').Requirement = {
        id: `FR-99.${index}`,
        type: 'SHALL',
        trigger: '',
        response: insight.suggestion ?? insight.message,
        priority: 'should',
        status: 'draft',
        rawText: insight.suggestion ?? insight.message,
      };

      return {
        insights: state.insights.map((i) =>
          i.id === id ? { ...i, accepted: true } : i
        ),
        spec: {
          ...state.spec,
          requirements: [...state.spec.requirements, newRequirement],
        },
      };
    }),

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
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  approve: () => {
    set({
      approvalStatus: 'approved',
      annotations: {},
    });
  },

  requestChanges: () => {
    set({ approvalStatus: 'changes-requested' });
  },

  reset: () => set(initialState),
}));

// Selector helpers
const EMPTY_ANNOTATIONS: import('./types').Annotation[] = [];

export const useAnnotationsForTarget = (targetId: string) =>
  useRespecStore((state) => state.annotations[targetId] ?? EMPTY_ANNOTATIONS);

export const useAnnotationCount = () =>
  useRespecStore((state) =>
    Object.values(state.annotations).reduce((sum, arr) => sum + arr.length, 0)
  );

export const usePendingInsightCount = () =>
  useRespecStore((state) =>
    state.insights.filter((i) => !i.accepted).length
  );
