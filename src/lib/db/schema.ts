import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  json,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────
export const teamRoleEnum = pgEnum("team_role", ["OWNER", "ADMIN", "MEMBER"]);
export const solvedStatusEnum = pgEnum("solved_status", ["SOLVED", "TRIED", "UNSOLVED"]);

// ── User ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  boj_handle: varchar("boj_handle", { length: 50 }).notNull().unique(),
  nickname: varchar("nickname", { length: 50 }),
  email: varchar("email", { length: 255 }),
  tier: integer("tier"),
  rating: integer("rating"),
  solved_count: integer("solved_count").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── Team ──────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  team_id: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: teamRoleEnum("role").notNull().default("MEMBER"),
  joined_at: timestamp("joined_at").defaultNow().notNull(),
});

// ── Problem & Tag ─────────────────────────────────────
export const problems = pgTable("problems", {
  id: serial("id").primaryKey(),
  boj_id: integer("boj_id").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  level: integer("level").notNull(),
  cached_at: timestamp("cached_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  key: varchar("key", { length: 100 }).primaryKey(),
  name_ko: varchar("name_ko", { length: 100 }),
  name_en: varchar("name_en", { length: 100 }),
});

export const problemTags = pgTable(
  "problem_tags",
  {
    problem_id: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
    tag_key: varchar("tag_key", { length: 100 }).notNull().references(() => tags.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.problem_id, t.tag_key] })]
);

// ── User Solved Status ────────────────────────────────
export const userSolvedStatuses = pgTable("user_solved_statuses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  problem_id: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  status: solvedStatusEnum("status").notNull().default("UNSOLVED"),
  tries: integer("tries").default(0),
  solved_at: timestamp("solved_at"),
  synced_at: timestamp("synced_at").defaultNow().notNull(),
});

// ── Roadmap ───────────────────────────────────────────
export const roadmaps = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  created_by: integer("created_by").notNull().references(() => users.id),
  team_id: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  is_public: boolean("is_public").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const roadmapSteps = pgTable("roadmap_steps", {
  id: serial("id").primaryKey(),
  roadmap_id: integer("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  tag_key: varchar("tag_key", { length: 100 }).references(() => tags.key, { onDelete: "set null" }),
  description: text("description"),
});

export const roadmapProblems = pgTable("roadmap_problems", {
  id: serial("id").primaryKey(),
  step_id: integer("step_id").notNull().references(() => roadmapSteps.id, { onDelete: "cascade" }),
  problem_id: integer("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
});

// ── User Roadmap Progress ─────────────────────────────
export const userRoadmapProgresses = pgTable("user_roadmap_progresses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  step_id: integer("step_id").notNull().references(() => roadmapSteps.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completed_at: timestamp("completed_at"),
});

// ── Analysis Report ───────────────────────────────────
export const analysisReports = pgTable("analysis_reports", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weak_tags: json("weak_tags"),
  recommended_problems: json("recommended_problems"),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
