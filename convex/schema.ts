import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agents - AI agent profiles
  agents: defineTable({
    name: v.string(),
    type: v.string(), // e.g., "researcher", "coder", "reviewer"
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("down")),
    config: v.optional(v.any()), // Agent-specific configuration
    lastHeartbeat: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  // Tasks - Mission queue items
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedAgentId: v.optional(v.id("agents")),
    parentTaskId: v.optional(v.id("tasks")), // For subtasks
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_agent", ["assignedAgentId"])
    .index("by_parent", ["parentTaskId"]),

  // Messages - Agent communication/activity log
  messages: defineTable({
    agentId: v.id("agents"),
    taskId: v.optional(v.id("tasks")),
    type: v.union(
      v.literal("chat"),
      v.literal("thought"),
      v.literal("action"),
      v.literal("result"),
      v.literal("error"),
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_task", ["taskId"])
    .index("by_created", ["createdAt"]),

  // Settings - Key-value store for app configuration
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Channels - Connected messaging channels (Telegram, etc.)
  channels: defineTable({
    type: v.string(),
    status: v.union(v.literal("connected"), v.literal("disconnected")),
    accountId: v.optional(v.string()),
    connectedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_type", ["type"]),
});
