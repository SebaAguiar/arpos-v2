import type { ComponentProps } from "react";
import type { Badge } from "@radix-ui/themes";
import type { TaskPriority, TaskStatus } from "@/stores/tasks.store";

type BadgeColor = ComponentProps<typeof Badge>["color"];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: BadgeColor }> = {
  URGENT: { label: "Urgente", color: "red" },
  HIGH: { label: "Alta", color: "orange" },
  MEDIUM: { label: "Media", color: "yellow" },
  LOW: { label: "Baja", color: "gray" },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: BadgeColor }> = {
  PENDING: { label: "Pendiente", color: "gray" },
  IN_PROGRESS: { label: "En progreso", color: "blue" },
  DONE: { label: "Completada", color: "green" },
};

export type TaskFilter = TaskStatus | "ALL";

export const TASK_FILTER_OPTIONS: Array<{ value: TaskFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "DONE", label: "Completada" },
];