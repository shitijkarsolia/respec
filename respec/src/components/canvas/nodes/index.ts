import { EarsCard } from './EarsCard';
import { DesignCard } from './DesignCard';
import { TaskCard } from './TaskCard';
import { AgentInsightCard } from './AgentInsightCard';
import { ColumnHeader } from './ColumnHeader';

export const nodeTypes = {
  ears: EarsCard,
  design: DesignCard,
  task: TaskCard,
  insight: AgentInsightCard,
  columnHeader: ColumnHeader,
};

export { EarsCard, DesignCard, TaskCard, AgentInsightCard, ColumnHeader };
