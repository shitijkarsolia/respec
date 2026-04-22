import type { ParsedSpec, CrossLink } from './types';

/**
 * Compute cross-links between requirements, design elements, and tasks.
 * Returns edges that can be rendered as React Flow connections.
 */
export function computeCrossLinks(spec: ParsedSpec): CrossLink[] {
  const links: CrossLink[] = [];
  const reqIds = new Set(spec.requirements.map((r) => r.id));

  // Design → Requirements (implements)
  for (const design of spec.design) {
    for (const reqId of design.implementsRequirements) {
      if (reqIds.has(reqId)) {
        links.push({
          sourceId: reqId,
          targetId: design.id,
          type: 'implements',
          strength: 0.8,
        });
      }
    }
  }

  // Tasks → Requirements (implements)
  for (const task of spec.tasks) {
    for (const reqId of task.implementsRequirements) {
      if (reqIds.has(reqId)) {
        links.push({
          sourceId: reqId,
          targetId: task.id,
          type: 'implements',
          strength: 1.0,
        });
      }
    }
  }

  // Tasks → Design (depends)
  for (const task of spec.tasks) {
    for (const designId of task.implementsDesign) {
      const designExists = spec.design.some((d) => d.id === designId);
      if (designExists) {
        links.push({
          sourceId: designId,
          targetId: task.id,
          type: 'depends',
          strength: 0.6,
        });
      }
    }
  }

  return links;
}

/**
 * Find all links connected to a specific node (for hover highlighting).
 */
export function getLinksForNode(
  links: CrossLink[],
  nodeId: string
): CrossLink[] {
  return links.filter(
    (link) => link.sourceId === nodeId || link.targetId === nodeId
  );
}

/**
 * Get all node IDs connected to a specific node.
 */
export function getConnectedNodeIds(
  links: CrossLink[],
  nodeId: string
): Set<string> {
  const connected = new Set<string>();
  for (const link of links) {
    if (link.sourceId === nodeId) connected.add(link.targetId);
    if (link.targetId === nodeId) connected.add(link.sourceId);
  }
  return connected;
}

/**
 * Find orphaned requirements (not referenced by any task or design element).
 */
export function findOrphanedRequirements(spec: ParsedSpec): string[] {
  const referenced = new Set<string>();

  for (const design of spec.design) {
    for (const reqId of design.implementsRequirements) {
      referenced.add(reqId);
    }
  }

  for (const task of spec.tasks) {
    for (const reqId of task.implementsRequirements) {
      referenced.add(reqId);
    }
  }

  return spec.requirements
    .filter((r) => !referenced.has(r.id))
    .map((r) => r.id);
}

/**
 * Find unlinked tasks (not referencing any requirement).
 */
export function findUnlinkedTasks(spec: ParsedSpec): string[] {
  return spec.tasks
    .filter((t) => t.implementsRequirements.length === 0)
    .map((t) => t.id);
}
