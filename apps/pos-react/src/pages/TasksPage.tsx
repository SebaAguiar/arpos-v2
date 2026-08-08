import { useState } from "react";
import { Text, TextField, Badge, Select } from "@radix-ui/themes";
import {
  PlusIcon,
  CheckCircledIcon,
  CircleIcon,
  TrashIcon,
  LapTimerIcon,
} from "@radix-ui/react-icons";
import { useTasksStore } from "@/stores/tasks.store";
import type { TaskPriority, TaskStatus } from "@/stores/tasks.store";

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  URGENT: { label: "Urgente", color: "red" },
  HIGH: { label: "Alta", color: "orange" },
  MEDIUM: { label: "Media", color: "yellow" },
  LOW: { label: "Baja", color: "gray" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "gray" },
  IN_PROGRESS: { label: "En progreso", color: "blue" },
  DONE: { label: "Completada", color: "green" },
};

export function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const completeTask = useTasksStore((s) => s.completeTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assignee, setAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");

  const filteredTasks = tasks.filter(
    (t) => filterStatus === "ALL" || t.status === filterStatus
  );

  const pendingCount = tasks.filter((t) => t.status !== "DONE").length;

  const handleAddTask = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "PENDING",
      assignee: assignee.trim() || "Sin asignar",
    });
    setTitle("");
    setDescription("");
    setAssignee("");
    setPriority("MEDIUM");
    setShowForm(false);
  };

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Text size="5" weight="bold">Tareas</Text>
          {pendingCount > 0 && (
            <Badge color="orange" variant="soft" size="1">
              {pendingCount} pendientes
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "6px 12px",
            backgroundColor: showForm ? "var(--bg-surface)" : "var(--accent)",
            color: showForm ? "var(--text-secondary)" : "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <PlusIcon width={14} height={14} />
          Nueva tarea
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: "14px",
            backgroundColor: "var(--bg-surface-hover)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            marginBottom: "16px",
          }}
        >
          <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
            Nueva tarea
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <TextField.Root
              placeholder="Título de la tarea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <TextField.Root
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <Select.Root value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <Select.Trigger style={{ flex: 1 }} />
                <Select.Content position="popper">
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <Select.Item key={key} value={key}>{cfg.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <TextField.Root
                placeholder="Asignar a..."
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "6px 14px",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTask}
                disabled={!title.trim()}
                style={{
                  padding: "6px 14px",
                  backgroundColor: title.trim() ? "var(--accent)" : "var(--bg-surface)",
                  color: title.trim() ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: title.trim() ? "pointer" : "not-allowed",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Crear tarea
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
        {(["ALL", "PENDING", "IN_PROGRESS", "DONE"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "4px 10px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              backgroundColor: filterStatus === status ? "var(--bg-surface-hover)" : "transparent",
              color: filterStatus === status ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: filterStatus === status ? 600 : 400,
            }}
          >
            {status === "ALL" ? "Todas" : STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
          <LapTimerIcon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
          <Text size="2" color="gray">
            {filterStatus === "ALL" ? "No hay tareas" : `No hay tareas ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()}`}
          </Text>
        </div>
      ) : (
        filteredTasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              marginBottom: "6px",
              opacity: task.status === "DONE" ? 0.5 : 1,
            }}
          >
            <button
              onClick={() =>
                task.status === "DONE"
                  ? updateTask(task.id, { status: "PENDING", completedAt: null })
                  : completeTask(task.id)
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: task.status === "DONE" ? "#30a46c" : "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {task.status === "DONE" ? (
                <CheckCircledIcon width={18} height={18} />
              ) : (
                <CircleIcon width={18} height={18} />
              )}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    textDecoration: task.status === "DONE" ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </Text>
                <Badge color={PRIORITY_CONFIG[task.priority].color as "red" | "orange" | "yellow" | "gray"} variant="soft" size="1">
                  {PRIORITY_CONFIG[task.priority].label}
                </Badge>
                <Badge color={STATUS_CONFIG[task.status].color as "gray" | "blue" | "green"} variant="soft" size="1">
                  {STATUS_CONFIG[task.status].label}
                </Badge>
              </div>
              {task.description && (
                <Text size="1" color="gray" style={{ display: "block", marginBottom: "2px" }}>
                  {task.description}
                </Text>
              )}
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {task.assignee} • {new Date(task.createdAt * 1000).toLocaleDateString("es-AR")}
              </div>
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              {task.status === "PENDING" && (
                <button
                  onClick={() => updateTask(task.id, { status: "IN_PROGRESS" })}
                  style={{
                    padding: "2px 8px",
                    border: "1px solid #3b82f6",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  Iniciar
                </button>
              )}
              {task.status === "IN_PROGRESS" && (
                <button
                  onClick={() => completeTask(task.id)}
                  style={{
                    padding: "2px 8px",
                    border: "1px solid #30a46c",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    color: "#30a46c",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  Completar
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  padding: "2px 6px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--accent)",
                  cursor: "pointer",
                }}
              >
                <TrashIcon width={14} height={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
