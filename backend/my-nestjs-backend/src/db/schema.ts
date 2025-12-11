// src/db/schema.ts
import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
  date,
  pgEnum,
  unique,
  index,
  integer,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============= ENUMS =============

// User status
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Project status
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]);

// Project visibility
export const projectVisibilityEnum = pgEnum('project_visibility', [
  'private',
  'team',
  'public',
]);

// ⭐ Project role (3 cấp phân quyền)
export const projectRoleEnum = pgEnum('project_role', ['viewer', 'member', 'admin']);

// Member status
export const memberStatusEnum = pgEnum('member_status', ['active', 'invited', 'removed']);

// Task type
export const taskTypeEnum = pgEnum('task_type', ['task', 'bug', 'story', 'epic', 'subtask']);

// Task status
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'testing',
  'blocked',
  'done',
  'closed',
]);

// Task priority
export const taskPriorityEnum = pgEnum('task_priority', [
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
]);

// Sprint status
export const sprintStatusEnum = pgEnum('sprint_status', ['planned', 'active', 'completed']);

// Change type (cho task history)
export const changeTypeEnum = pgEnum('change_type', [
  'created',
  'updated',
  'deleted',
  'commented',
  'status_changed',
  'assigned',
  'attachment_added',
]);

// ============= TABLES =============

// -----------------------------------------------------
// Table: users
// -----------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 100 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    status: userStatusEnum('status').notNull().default('active'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    usernameIdx: index('idx_users_username').on(table.username),
    statusIdx: index('idx_users_status').on(table.status),
    lastLoginIdx: index('idx_users_last_login').on(table.lastLoginAt),
  })
);

// -----------------------------------------------------
// Table: projects
// -----------------------------------------------------
export const projects = pgTable(
  'projects',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    key: varchar('key', { length: 10 }).notNull().unique(),
    description: text('description'),
    ownerId: bigint('owner_id', { mode: 'number' }).notNull(),
    status: projectStatusEnum('status').notNull().default('active'),
    visibility: projectVisibilityEnum('visibility').notNull().default('private'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdx: index('idx_projects_owner').on(table.ownerId),
    statusIdx: index('idx_projects_status').on(table.status),
    keyIdx: index('idx_projects_key').on(table.key),
  })
);

// -----------------------------------------------------
// Table: project_members
// -----------------------------------------------------
export const projectMembers = pgTable(
  'project_members',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projectId: bigint('project_id', { mode: 'number' })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: projectRoleEnum('role').notNull().default('member'),
    status: memberStatusEnum('status').notNull().default('invited'),
    invitedBy: bigint('invited_by', { mode: 'number' }).references(() => users.id, {
      onDelete: 'set null',
    }),
    invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
  },
  (table) => ({
    uniqueProjectUser: unique('unique_project_user').on(table.projectId, table.userId),
    projectIdx: index('idx_project_members_project').on(table.projectId),
    userIdx: index('idx_project_members_user').on(table.userId),
    roleIdx: index('idx_project_members_role').on(table.role),
    statusIdx: index('idx_project_members_status').on(table.status),
  })
);

// -----------------------------------------------------
// Table: sprints
// -----------------------------------------------------
export const sprints = pgTable(
  'sprints',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projectId: bigint('project_id', { mode: 'number' })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    goal: text('goal'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: sprintStatusEnum('status').notNull().default('planned'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('idx_sprints_project').on(table.projectId),
    statusIdx: index('idx_sprints_status').on(table.status),
    dateIdx: index('idx_sprints_dates').on(table.startDate, table.endDate),
  })
);

// -----------------------------------------------------
// Table: tasks
// -----------------------------------------------------
export const tasks = pgTable(
  'tasks',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projectId: bigint('project_id', { mode: 'number' })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    taskNumber: integer('task_number').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    type: taskTypeEnum('type').notNull().default('task'),
    status: taskStatusEnum('status').notNull().default('backlog'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    reporterId: bigint('reporter_id', { mode: 'number' }).references(() => users.id, {
      onDelete: 'set null',
    }),
    assigneeId: bigint('assignee_id', { mode: 'number' }).references(() => users.id, {
      onDelete: 'set null',
    }),
    sprintId: bigint('sprint_id', { mode: 'number' }).references(() => sprints.id, {
      onDelete: 'set null',
    }),
    parentTaskId: bigint('parent_task_id', { mode: 'number' }).references(() => tasks.id, {
      onDelete: 'cascade',
    }),
    dueDate: date('due_date'),
    estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
    actualHours: decimal('actual_hours', { precision: 6, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueProjectTask: unique('unique_project_task_number').on(table.projectId, table.taskNumber),
    projectIdx: index('idx_tasks_project').on(table.projectId),
    assigneeIdx: index('idx_tasks_assignee').on(table.assigneeId),
    reporterIdx: index('idx_tasks_reporter').on(table.reporterId),
    statusIdx: index('idx_tasks_status').on(table.status),
    priorityIdx: index('idx_tasks_priority').on(table.priority),
    sprintIdx: index('idx_tasks_sprint').on(table.sprintId),
    parentIdx: index('idx_tasks_parent').on(table.parentTaskId),
    dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  })
);

// -----------------------------------------------------
// Table: comments
// -----------------------------------------------------
export const comments = pgTable(
  'comments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    taskId: bigint('task_id', { mode: 'number' })
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    parentCommentId: bigint('parent_comment_id', { mode: 'number' }).references(() => comments.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index('idx_comments_task').on(table.taskId),
    userIdx: index('idx_comments_user').on(table.userId),
    parentIdx: index('idx_comments_parent').on(table.parentCommentId),
  })
);

