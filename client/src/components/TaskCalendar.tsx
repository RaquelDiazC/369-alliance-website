/**
 * TaskCalendar — Comprehensive Task & Calendar Management
 * Design: 369 Alliance Gold/Navy color scheme
 * Features: Kanban, List, Calendar (Month/Week/Day), Task Detail, Projects, LocalStorage
 * Inspired by ProFlow / monday.com / ClickUp
 */
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "urgent" | "high" | "medium" | "low" | "none";
type TaskStatus = "inbox" | "todo" | "in_progress" | "in_review" | "done";
type CalView = "month" | "week" | "day" | "agenda";
type MainView = "kanban" | "list" | "calendar" | "inbox" | "dashboard";
type EventColor = "blue" | "green" | "red" | "orange" | "purple" | "gold";

interface Subtask { id: string; title: string; done: boolean; }
interface TaskComment { id: string; author: string; avatar: string; text: string; createdAt: string; type: "comment" | "activity"; }

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  labels: string[];
  dueDate?: string;
  dueTime?: string;
  assignee?: string;
  project?: string;
  createdAt: string;
  completedAt?: string;
  subtasks?: Subtask[];
  comments?: TaskComment[];
  blockedBy?: string[];
  reminder?: string;
}

interface CalEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color: EventColor;
  description?: string;
  location?: string;
  taskId?: string;
  allDay?: boolean;
  recurrence?: { frequency: "daily" | "weekly" | "monthly"; interval?: number; endDate?: string; };
  recurringId?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const DEFAULT_PROJECTS: Project[] = [
  { id: "p1", name: "Inspections", color: "#1a3a6b", description: "All inspection-related tasks" },
  { id: "p2", name: "Compliance", color: "#7A6342", description: "Compliance and certification work" },
  { id: "p3", name: "Client Work", color: "#2d6a4f", description: "Client-facing deliverables" },
  { id: "p4", name: "Internal", color: "#6b21a8", description: "Internal admin and operations" },
];

