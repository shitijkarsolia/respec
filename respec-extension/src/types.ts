import * as vscode from 'vscode';
import * as path from 'path';

export interface ParsedSpec {
  requirements: Requirement[];
  design: DesignElement[];
  tasks: Task[];
}

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
  agentName: string;
  severity: 'info' | 'warning' | 'error';
  targetId?: string;
  message: string;
  suggestion?: string;
  accepted: boolean;
}