// -----------------------------------------------------
// Table: attachments
// -----------------------------------------------------
export const attachments = pgTable(
  'attachments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    taskId: bigint('task_id', { mode: 'number' })
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    uploadedBy: bigint('uploaded_by', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: varchar('file_url', { length: 1000 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number' }),
    mimeType: varchar('mime_type', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index('idx_attachments_task').on(table.taskId),
    uploaderIdx: index('idx_attachments_uploader').on(table.uploadedBy),
  })
);

// -----------------------------------------------------
// Table: labels
// -----------------------------------------------------
export const labels = pgTable(
  'labels',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    projectId: bigint('project_id', { mode: 'number' })
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueProjectLabel: unique('unique_project_label_name').on(table.projectId, table.name),
    projectIdx: index('idx_labels_project').on(table.projectId),
  })
);

// -----------------------------------------------------
// Table: task_labels (many-to-many)
// -----------------------------------------------------
export const taskLabels = pgTable(
  'task_labels',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    taskId: bigint('task_id', { mode: 'number' })
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    labelId: bigint('label_id', { mode: 'number' })
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueTaskLabel: unique('unique_task_label').on(table.taskId, table.labelId),
    taskIdx: index('idx_task_labels_task').on(table.taskId),
    labelIdx: index('idx_task_labels_label').on(table.labelId),
  })
);

// -----------------------------------------------------
// Table: task_history (audit trail)
// -----------------------------------------------------
export const taskHistory = pgTable(
  'task_history',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    taskId: bigint('task_id', { mode: 'number' })
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    changeType: changeTypeEnum('change_type').notNull(),
    fieldName: varchar('field_name', { length: 100 }),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index('idx_task_history_task').on(table.taskId),
    userIdx: index('idx_task_history_user').on(table.userId),
    typeIdx: index('idx_task_history_type').on(table.changeType),
    createdIdx: index('idx_task_history_created').on(table.createdAt),
  })
);

// -----------------------------------------------------
// Table: notifications
// -----------------------------------------------------
export const notifications = pgTable(
  'notifications',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: bigint('task_id', { mode: 'number' }).references(() => tasks.id, {
      onDelete: 'cascade',
    }),
    projectId: bigint('project_id', { mode: 'number' }).references(() => projects.id, {
      onDelete: 'cascade',
    }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_notifications_user').on(table.userId),
    taskIdx: index('idx_notifications_task').on(table.taskId),
    projectIdx: index('idx_notifications_project').on(table.projectId),
    isReadIdx: index('idx_notifications_read').on(table.isRead),
    createdIdx: index('idx_notifications_created').on(table.createdAt),
  })
);

// ============= RELATIONS =============

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  reportedTasks: many(tasks, { relationName: 'reportedTasks' }),
  assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
  comments: many(comments),
  attachments: many(attachments),
  taskHistory: many(taskHistory),
  notifications: many(notifications),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  sprints: many(sprints),
  tasks: many(tasks),
  labels: many(labels),
  notifications: many(notifications),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [projectMembers.invitedBy],
    references: [users.id],
  }),
}));

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  project: one(projects, {
    fields: [sprints.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  reporter: one(users, {
    fields: [tasks.reporterId],
    references: [users.id],
    relationName: 'reportedTasks',
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'assignedTasks',
  }),
  sprint: one(sprints, {
    fields: [tasks.sprintId],
    references: [sprints.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  comments: many(comments),
  attachments: many(attachments),
  labels: many(taskLabels),
  history: many(taskHistory),
  notifications: many(notifications),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
  tasks: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskHistory.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));

// ============= TYPES =============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;

export type TaskLabel = typeof taskLabels.$inferSelect;
export type NewTaskLabel = typeof taskLabels.$inferInsert;

export type TaskHistory = typeof taskHistory.$inferSelect;
export type NewTaskHistory = typeof taskHistory.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Export enum types
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type ProjectVisibility = (typeof projectVisibilityEnum.enumValues)[number];
export type ProjectRole = (typeof projectRoleEnum.enumValues)[number];
export type MemberStatus = (typeof memberStatusEnum.enumValues)[number];
export type TaskType = (typeof taskTypeEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type SprintStatus = (typeof sprintStatusEnum.enumValues)[number];
export type ChangeType = (typeof changeTypeEnum.enumValues)[number];