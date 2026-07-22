import { create } from "zustand";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  createdAt: number;
  completedAt: number | null;
}

interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

let nextTaskId = 1;

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],

  addTask: (task) =>
    set((state) => ({
      tasks: [
        {
          ...task,
          id: `task-${nextTaskId++}`,
          createdAt: Math.floor(Date.now() / 1000),
          completedAt: null,
        },
        ...state.tasks,
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  completeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: "DONE" as const, completedAt: Math.floor(Date.now() / 1000) }
          : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
}));

export const selectPendingTasks = (s: TasksState) =>
  s.tasks.filter((t) => t.status !== "DONE");

export const selectTasksByPriority = (s: TasksState) => {
  const order: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...s.tasks].sort((a, b) => order[a.priority] - order[b.priority]);
};
