// Shared types for Respec

export interface Requirement {
  id: string;
  type: 'WHEN' | 'WHILE' | 'WHERE' | 'IF' | 'SHALL';
  trigger: string;
  response: string;
  priority: 'must' | 'should' | 'could';
  status: 'draft' | 'approved' | 'flagged';
  rawText: string;
}

export interface DesignElement {
  id: string;
  type: 'component' | 'api' | 'dataModel' | 'diagram';
  title: string;
  description: string;
  mermaidCode?: string;
  implementsRequirements: string[];
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  implementsRequirements: string[];
  implementsDesign: string[];
  subtasks: string[];
}

export interface ParsedSpec {
  requirements: Requirement[];
  design: DesignElement[];
  tasks: Task[];
}

export interface Annotation {
  id: string;
  targetId: string;
  targetType: 'requirement' | 'design' | 'task';
  action: 'comment' | 'split' | 'remove' | 'clarify';
  content: string;
  author: string;
  timestamp: number;
}

export interface AgentInsight {
  id: string;
  agentName: 'DriftDetector' | 'GapFinder' | 'TestSynthesizer' | 'FeedbackCompiler';
  severity: 'info' | 'warning' | 'error';
  targetId?: string;
  message: string;
  suggestion?: string;
  accepted: boolean;
}

export interface AgentLogEntry {
  id: string;
  agentName: string;
  status: 'thinking' | 'complete' | 'error';
  message: string;
  timestamp: number;
}

export interface CrossLink {
  sourceId: string;
  targetId: string;
  type: 'implements' | 'depends' | 'conflicts';
  strength: number;
}

export type ApprovalStatus = 'pending' | 'approved' | 'changes-requested';
