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
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── User BOJ (Separated) ──────────────────────────────
export const userBoj = pgTable("user_boj", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bojHandle: varchar("boj_handle", { length: 50 }).notNull().unique(),
  nickname: varchar("nickname", { length: 50 }),
  tier: integer("tier"),
  rating: integer("rating"),
  solvedCount: integer("solved_count").default(0),
});

// ── Better Auth Tables ────────────────────────────────
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Team ──────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  invite_code: varchar("invite_code", { length: 8 }).notNull().unique(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  team_id: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
    problem_id: integer("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    tag_key: varchar("tag_key", { length: 100 })
      .notNull()
      .references(() => tags.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.problem_id, t.tag_key] })]
);

// ── User Solved Status ────────────────────────────────
export const userSolvedStatuses = pgTable("user_solved_statuses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problem_id: integer("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
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
  created_by: integer("created_by")
    .notNull()
    .references(() => users.id),
  is_public: boolean("is_public").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const teamRoadmaps = pgTable(
  "team_roadmaps",
  {
    team_id: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roadmap_id: integer("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    added_by: integer("added_by")
      .notNull()
      .references(() => users.id),
    added_at: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("team_roadmaps_team_roadmap_uidx").on(t.team_id, t.roadmap_id)]
);

export const roadmapSteps = pgTable("roadmap_steps", {
  id: serial("id").primaryKey(),
  roadmap_id: integer("roadmap_id")
    .notNull()
    .references(() => roadmaps.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  tag_key: varchar("tag_key", { length: 100 }).references(() => tags.key, {
    onDelete: "set null",
  }),
  description: text("description"),
});

export const roadmapProblems = pgTable("roadmap_problems", {
  id: serial("id").primaryKey(),
  step_id: integer("step_id")
    .notNull()
    .references(() => roadmapSteps.id, { onDelete: "cascade" }),
  problem_id: integer("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
});

// ── User Roadmap Progress ─────────────────────────────
export const userRoadmapProgresses = pgTable("user_roadmap_progresses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  step_id: integer("step_id")
    .notNull()
    .references(() => roadmapSteps.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completed_at: timestamp("completed_at"),
});

// ── Analysis Report ───────────────────────────────────
export const analysisReports = pgTable("analysis_reports", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weak_tags: json("weak_tags"),
  recommended_problems: json("recommended_problems"),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ── BOJ Integration Submissions ───────────────────────
export const integrationSubmissions = pgTable(
  "integration_submissions",
  {
    id: serial("id").primaryKey(),
    source_platform: varchar("source_platform", { length: 30 }).notNull().default("baekjoon"),
    submission_id: varchar("submission_id", { length: 64 }).notNull(),
    team_id: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    member_handle: varchar("member_handle", { length: 50 }).notNull(),
    problem_id: integer("problem_id").notNull(),
    language: varchar("language", { length: 100 }).notNull(),
    source_code: text("source_code").notNull(),
    runtime_ms: integer("runtime_ms"),
    memory_kb: integer("memory_kb"),
    result: varchar("result", { length: 30 }).notNull(),
    submitted_at_raw: varchar("submitted_at_raw", { length: 50 }),
    captured_at: timestamp("captured_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("integration_submissions_team_submission_uidx").on(t.team_id, t.submission_id),
  ]
);
