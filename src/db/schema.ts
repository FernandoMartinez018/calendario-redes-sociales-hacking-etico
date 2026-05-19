import { pgTable, serial, text, timestamp, integer, decimal, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'EDITOR']);
export const postStatusEnum = pgEnum('post_status', ['DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED']);
export const platformEnum = pgEnum('platform', ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'X', 'YOUTUBE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  dealerName: text('dealer_name'),
  role: roleEnum('role').default('ADMIN').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: platformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contentPosts = pgTable('content_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // REEL, STORY, POST, SHORT
  copy: text('copy').notNull(),
  hashtags: text('hashtags'),
  status: postStatusEnum('status').default('DRAFT').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  socialAccountId: uuid('social_account_id').references(() => socialAccounts.id),
  campaignId: uuid('campaign_id'), // Will be linked if needed
  aiPromptUsed: text('ai_prompt_used'),
  mediaUrl: text('media_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const metricsSnapshots = pgTable('metrics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => contentPosts.id).notNull(),
  likes: integer('likes').default(0).notNull(),
  comments: integer('comments').default(0).notNull(),
  shares: integer('shares').default(0).notNull(),
  views: integer('views').default(0).notNull(),
  engagement: decimal('engagement', { precision: 10, scale: 2 }).default('0.0').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  platform: platformEnum('platform').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiHistories = pgTable('ai_histories', {
  id: uuid('id').defaultRandom().primaryKey(),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  tokens: integer('tokens').default(0).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  type: text('type').notNull(), // IMAGE, VIDEO
  size: integer('size').notNull(), // in bytes
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // Adventure, Technical, Sales
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
