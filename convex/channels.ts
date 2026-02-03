import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("channels").collect();
  },
});

export const getByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();
  },
});

export const upsert = mutation({
  args: {
    type: v.string(),
    status: v.union(v.literal("connected"), v.literal("disconnected")),
    accountId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    const data = {
      type: args.type,
      status: args.status,
      accountId: args.accountId,
      metadata: args.metadata,
      connectedAt: args.status === "connected" ? Date.now() : undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("channels", data);
  },
});

export const disconnect = mutation({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "disconnected",
        connectedAt: undefined,
      });
      return true;
    }

    return false;
  },
});
