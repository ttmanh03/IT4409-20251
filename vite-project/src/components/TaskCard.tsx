import React from 'react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
  };
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <div className="task-card">
      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-description">{task.description}</p>}
    </div>
  );
};

export default TaskCard;