const DEFAULT_LABELS: Label[] = [
  { id: "l1", name: "Urgent", color: "#dc2626" },
  { id: "l2", name: "Review", color: "#d97706" },
  { id: "l3", name: "Blocked", color: "#9ca3af" },
  { id: "l4", name: "Client", color: "#0057A8" },
  { id: "l5", name: "Compliance", color: "#7A6342" },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const DEFAULT_TASKS: Task[] = [
  { id: "t1", title: "Review SEPP compliance report", description: "Check all items against current SEPP 2008 requirements", status: "in_progress", priority: "high", labels: ["l5"], dueDate: fmt(addDays(today, 2)), project: "p2", createdAt: fmt(addDays(today, -3)), subtasks: [{ id: "s1", title: "Review Section 3", done: true }, { id: "s2", title: "Review Section 7", done: false }], comments: [{ id: "c1", author: "Admin", avatar: "AD", text: "Started review — flagging Section 7 for follow-up.", createdAt: new Date(Date.now() - 86400000).toISOString(), type: "comment" }] },
  { id: "t2", title: "Schedule OC inspection for 45 Smith St", description: "Coordinate with certifier and builder for final OC inspection", status: "todo", priority: "urgent", labels: ["l1", "l4"], dueDate: fmt(addDays(today, 1)), project: "p1", createdAt: fmt(addDays(today, -1)), subtasks: [], comments: [] },
  { id: "t3", title: "Prepare DBP Act compliance checklist", status: "todo", priority: "medium", labels: ["l5"], dueDate: fmt(addDays(today, 5)), project: "p2", createdAt: fmt(today), subtasks: [], comments: [] },
  { id: "t4", title: "Upload iAuditor report — 12 Park Ave", status: "in_review", priority: "high", labels: ["l2"], dueDate: fmt(today), project: "p1", createdAt: fmt(addDays(today, -2)), subtasks: [], comments: [] },
  { id: "t5", title: "Send defect notice to builder", status: "inbox", priority: "low", labels: [], dueDate: fmt(addDays(today, 7)), project: "p3", createdAt: fmt(today), subtasks: [], comments: [] },
  { id: "t6", title: "Update team training records", status: "done", priority: "none", labels: [], completedAt: fmt(addDays(today, -1)), project: "p4", createdAt: fmt(addDays(today, -5)), subtasks: [], comments: [] },
  { id: "t7", title: "Prepare monthly inspection summary", status: "inbox", priority: "medium", labels: ["l4"], dueDate: fmt(addDays(today, 10)), project: "p1", createdAt: fmt(today), subtasks: [], comments: [] },
];

const DEFAULT_EVENTS: CalEvent[] = [
  { id: "e1", title: "OC Inspection — 45 Smith St", date: fmt(addDays(today, 1)), startTime: "09:00", endTime: "11:00", color: "blue", description: "Final OC inspection with certifier", location: "45 Smith St, Sydney", taskId: "t2" },
  { id: "e2", title: "Team Weekly Standup", date: fmt(today), startTime: "09:00", endTime: "09:30", color: "gold", recurrence: { frequency: "weekly", interval: 1 } },
  { id: "e3", title: "DBP Compliance Review", date: fmt(addDays(today, 3)), startTime: "14:00", endTime: "15:30", color: "purple", description: "Internal review of DBP Act compliance status" },
  { id: "e4", title: "Client Meeting — Park Ave Project", date: fmt(addDays(today, 5)), startTime: "10:00", endTime: "11:00", color: "green", location: "Zoom" },
  { id: "e5", title: "Report Submission Deadline", date: fmt(addDays(today, 7)), allDay: true, color: "red", description: "Monthly inspection report due to council" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const nanoid = () => Math.random().toString(36).slice(2, 10);

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#dc2626", bg: "#fef2f2" },
  high:   { label: "High",   color: "#d97706", bg: "#fffbeb" },
  medium: { label: "Medium", color: "#ca8a04", bg: "#fefce8" },
  low:    { label: "Low",    color: "#059669", bg: "#f0fdf4" },
  none:   { label: "None",   color: "#9ca3af", bg: "#f9fafb" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  inbox:       { label: "Inbox",       color: "#6b7280", bg: "#f3f4f6" },
  todo:        { label: "To Do",       color: "#1a3a6b", bg: "#eff6ff" },
  in_progress: { label: "In Progress", color: "#7A6342", bg: "#fef3c7" },
  in_review:   { label: "In Review",   color: "#6b21a8", bg: "#f5f3ff" },
  done:        { label: "Done",        color: "#059669", bg: "#f0fdf4" },
};

const EVENT_COLORS: Record<EventColor, string> = {
  blue:   "#1a3a6b",
  green:  "#2d6a4f",
  red:    "#dc2626",
  orange: "#d97706",
  purple: "#6b21a8",
  gold:   "#7A6342",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function expandRecurring(events: CalEvent[], rangeStart: Date, rangeEnd: Date): CalEvent[] {
  const result: CalEvent[] = [];
  for (const ev of events) {
    if (!ev.recurrence) { result.push(ev); continue; }
    const { frequency, interval = 1, endDate } = ev.recurrence;
    const base = new Date(ev.date + "T00:00:00");
    let cur = new Date(base);
    const limit = endDate ? new Date(endDate + "T00:00:00") : rangeEnd;
    while (cur <= rangeEnd && cur <= limit) {
      if (cur >= rangeStart) {
        result.push({ ...ev, id: `${ev.id}_${localDateStr(cur)}`, date: localDateStr(cur), recurringId: ev.id, recurrence: undefined });
      }
      if (frequency === "daily") cur.setDate(cur.getDate() + interval);
      else if (frequency === "weekly") cur.setDate(cur.getDate() + 7 * interval);
      else { cur.setMonth(cur.getMonth() + interval); }
      if (cur.getTime() === base.getTime()) break;
    }
  }
  return result;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = { tasks: "tc_tasks_v1", events: "tc_events_v1", projects: "tc_projects_v1" };

function loadStorage<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveStorage(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

function Avatar({ initials, color = "#1a3a6b" }: { initials: string; color?: string }) {
  return (
    <div style={{ width: 24, height: 24, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, projects, labels, onSelect, onDragStart }: {
  task: Task; projects: Project[]; labels: Label[];
  onSelect: () => void; onDragStart: (id: string) => void;
}) {
  const project = projects.find(p => p.id === task.project);
  const taskLabels = labels.filter(l => task.labels.includes(l.id));
  const doneSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const isOverdue = task.dueDate && task.dueDate < fmt(today) && task.status !== "done";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onClick={onSelect}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
        padding: "10px 12px", cursor: "pointer", marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.15s, transform 0.15s",
        borderLeft: `3px solid ${PRIORITY_CONFIG[task.priority].color}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {project && (
        <div style={{ fontSize: 10, color: project.color, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: project.color, display: "inline-block" }} />
          {project.name}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", lineHeight: 1.4, marginBottom: 6 }}>{task.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: taskLabels.length > 0 ? 6 : 0 }}>
        {taskLabels.map(l => (
          <span key={l.id} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: l.color + "20", color: l.color, fontWeight: 600 }}>{l.name}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PriorityBadge priority={task.priority} />
          {totalSubtasks > 0 && (
            <span style={{ fontSize: 10, color: "#9ca3af" }}>✓ {doneSubtasks}/{totalSubtasks}</span>
          )}
        </div>
        {task.dueDate && (
          <span style={{ fontSize: 10, color: isOverdue ? "#dc2626" : "#6b7280", fontWeight: isOverdue ? 700 : 400 }}>
            {isOverdue ? "⚠ " : ""}{task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, projects, labels, onSelectTask, onDragStart, onDrop, onAddTask }: {
  status: TaskStatus; tasks: Task[]; projects: Project[]; labels: Label[];
  onSelectTask: (id: string) => void; onDragStart: (id: string) => void;
  onDrop: (status: TaskStatus) => void; onAddTask: (status: TaskStatus) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const colTasks = tasks.filter(t => t.status === status);

  return (
    <div
      style={{ flex: "0 0 220px", minWidth: 220, display: "flex", flexDirection: "column" }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(status); }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 10, padding: "1px 7px" }}>{colTasks.length}</span>
        </div>
        <button onClick={() => onAddTask(status)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, padding: "0 2px" }} title="Add task">+</button>
      </div>
      <div style={{
        flex: 1, minHeight: 100, padding: "6px 4px", borderRadius: 8,
        background: dragOver ? "#eff6ff" : "#f8f9fa",
        border: dragOver ? "2px dashed #1a3a6b" : "2px dashed transparent",
        transition: "all 0.15s",
      }}>
        {colTasks.map(task => (
          <TaskCard key={task.id} task={task} projects={projects} labels={labels}
            onSelect={() => onSelectTask(task.id)} onDragStart={onDragStart} />
        ))}
        {colTasks.length === 0 && (
          <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 12, padding: "20px 0" }}>No tasks</div>
        )}
      </div>
    </div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetailPanel({ task, tasks, projects, labels, onUpdate, onDelete, onClose }: {
  task: Task; tasks: Task[]; projects: Project[]; labels: Label[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void; onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const [newSubtask, setNewSubtask] = useState("");

  const addComment = () => {
    if (!comment.trim()) return;
    const c: TaskComment = { id: nanoid(), author: "Admin", avatar: "AD", text: comment.trim(), createdAt: new Date().toISOString(), type: "comment" };
    onUpdate(task.id, { comments: [...(task.comments ?? []), c] });
    setComment("");
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    onUpdate(task.id, { subtasks: [...(task.subtasks ?? []), { id: nanoid(), title: newSubtask.trim(), done: false }] });
    setNewSubtask("");
  };

  const toggleSubtask = (sid: string) => {
    onUpdate(task.id, { subtasks: (task.subtasks ?? []).map(s => s.id === sid ? { ...s, done: !s.done } : s) });
  };

  return (
    <div style={{ width: 380, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#1a1a2e,#252545)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#A68A64" }}>Task Detail</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12, padding: "4px 8px", borderRadius: 4 }}>Delete</button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Title */}
        <textarea value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => onUpdate(task.id, { title: editTitle })}
          style={{ width: "100%", fontSize: 15, fontWeight: 700, color: "#1a1a2e", border: "none", resize: "none", outline: "none", background: "transparent", lineHeight: 1.4, marginBottom: 12, fontFamily: "inherit" }} rows={2} />

        {/* Status & Priority row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select value={task.status} onChange={e => onUpdate(task.id, { status: e.target.value as TaskStatus })}
            style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", color: STATUS_CONFIG[task.status].color, fontWeight: 600 }}>
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <select value={task.priority} onChange={e => onUpdate(task.id, { priority: e.target.value as Priority })}
            style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", color: PRIORITY_CONFIG[task.priority].color, fontWeight: 600 }}>
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
          </select>
        </div>

        {/* Due date */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Due Date</label>
          <input type="date" value={task.dueDate ?? ""} onChange={e => onUpdate(task.id, { dueDate: e.target.value })}
            style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
        </div>

        {/* Project */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Project</label>
          <select value={task.project ?? ""} onChange={e => onUpdate(task.id, { project: e.target.value || undefined })}
            style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Assignee */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Assignee</label>
          <input type="text" value={task.assignee ?? ""} onChange={e => onUpdate(task.id, { assignee: e.target.value })}
            placeholder="Enter name..." style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
        </div>

        {/* Labels */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Labels</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {labels.map(l => {
              const active = task.labels.includes(l.id);
              return (
                <button key={l.id} onClick={() => onUpdate(task.id, { labels: active ? task.labels.filter(x => x !== l.id) : [...task.labels, l.id] })}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, border: `1px solid ${l.color}`, background: active ? l.color : "transparent", color: active ? "#fff" : l.color, cursor: "pointer", fontWeight: 600 }}>
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Description</label>
          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} onBlur={() => onUpdate(task.id, { description: editDesc })}
            placeholder="Add description..." rows={3}
            style={{ width: "100%", fontSize: 12, padding: "8px", borderRadius: 6, border: "1px solid #e5e7eb", resize: "vertical", fontFamily: "inherit" }} />
        </div>

        {/* Subtasks */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
            Subtasks {task.subtasks && task.subtasks.length > 0 && `(${task.subtasks.filter(s=>s.done).length}/${task.subtasks.length})`}
          </label>
          {task.subtasks?.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(s.id)} style={{ cursor: "pointer" }} />
              <span style={{ fontSize: 12, color: s.done ? "#9ca3af" : "#1a1a2e", textDecoration: s.done ? "line-through" : "none" }}>{s.title}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === "Enter" && addSubtask()}
              placeholder="Add subtask..." style={{ flex: 1, fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
            <button onClick={addSubtask} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, background: "#1a3a6b", color: "#fff", border: "none", cursor: "pointer" }}>+</button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Comments & Activity</label>
          {(task.comments ?? []).map(c => (
            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Avatar initials={c.avatar} color={c.type === "activity" ? "#9ca3af" : "#1a3a6b"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                  <strong style={{ color: "#1a1a2e" }}>{c.author}</strong> · {new Date(c.createdAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 12, color: c.type === "activity" ? "#9ca3af" : "#374151", fontStyle: c.type === "activity" ? "italic" : "normal" }}>{c.text}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()}
              placeholder="Add a comment..." style={{ flex: 1, fontSize: 12, padding: "7px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
            <button onClick={addComment} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 6, background: "#7A6342", color: "#fff", border: "none", cursor: "pointer" }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Task Modal ───────────────────────────────────────────────────────────

function NewTaskModal({ projects, defaultStatus, onAdd, onClose }: {
  projects: Project[]; defaultStatus: TaskStatus;
  onAdd: (task: Omit<Task, "id" | "createdAt">) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), status, priority, labels: [], dueDate: dueDate || undefined, project: project || undefined, description: description || undefined, subtasks: [], comments: [] });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: 480, maxWidth: "95vw", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#1a1a2e,#252545)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#A68A64", fontSize: 15 }}>New Task</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Task title..." style={{ fontSize: 14, padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: 600 }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)..." rows={2}
            style={{ fontSize: 13, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", resize: "none", fontFamily: "inherit" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>STATUS</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>PRIORITY</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>DUE DATE</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>PROJECT</label>
              <select value={project} onChange={e => setProject(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg,#1a3a6b,#1a1a2e)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>Create Task</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Event Modal ──────────────────────────────────────────────────────────

function NewEventModal({ defaultDate, onAdd, onClose }: {
  defaultDate: string;
  onAdd: (ev: Omit<CalEvent, "id">) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<EventColor>("blue");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recFreq, setRecFreq] = useState<"daily"|"weekly"|"monthly">("weekly");
  const [recEnd, setRecEnd] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(), date, startTime: allDay ? undefined : startTime, endTime: allDay ? undefined : endTime,
      color, description: description || undefined, location: location || undefined, allDay,
      recurrence: recurring ? { frequency: recFreq, interval: 1, endDate: recEnd || undefined } : undefined,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: 500, maxWidth: "95vw", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#1a1a2e,#252545)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#A68A64", fontSize: 15 }}>New Event</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, maxHeight: "75vh", overflowY: "auto" }}>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Event title..." style={{ fontSize: 14, padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontWeight: 600 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>DATE</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ marginRight: 6 }} />All Day
              </label>
            </div>
            {!allDay && <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>START</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>END</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
              </div>
            </>}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>COLOUR</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.keys(EVENT_COLORS) as EventColor[]).map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: EVENT_COLORS[c], border: color === c ? "3px solid #1a1a2e" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" style={{ fontSize: 12, padding: "7px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            style={{ fontSize: 12, padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", resize: "none", fontFamily: "inherit" }} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />Recurring event
            </label>
            {recurring && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <select value={recFreq} onChange={e => setRecFreq(e.target.value as "daily"|"weekly"|"monthly")} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input type="date" value={recEnd} onChange={e => setRecEnd(e.target.value)} placeholder="End date" style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>Create Event</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Month View ──────────────────────────────────────────────────────

function MonthView({ year, month, events, tasks, onDayClick, onEventClick, onDrop }: {
  year: number; month: number;
  events: CalEvent[]; tasks: Task[];
  onDayClick: (date: string) => void;
  onEventClick: (ev: CalEvent) => void;
  onDrop: (taskId: string, date: string) => void;
}) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 0);
  const expanded = expandRecurring(events, rangeStart, rangeEnd);
  const todayStr = localDateStr(today);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #e5e7eb" }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ minHeight: 90, background: "#fafafa", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }} />;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = expanded.filter(e => e.date === dateStr);
          const isToday = dateStr === todayStr;
          const isDragOver = dragOverDate === dateStr;
          return (
            <div key={i}
              style={{ minHeight: 90, padding: "4px 6px", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: isDragOver ? "#eff6ff" : isToday ? "#fef9f0" : "#fff", transition: "background 0.1s" }}
              onClick={() => onDayClick(dateStr)}
              onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => { e.preventDefault(); const tid = e.dataTransfer.getData("taskId"); if (tid) onDrop(tid, dateStr); setDragOverDate(null); }}
            >
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : "#374151", background: isToday ? "#1a3a6b" : "transparent", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>{day}</div>
              {dayEvents.slice(0, 3).map(ev => (
                <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                  style={{ fontSize: 10, padding: "2px 5px", borderRadius: 3, background: EVENT_COLORS[ev.color] + "20", color: EVENT_COLORS[ev.color], fontWeight: 600, marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", cursor: "pointer" }}>
                  {ev.startTime && `${ev.startTime} `}{ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && <div style={{ fontSize: 10, color: "#9ca3af" }}>+{dayEvents.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar Week View ───────────────────────────────────────────────────────

function WeekView({ weekStart, events, onEventClick, onSlotClick }: {
  weekStart: Date; events: CalEvent[];
  onEventClick: (ev: CalEvent) => void;
  onSlotClick: (date: string, time: string) => void;
}) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00–22:00
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeStart = weekStart;
  const rangeEnd = addDays(weekStart, 6);
  const expanded = expandRecurring(events, rangeStart, rangeEnd);
  const todayStr = localDateStr(today);

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "50px repeat(7,1fr)", borderBottom: "2px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
        <div />
        {days.map(d => {
          const ds = localDateStr(d);
          const isToday = ds === todayStr;
          return (
            <div key={ds} style={{ padding: "8px 4px", textAlign: "center", borderLeft: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>{DAYS_SHORT[d.getDay()]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? "#fff" : "#1a1a2e", background: isToday ? "#1a3a6b" : "transparent", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0" }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Time grid */}
      <div style={{ display: "grid", gridTemplateColumns: "50px repeat(7,1fr)", flex: 1 }}>
        {hours.map(h => (
          <>
            <div key={`h${h}`} style={{ padding: "0 6px", textAlign: "right", fontSize: 10, color: "#9ca3af", paddingTop: 4, borderBottom: "1px solid #f3f4f6" }}>{String(h).padStart(2,"0")}:00</div>
            {days.map(d => {
              const ds = localDateStr(d);
              const slotEvents = expanded.filter(e => e.date === ds && e.startTime && parseInt(e.startTime.split(":")[0]) === h);
              return (
                <div key={`${ds}-${h}`} style={{ borderLeft: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", minHeight: 40, padding: "2px", cursor: "pointer", position: "relative" }}
                  onClick={() => onSlotClick(ds, `${String(h).padStart(2,"0")}:00`)}>
                  {slotEvents.map(ev => (
                    <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      style={{ fontSize: 10, padding: "3px 5px", borderRadius: 4, background: EVENT_COLORS[ev.color], color: "#fff", fontWeight: 600, marginBottom: 2, cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {ev.startTime} {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ─── Agenda View ──────────────────────────────────────────────────────────────

function AgendaView({ events, tasks, onEventClick, onTaskClick }: {
  events: CalEvent[]; tasks: Task[];
  onEventClick: (ev: CalEvent) => void;
  onTaskClick: (id: string) => void;
}) {
  const rangeStart = today;
  const rangeEnd = addDays(today, 30);
  const expanded = expandRecurring(events, rangeStart, rangeEnd);

  const days: string[] = [];
  for (let d = new Date(rangeStart); d <= rangeEnd; d = addDays(d, 1)) {
    const ds = localDateStr(d);
    const hasEvents = expanded.some(e => e.date === ds);
    const hasTasks = tasks.some(t => t.dueDate === ds && t.status !== "done");
    if (hasEvents || hasTasks) days.push(ds);
  }

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
      {days.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>No upcoming events or tasks in the next 30 days.</div>}
      {days.map(ds => {
        const d = new Date(ds + "T00:00:00");
        const dayEvents = expanded.filter(e => e.date === ds);
        const dayTasks = tasks.filter(t => t.dueDate === ds && t.status !== "done");
        return (
          <div key={ds} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ds === localDateStr(today) ? "#1a3a6b" : "#374151", marginBottom: 8, paddingBottom: 4, borderBottom: "2px solid " + (ds === localDateStr(today) ? "#1a3a6b" : "#e5e7eb") }}>
              {d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
              {ds === localDateStr(today) && <span style={{ marginLeft: 8, fontSize: 10, background: "#1a3a6b", color: "#fff", padding: "2px 6px", borderRadius: 10 }}>Today</span>}
            </div>
            {dayEvents.map(ev => (
              <div key={ev.id} onClick={() => onEventClick(ev)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: EVENT_COLORS[ev.color] + "15", border: `1px solid ${EVENT_COLORS[ev.color]}30`, marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: EVENT_COLORS[ev.color], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{ev.allDay ? "All day" : `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ""}`}{ev.location ? ` · ${ev.location}` : ""}</div>
                </div>
              </div>
            ))}
            {dayTasks.map(t => (
              <div key={t.id} onClick={() => onTaskClick(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#f8f9fa", border: "1px solid #e5e7eb", marginBottom: 6, cursor: "pointer" }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: PRIORITY_CONFIG[t.priority].color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Task · <StatusBadge status={t.status} /> · <PriorityBadge priority={t.priority} /></div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────

function EventDetailPanel({ event, tasks, onUpdate, onDelete, onClose }: {
  event: CalEvent; tasks: Task[];
  onUpdate: (id: string, updates: Partial<CalEvent>) => void;
  onDelete: (id: string, all?: boolean) => void; onClose: () => void;
}) {
  const linkedTask = tasks.find(t => t.id === event.taskId);
  return (
    <div style={{ width: 320, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#1a1a2e,#252545)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#A68A64" }}>Event Detail</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDelete(event.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12, padding: "4px 8px", borderRadius: 4 }}>Delete</button>
          {event.recurringId && <button onClick={() => onDelete(event.id, true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706", fontSize: 12, padding: "4px 8px", borderRadius: 4 }}>Del All</button>}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ width: "100%", height: 4, borderRadius: 2, background: EVENT_COLORS[event.color], marginBottom: 12 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>{event.title}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
          📅 {new Date(event.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        {!event.allDay && event.startTime && (
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>🕐 {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</div>
        )}
        {event.allDay && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>All day event</div>}
        {event.location && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>📍 {event.location}</div>}
        {event.description && <div style={{ fontSize: 13, color: "#374151", marginTop: 8, padding: "8px 10px", background: "#f8f9fa", borderRadius: 6 }}>{event.description}</div>}
        {event.recurrence && (
          <div style={{ fontSize: 11, color: "#7A6342", marginTop: 8, padding: "4px 8px", background: "#fef3c7", borderRadius: 4 }}>
            🔁 Repeats {event.recurrence.frequency}{event.recurrence.endDate ? ` until ${event.recurrence.endDate}` : ""}
          </div>
        )}
        {linkedTask && (
          <div style={{ marginTop: 12, padding: "8px 10px", background: "#eff6ff", borderRadius: 6, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1a3a6b", marginBottom: 2 }}>LINKED TASK</div>
            <div style={{ fontSize: 12, color: "#374151" }}>{linkedTask.title}</div>
            <StatusBadge status={linkedTask.status} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Overview ───────────────────────────────────────────────────────

function DashboardOverview({ tasks, events, projects, onSelectTask, onViewChange }: {
  tasks: Task[]; events: CalEvent[]; projects: Project[];
  onSelectTask: (id: string) => void; onViewChange: (v: MainView) => void;
}) {
  const todayStr = localDateStr(today);
  const dueTodayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== "done");
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== "done");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const doneTasks = tasks.filter(t => t.status === "done");
  const rangeEnd = addDays(today, 7);
  const upcomingEvents = expandRecurring(events, today, rangeEnd).filter(e => e.date >= todayStr).slice(0, 5);

  const stats = [
    { label: "Total Tasks", value: tasks.length, color: "#1a3a6b", icon: "📋" },
    { label: "In Progress", value: inProgressTasks.length, color: "#7A6342", icon: "⚡" },
    { label: "Due Today", value: dueTodayTasks.length, color: "#d97706", icon: "📅" },
    { label: "Overdue", value: overdueTasks.length, color: "#dc2626", icon: "⚠" },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
          {dueTodayTasks.length > 0 ? `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today.` : "No tasks due today — great work!"}
        </p>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Due Today */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#1a3a6b,#1a1a2e)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#A68A64" }}>Due Today</span>
            <button onClick={() => onViewChange("kanban")} style={{ fontSize: 11, color: "#A68A64", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {dueTodayTasks.length === 0 && <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>No tasks due today</div>}
            {dueTodayTasks.map(t => (
              <div key={t.id} onClick={() => onSelectTask(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_CONFIG[t.priority].color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#1a1a2e", flex: 1 }}>{t.title}</span>
                <PriorityBadge priority={t.priority} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "linear-gradient(135deg,#7A6342,#A68A64)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Upcoming Events</span>
            <button onClick={() => onViewChange("calendar")} style={{ fontSize: 11, color: "#fff", background: "none", border: "none", cursor: "pointer" }}>Calendar →</button>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {upcomingEvents.length === 0 && <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>No upcoming events</div>}
            {upcomingEvents.map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: EVENT_COLORS[ev.color], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#1a1a2e", fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{ev.date}{ev.startTime ? ` · ${ev.startTime}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", gridColumn: "1 / -1" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Project Progress</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {projects.map(p => {
              const pTasks = tasks.filter(t => t.project === p.id);
              const pDone = pTasks.filter(t => t.status === "done").length;
              const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
              return (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{pDone}/{pTasks.length} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ tasks, projects, labels, onSelectTask, onUpdateTask }: {
  tasks: Task[]; projects: Project[]; labels: Label[];
  onSelectTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  const filtered = tasks.filter(t => {
    if (filter && !t.title.toLowerCase().includes(filter.toLowerCase())) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const bulkMarkDone = () => {
    selected.forEach(id => onUpdateTask(id, { status: "done", completedAt: fmt(today) }));
    setSelected(new Set());
  };

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Filters */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="🔍 Search tasks..." style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #e5e7eb", width: 200 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | "all")} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
          <option value="all">All Status</option>
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | "all")} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
          <option value="all">All Priority</option>
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
        </select>
        {selected.size > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{selected.size} selected</span>
            <button onClick={bulkMarkDone} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, background: "#059669", color: "#fff", border: "none", cursor: "pointer" }}>Mark Done</button>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
        )}
      </div>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 90px 90px 100px", padding: "8px 16px", borderBottom: "1px solid #e5e7eb", background: "#f8f9fa" }}>
        <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(t => t.id)) : new Set())} style={{ cursor: "pointer" }} />
        {["Task", "Status", "Priority", "Due Date", "Project"].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
        ))}
      </div>
      {/* Rows */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filtered.map(t => {
          const project = projects.find(p => p.id === t.project);
          const isOverdue = t.dueDate && t.dueDate < fmt(today) && t.status !== "done";
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 90px 90px 100px", padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selected.has(t.id) ? "#eff6ff" : "#fff", transition: "background 0.1s" }}
              onMouseEnter={e => { if (!selected.has(t.id)) e.currentTarget.style.background = "#f8f9fa"; }}
              onMouseLeave={e => { if (!selected.has(t.id)) e.currentTarget.style.background = "#fff"; }}>
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} onClick={e => e.stopPropagation()} style={{ cursor: "pointer" }} />
              <div onClick={() => onSelectTask(t.id)} style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{t.title}</div>
              <div><StatusBadge status={t.status} /></div>
              <div><PriorityBadge priority={t.priority} /></div>
              <div style={{ fontSize: 11, color: isOverdue ? "#dc2626" : "#6b7280", fontWeight: isOverdue ? 700 : 400 }}>{t.dueDate ?? "—"}</div>
              <div style={{ fontSize: 11, color: project?.color ?? "#9ca3af", fontWeight: 600 }}>{project?.name ?? "—"}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 13 }}>No tasks match your filters.</div>}
      </div>
    </div>
  );
}

