import { useState } from "react";
import { Text, TextField, Badge, Select, Button } from "@radix-ui/themes";
import {
  PlusIcon,
  CheckCircledIcon,
  CircleIcon,
  TrashIcon,
  LapTimerIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useTasksStore } from "@/stores/tasks.store";
import type { TaskPriority, TaskStatus } from "@/stores/tasks.store";
import { PRIORITY_CONFIG, STATUS_CONFIG, TASK_FILTER_OPTIONS } from "@/lib/tasks";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { FormActions } from "@/components/ui/FormActions";
import { FilterTabs } from "@/components/ui/FilterTabs";

export function TasksDialog() {
  const closeTasks = useDialogStore((s) => s.closeTasks);
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "560px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <DialogHeader
          title="Tareas"
          badge={
            pendingCount > 0 && (
              <Badge color="orange" variant="soft" size="1">
                {pendingCount} pendientes
              </Badge>
            )
          }
          right={
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
          }
          onClose={closeTasks}
        />

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {/* New task form */}
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
                <FormActions>
                  <Button size="2" variant="soft" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button size="2" onClick={handleAddTask} disabled={!title.trim()}>
                    Crear tarea
                  </Button>
                </FormActions>
              </div>
            </div>
          )}

          {/* Filter */}
          <FilterTabs
            options={TASK_FILTER_OPTIONS}
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ marginBottom: "12px" }}
          />

          {/* Tasks list */}
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
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
                {/* Status toggle */}
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

                {/* Content */}
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
                    <Badge color={PRIORITY_CONFIG[task.priority].color} variant="soft" size="1">
                      {PRIORITY_CONFIG[task.priority].label}
                    </Badge>
                    <Badge color={STATUS_CONFIG[task.status].color} variant="soft" size="1">
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

                {/* Status cycle */}
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
      </div>
    </div>
  );
}