// ─── Inbox View ───────────────────────────────────────────────────────────────

function InboxView({ tasks, onAddTask, onUpdateTask, onDeleteTask }: {
  tasks: Task[];
  onAddTask: (t: Omit<Task, "id" | "createdAt">) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const inboxTasks = tasks.filter(t => t.status === "inbox");

  const add = () => {
    if (!input.trim()) return;
    onAddTask({ title: input.trim(), status: "inbox", priority: "none", labels: [], subtasks: [], comments: [] });
    setInput("");
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e", margin: "0 0 4px" }}>Quick Capture</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Type a task and press Enter to add it to your inbox.</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder="What needs to be done?" style={{ flex: 1, fontSize: 14, padding: "10px 14px", borderRadius: 8, border: "2px solid #e5e7eb", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#1a3a6b"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
        <button onClick={add} style={{ fontSize: 14, padding: "10px 18px", borderRadius: 8, background: "linear-gradient(135deg,#1a3a6b,#1a1a2e)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>Add</button>
      </div>
      {inboxTasks.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 13 }}>Your inbox is empty. Add tasks above.</div>}
      {inboxTasks.map(t => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{t.title}</div>
          <button onClick={() => onUpdateTask(t.id, { status: "todo" })} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#eff6ff", color: "#1a3a6b", border: "1px solid #bfdbfe", cursor: "pointer" }}>→ To Do</button>
          <button onClick={() => onUpdateTask(t.id, { status: "in_progress" })} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#fef3c7", color: "#7A6342", border: "1px solid #fde68a", cursor: "pointer" }}>→ In Progress</button>
          <button onClick={() => onDeleteTask(t.id)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Main TaskCalendar Component ──────────────────────────────────────────────

export default function TaskCalendar() {
  // State
  const [tasks, setTasks] = useState<Task[]>(() => loadStorage(STORAGE_KEYS.tasks, DEFAULT_TASKS));
  const [events, setEvents] = useState<CalEvent[]>(() => loadStorage(STORAGE_KEYS.events, DEFAULT_EVENTS));
  const [projects, setProjects] = useState<Project[]>(() => loadStorage(STORAGE_KEYS.projects, DEFAULT_PROJECTS));
  const labels = DEFAULT_LABELS;

  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [calView, setCalView] = useState<CalView>("month");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");
  const [newEventDate, setNewEventDate] = useState(localDateStr(today));
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const importIcsRef = useRef<HTMLInputElement>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("tc_dismissed_notifs") || "[]"); } catch { return []; }
  });
  const dismissNotif = (id: string) => {
    setDismissedNotifs(prev => {
      const next = [...prev, id];
      try { localStorage.setItem("tc_dismissed_notifs", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  // ── Leave Calendar integration: watch for approved leave and create blocked events ──
  useEffect(() => {
    const LEAVE_KEY = "tc_leave_events_v1";
    const syncLeave = () => {
      try {
        const raw = localStorage.getItem("cal2026_leaves_v1");
        if (!raw) return;
        const leaves: Array<{ id: string; name: string; type: string; startDate: string; endDate: string; status: string }> = JSON.parse(raw);
        const approved = leaves.filter(l => l.status === "approved");
        const synced: string[] = JSON.parse(localStorage.getItem(LEAVE_KEY) || "[]");
        const newSynced = [...synced];
        approved.forEach(leave => {
          if (!synced.includes(leave.id)) {
            setEvents(prev => [{
              id: "leave_" + leave.id,
              title: `🏖 ${leave.name} – ${leave.type}`,
              date: leave.startDate,
              endDate: leave.endDate,
              color: "green" as EventColor,
              description: `Approved leave: ${leave.type}`,
              allDay: true,
            }, ...prev]);
            newSynced.push(leave.id);
          }
        });
        localStorage.setItem(LEAVE_KEY, JSON.stringify(newSynced));
      } catch {}
    };
    syncLeave();
    window.addEventListener("storage", syncLeave);
    return () => window.removeEventListener("storage", syncLeave);
  }, []);
  // ── Close notification dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  // ── iCal export ──
  const exportICal = useCallback(() => {
    const todayStr = localDateStr(today);
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//369 Alliance//Task Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    const fmtDt = (ds: string, ts?: string) => {
      const clean = ds.replace(/-/g, "");
      if (ts) { const t = ts.replace(":", ""); return `${clean}T${t}00`; }
      return clean;
    };
    events.forEach(ev => {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${ev.id}@369alliance`);
      lines.push(`SUMMARY:${ev.title.replace(/,/g, "\\,")}`);
      lines.push(`DTSTART${ev.startTime ? ":" + fmtDt(ev.date, ev.startTime) : ";VALUE=DATE:" + ev.date.replace(/-/g,"")}`);
      lines.push(`DTEND${ev.endTime ? ":" + fmtDt(ev.endDate ?? ev.date, ev.endTime) : ";VALUE=DATE:" + (ev.endDate ?? ev.date).replace(/-/g,"")}`);
      if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}`);
      if (ev.location) lines.push(`LOCATION:${ev.location}`);
      lines.push(`DTSTAMP:${todayStr.replace(/-/g,"")}T000000Z`);
      lines.push("END:VEVENT");
    });
    tasks.filter(t => t.dueDate).forEach(task => {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:task_${task.id}@369alliance`);
      lines.push(`SUMMARY:[Task] ${task.title.replace(/,/g, "\\,")}`);
      lines.push(`DTSTART;VALUE=DATE:${task.dueDate!.replace(/-/g,"")}`);
      lines.push(`DTEND;VALUE=DATE:${task.dueDate!.replace(/-/g,"")}`);
      if (task.description) lines.push(`DESCRIPTION:${task.description.replace(/\n/g, "\\n")}`);
      lines.push(`DTSTAMP:${todayStr.replace(/-/g,"")}T000000Z`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "369-alliance-calendar.ics"; a.click();
    URL.revokeObjectURL(url);
  }, [events, tasks]);
  // ── Notification data ──
  const todayStr2 = localDateStr(today);
  const overdueTasks = tasks.filter(t => t.status !== "done" && t.dueDate && t.dueDate < todayStr2 && !dismissedNotifs.includes(t.id));
  const upcomingTasks = tasks.filter(t => t.status !== "done" && t.dueDate && t.dueDate >= todayStr2 && t.dueDate <= localDateStr(new Date(today.getTime() + 7 * 86400000)) && !dismissedNotifs.includes(t.id));
  const notifCount = overdueTasks.length + upcomingTasks.length;
  // Persist to localStorage
  useEffect(() => { saveStorage(STORAGE_KEYS.tasks, tasks); }, [tasks]);
  useEffect(() => { saveStorage(STORAGE_KEYS.events, events); }, [events]);
  useEffect(() => { saveStorage(STORAGE_KEYS.projects, projects); }, [projects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "Escape") { setCmdOpen(false); setSelectedTask(null); setSelectedEvent(null); }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowNewTask(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // CRUD
  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    const task: Task = { ...t, id: nanoid(), createdAt: fmt(today) };
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  }, []);

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    updateTask(id, { status, completedAt: status === "done" ? fmt(today) : undefined });
  }, [updateTask]);

  const addEvent = useCallback((ev: Omit<CalEvent, "id">) => {
    setEvents(prev => [{ ...ev, id: nanoid() }, ...prev]);
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const deleteEvent = useCallback((id: string, all?: boolean) => {
    if (all) {
      const ev = events.find(e => e.id === id || e.id === id.split("_")[0]);
      const rid = ev?.recurringId ?? id.split("_")[0];
      setEvents(prev => prev.filter(e => e.id !== rid && e.recurringId !== rid));
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    setSelectedEvent(null);
  }, [events]);

  const scheduleTaskAsEvent = useCallback((taskId: string, date: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    addEvent({ title: task.title, date, color: "blue", taskId, allDay: true });
    updateTask(taskId, { dueDate: date });
  }, [tasks, addEvent, updateTask]);

  // Derived
  const selectedTaskObj = tasks.find(t => t.id === selectedTask) ?? null;
  const selectedEventObj = events.find(e => e.id === selectedEvent) ?? null;

  // Command palette results
  const cmdResults = cmdQuery.trim() ? tasks.filter(t => t.title.toLowerCase().includes(cmdQuery.toLowerCase())).slice(0, 6) : [];

  // Nav items
  const navItems: { id: MainView; label: string; icon: string }[] = [
    { id: "dashboard", label: "Overview", icon: "📊" },
    { id: "inbox", label: "Inbox", icon: "📥" },
    { id: "kanban", label: "Kanban Board", icon: "📌" },
    { id: "list", label: "List View", icon: "📋" },
    { id: "calendar", label: "Calendar", icon: "📅" },
  ];

  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();

  const weekStart = (() => {
    const d = new Date(calDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  })();

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", background: "#f7f8fa", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 200, background: "linear-gradient(180deg,#1a1a2e 0%,#252545 100%)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo area */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#A68A64", letterSpacing: "0.05em" }}>TASK / CALENDAR</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>369 Alliance</div>
        </div>

        {/* New buttons */}
        <div style={{ padding: "10px 10px 6px" }}>
          <button onClick={() => setShowNewTask(true)} style={{ width: "100%", fontSize: 12, padding: "8px 10px", borderRadius: 6, background: "linear-gradient(135deg,#7A6342,#A68A64)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, marginBottom: 4 }}>+ New Task</button>
          <button onClick={() => { setNewEventDate(localDateStr(today)); setShowNewEvent(true); }} style={{ width: "100%", fontSize: 12, padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontWeight: 600 }}>+ New Event</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setMainView(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 6, background: mainView === item.id ? "rgba(166,138,100,0.2)" : "transparent", border: mainView === item.id ? "1px solid rgba(166,138,100,0.3)" : "1px solid transparent", color: mainView === item.id ? "#A68A64" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, fontWeight: mainView === item.id ? 700 : 400, textAlign: "left", marginBottom: 2 }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Projects */}
          <div style={{ marginTop: 16, marginBottom: 6, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px" }}>Projects</div>
          {projects.map(p => (
            <button key={p.id} onClick={() => setMainView("kanban")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 11, textAlign: "left", marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span>{p.name}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setCmdOpen(true)} style={{ width: "100%", fontSize: 11, padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", textAlign: "left" }}>
            ⌘K Search...
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", margin: 0, flex: 1 }}>
            {navItems.find(n => n.id === mainView)?.label ?? "Overview"}
          </h2>

          {mainView === "calendar" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => {
                const d = new Date(calDate);
                if (calView === "month") d.setMonth(d.getMonth() - 1);
                else if (calView === "week") d.setDate(d.getDate() - 7);
                else d.setDate(d.getDate() - 1);
                setCalDate(d);
              }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", minWidth: 140, textAlign: "center" }}>
                {calView === "month" ? `${MONTHS[calMonth]} ${calYear}` :
                 calView === "week" ? `Week of ${weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` :
                 calDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <button onClick={() => {
                const d = new Date(calDate);
                if (calView === "month") d.setMonth(d.getMonth() + 1);
                else if (calView === "week") d.setDate(d.getDate() + 7);
                else d.setDate(d.getDate() + 1);
                setCalDate(d);
              }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14 }}>›</button>
              <button onClick={() => setCalDate(new Date())} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Today</button>
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                {(["month","week","day","agenda"] as CalView[]).map(v => (
                  <button key={v} onClick={() => setCalView(v)} style={{ fontSize: 11, padding: "5px 10px", background: calView === v ? "#1a3a6b" : "#fff", color: calView === v ? "#fff" : "#374151", border: "none", cursor: "pointer", fontWeight: calView === v ? 700 : 400, textTransform: "capitalize" }}>{v}</button>
                ))}
              </div>
            </div>
          )}

          {mainView === "kanban" && (
            <button onClick={() => { setNewTaskStatus("todo"); setShowNewTask(true); }} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 6, background: "linear-gradient(135deg,#1a3a6b,#1a1a2e)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>+ New Task</button>
          )}
          {/* iCal Export */}
          <button onClick={exportICal} title="Export to .ics (Outlook / Google Calendar)" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "7px 12px", borderRadius: 6, background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", color: "#374151", fontWeight: 600, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export .ics
          </button>
          {/* iCal Import */}
          <input ref={importIcsRef} type="file" accept=".ics,text/calendar" style={{ display: "none" }} onChange={e => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
              try {
                const text = ev.target?.result as string;
                const eventBlocks = text.split("BEGIN:VEVENT").slice(1);
                const imported: CalEvent[] = [];
                eventBlocks.forEach(block => {
                  const get = (key: string) => { const m = block.match(new RegExp(key + ":([^\r\n]+)")); return m ? m[1].trim() : ""; };
                  const summary = get("SUMMARY").replace(/\\,/g, ",").replace(/\\n/g, "\n");
                  const dtstart = get("DTSTART(?:;[^:]+)?");
                  const dtend = get("DTEND(?:;[^:]+)?");
                  if (!summary || !dtstart) return;
                  const parseDate = (s: string) => s.length >= 8 ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : "";
                  const parseTime = (s: string) => s.length >= 15 ? `${s.slice(9,11)}:${s.slice(11,13)}` : undefined;
                  const date = parseDate(dtstart);
                  if (!date) return;
                  imported.push({ id: "ics_" + nanoid(), title: summary, date, endDate: dtend ? parseDate(dtend) : date, startTime: parseTime(dtstart), endTime: dtend ? parseTime(dtend) : undefined, color: "blue" as EventColor, allDay: !dtstart.includes("T") });
                });
                if (imported.length > 0) setEvents(prev => [...imported, ...prev]);
                alert(`Imported ${imported.length} event${imported.length !== 1 ? "s" : ""} successfully.`);
              } catch { alert("Failed to parse .ics file. Please check the file format."); }
              if (importIcsRef.current) importIcsRef.current.value = "";
            };
            reader.readAsText(file);
          }} />
          <button onClick={() => importIcsRef.current?.click()} title="Import .ics file" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "7px 12px", borderRadius: 6, background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", color: "#374151", fontWeight: 600, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import .ics
          </button>
          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setNotifOpen(v => !v)} title="Notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: notifOpen ? "#1a3a6b" : "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", color: notifOpen ? "#fff" : "#374151" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: overdueTasks.length > 0 ? "#ef4444" : "#A68A64", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{notifCount > 9 ? "9+" : notifCount}</span>}
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 9999, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Notifications</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{notifCount} item{notifCount !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {overdueTasks.length > 0 && (
                    <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 800, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1 }}>Overdue</div>
                  )}
                  {overdueTasks.map(t => (
                    <div key={t.id} style={{ padding: "8px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", marginTop: 4, flexShrink: 0 }} />
                      <div onClick={() => { setSelectedTask(t.id); setMainView("kanban"); setNotifOpen(false); }} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#ef4444" }}>Due {t.dueDate}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); dismissNotif(t.id); }} title="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                  {upcomingTasks.length > 0 && (
                    <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 800, color: "#A68A64", textTransform: "uppercase", letterSpacing: 1 }}>Due This Week</div>
                  )}
                  {upcomingTasks.map(t => (
                    <div key={t.id} style={{ padding: "8px 16px", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A68A64", marginTop: 4, flexShrink: 0 }} />
                      <div onClick={() => { setSelectedTask(t.id); setMainView("kanban"); setNotifOpen(false); }} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>Due {t.dueDate}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); dismissNotif(t.id); }} title="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                  {notifCount === 0 && (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No overdue or upcoming tasks 🎉</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Dashboard */}
            {mainView === "dashboard" && (
              <DashboardOverview tasks={tasks} events={events} projects={projects} onSelectTask={id => { setSelectedTask(id); setMainView("kanban"); }} onViewChange={setMainView} />
            )}

            {/* Kanban */}
            {mainView === "kanban" && (
              <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => (
                    <KanbanColumn key={status} status={status} tasks={tasks} projects={projects} labels={labels}
                      onSelectTask={id => setSelectedTask(id)}
                      onDragStart={id => { setDragTaskId(id); }}
                      onDrop={status => { if (dragTaskId) { moveTask(dragTaskId, status); setDragTaskId(null); } }}
                      onAddTask={s => { setNewTaskStatus(s); setShowNewTask(true); }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            {mainView === "list" && (
              <ListView tasks={tasks} projects={projects} labels={labels} onSelectTask={id => setSelectedTask(id)} onUpdateTask={updateTask} />
            )}

            {/* Inbox */}
            {mainView === "inbox" && (
              <InboxView tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
            )}

            {/* Calendar */}
            {mainView === "calendar" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {calView === "month" && (
                  <MonthView year={calYear} month={calMonth} events={events} tasks={tasks}
                    onDayClick={date => { setNewEventDate(date); setShowNewEvent(true); }}
                    onEventClick={ev => setSelectedEvent(ev.id)}
                    onDrop={(taskId, date) => scheduleTaskAsEvent(taskId, date)}
                  />
                )}
                {calView === "week" && (
                  <WeekView weekStart={weekStart} events={events}
                    onEventClick={ev => setSelectedEvent(ev.id)}
                    onSlotClick={(date, time) => { setNewEventDate(date); setShowNewEvent(true); }}
                  />
                )}
                {calView === "day" && (
                  <WeekView weekStart={calDate} events={events}
                    onEventClick={ev => setSelectedEvent(ev.id)}
                    onSlotClick={(date, time) => { setNewEventDate(date); setShowNewEvent(true); }}
                  />
                )}
                {calView === "agenda" && (
                  <AgendaView events={events} tasks={tasks}
                    onEventClick={ev => setSelectedEvent(ev.id)}
                    onTaskClick={id => { setSelectedTask(id); setMainView("kanban"); }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Task Detail Panel */}
          {selectedTaskObj && (
            <TaskDetailPanel task={selectedTaskObj} tasks={tasks} projects={projects} labels={labels}
              onUpdate={updateTask} onDelete={deleteTask} onClose={() => setSelectedTask(null)} />
          )}

          {/* Event Detail Panel */}
          {selectedEventObj && !selectedTaskObj && (
            <EventDetailPanel event={selectedEventObj} tasks={tasks}
              onUpdate={updateEvent} onDelete={deleteEvent} onClose={() => setSelectedEvent(null)} />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showNewTask && (
        <NewTaskModal projects={projects} defaultStatus={newTaskStatus}
          onAdd={addTask} onClose={() => setShowNewTask(false)} />
      )}
      {showNewEvent && (
        <NewEventModal defaultDate={newEventDate}
          onAdd={addEvent} onClose={() => setShowNewEvent(false)} />
      )}

      {/* ── Command Palette ── */}
      {cmdOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", zIndex: 2000 }} onClick={() => setCmdOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 12, width: 560, maxWidth: "90vw", overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 16, marginRight: 10 }}>🔍</span>
              <input autoFocus value={cmdQuery} onChange={e => setCmdQuery(e.target.value)}
                placeholder="Search tasks, events, projects..." style={{ flex: 1, fontSize: 14, border: "none", outline: "none" }} />
              <kbd style={{ fontSize: 11, padding: "2px 6px", background: "#f3f4f6", borderRadius: 4, color: "#6b7280" }}>ESC</kbd>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {cmdQuery.trim() === "" && (
                <div>
                  <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Navigation</div>
                  {navItems.map(item => (
                    <button key={item.id} onClick={() => { setMainView(item.id); setCmdOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#374151" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <span>{item.icon}</span><span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {cmdResults.length > 0 && (
                <div>
                  <div style={{ padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasks</div>
                  {cmdResults.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTask(t.id); setMainView("kanban"); setCmdOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <StatusBadge status={t.status} />
                      <span style={{ fontSize: 13, color: "#1a1a2e", flex: 1 }}>{t.title}</span>
                      <PriorityBadge priority={t.priority} />
                    </button>
                  ))}
                </div>
              )}
              {cmdQuery.trim() !== "" && cmdResults.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No results for "{cmdQuery}"</div>
              )}
            </div>
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: 3 }}>↵</kbd> Select</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: 3 }}>N</kbd> New task</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: 3 }}>⌘K</kbd> Toggle</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
