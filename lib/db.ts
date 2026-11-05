import { neon, neonConfig } from "@neondatabase/serverless";

// Optional Neon connection configuration for edge/serverless environments
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL || "";

// Neon Serverless SQL executor
export const sql = neon(databaseUrl || "postgresql://placeholder:placeholder@localhost/db");

// In-memory fallback storage in case DATABASE_URL is not yet connected to a live Neon instance
interface FallbackData {
  users: Array<{ id: string; email: string; full_name: string | null; created_at: string }>;
  projects: Array<{
    id: number;
    user_id: string;
    name: string;
    description: string | null;
    github_url: string | null;
    is_public: boolean;
    share_token: string;
    risk_score: number;
    progress_pct: number;
    created_at: string;
  }>;
  daily_logs: Array<{
    id: number;
    project_id: number;
    user_id: string;
    raw_input: string;
    ai_summary: string;
    created_at: string;
  }>;
  community_posts: Array<{
    id: number;
    user_id: string;
    title: string;
    content: string;
    post_type: "idea" | "showcase";
    likes_count: number;
    created_at: string;
  }>;
  post_comments: Array<{
    id: number;
    post_id: number;
    user_id: string;
    comment_text: string;
    created_at: string;
  }>;
  tasks: Array<{
    id: number;
    project_id: number;
    title: string;
    status: string;
    assignee: string;
    priority: string;
    days_in_status: number;
  }>;
}

const fallbackStore: FallbackData = {
  users: [
    {
      id: "user_demo_1",
      email: "lead@shippilot.dev",
      full_name: "Alex Vance (Lead)",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      id: "user_demo_2",
      email: "sarah.chen@shippilot.dev",
      full_name: "Sarah Chen",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
  ],
  projects: [
    {
      id: 1,
      user_id: "user_demo_1",
      name: "Core Payment & Checkout Refactor",
      description: "Migrating from legacy billing to usage-based Stripe integration with 3DS authorization.",
      github_url: "https://github.com/shippilot/core-checkout",
      is_public: true,
      share_token: "sp-tok-checkout-refactor-992",
      risk_score: 65,
      progress_pct: 68,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
    {
      id: 2,
      user_id: "user_demo_1",
      name: "AI Copilot Search Engine",
      description: "Low-latency vector similarity search service using Postgres pgvector and Groq inference.",
      github_url: "https://github.com/shippilot/ai-copilot",
      is_public: true,
      share_token: "sp-tok-ai-copilot-412",
      risk_score: 25,
      progress_pct: 45,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
  ],
  daily_logs: [
    {
      id: 1,
      project_id: 1,
      user_id: "user_demo_1",
      raw_input: "Refactored checkout webhook endpoint and wrote unit tests for idempotency keys. Hit a roadblock with Stripe 3DS sandbox simulated cards.",
      ai_summary: "Completed checkout webhook refactor with idempotency test coverage. Identified blocker with Stripe 3DS card simulation requiring sandbox config review.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
  ],
  community_posts: [
    {
      id: 1,
      user_id: "user_demo_1",
      title: "How we dropped LLM latency to 280ms with Groq LLaMA 3.3",
      content: "Switching from standard API providers to Groq's LPUs cut our automated risk audit latency by 72%. We use structured JSON schemas to parse daily standup logs directly into Neon Postgres.",
      post_type: "showcase",
      likes_count: 24,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      id: 2,
      user_id: "user_demo_2",
      title: "Idea: Autonomous PR code reviewer directly on stalled Jira/Linear tickets",
      content: "What if when a task stagnates for >48 hours in In-Review, an AI agent auto-generates a sanity check diff and flags high-risk architectural anomalies to unblock the team?",
      post_type: "idea",
      likes_count: 17,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
  ],
  post_comments: [
    {
      id: 1,
      post_id: 1,
      user_id: "user_demo_2",
      comment_text: "Groq inference speed is insane! Are you running 70b or 8b for the log summarizer?",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 2,
      post_id: 2,
      user_id: "user_demo_1",
      comment_text: "Love this idea. We can tie this into the ShipPilot webhook listener so it pings the assignee directly.",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ],
  tasks: [
    {
      id: 1,
      project_id: 1,
      title: "Implement Stripe 3DS Webhook Listener",
      status: "Blocked",
      assignee: "", // Unassigned blocker! (+25 risk)
      priority: "Critical",
      days_in_status: 5, // Stagnant (+15 risk)
    },
    {
      id: 2,
      project_id: 1,
      title: "Migrate Subscriptions to Usage-Based Billing",
      status: "In Progress",
      assignee: "Alex Vance",
      priority: "High",
      days_in_status: 4,
    },
    {
      id: 3,
      project_id: 1,
      title: "Refactor Cart Session Redis Caching",
      status: "In Review",
      assignee: "David Kim",
      priority: "Medium",
      days_in_status: 2,
    },
    {
      id: 4,
      project_id: 1,
      title: "Update Checkout Error Boundary Fallbacks",
      status: "Done",
      assignee: "Sarah Chen",
      priority: "Low",
      days_in_status: 1,
    },
  ],
};

let tablesInitialized = false;

/**
 * Initializes Neon PostgreSQL tables according to the exact schema specification
 */
export async function initializeDatabaseSchema(): Promise<boolean> {
  if (tablesInitialized) return true;
  if (!databaseUrl || databaseUrl.includes("placeholder")) {
    tablesInitialized = true;
    return false;
  }

  try {
    // 1. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        full_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        github_url TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        share_token TEXT UNIQUE,
        risk_score INT DEFAULT 10,
        progress_pct INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Daily logs table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        raw_input TEXT NOT NULL,
        ai_summary TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Community posts table
    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        post_type TEXT CHECK (post_type IN ('idea', 'showcase')) DEFAULT 'showcase',
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. Post comments table
    await sql`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Optional tasks table to support granular blocker & stagnation calculations
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'In Progress',
        assignee TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'Medium',
        days_in_status INT DEFAULT 0
      );
    `;

    tablesInitialized = true;
    return true;
  } catch (error) {
    console.warn("[Neon Database] Migration check skipped or failed, fallback active:", error);
    tablesInitialized = true;
    return false;
  }
}

// Database query helpers with transparent Neon DB and reliable fallback

export async function ensureUser(user: { id: string; email: string; fullName?: string | null }) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const existing = await sql`SELECT id FROM users WHERE id = ${user.id} LIMIT 1`;
      if (!existing || existing.length === 0) {
        await sql`
          INSERT INTO users (id, email, full_name)
          VALUES (${user.id}, ${user.email}, ${user.fullName || null})
          ON CONFLICT (id) DO UPDATE SET email = ${user.email}, full_name = ${user.fullName || null}
        `;
      }
      return user;
    }
  } catch (err) {
    console.warn("[db.ensureUser] Neon error, using fallback store:", err);
  }

  const existing = fallbackStore.users.find((u) => u.id === user.id);
  if (!existing) {
    fallbackStore.users.push({
      id: user.id,
      email: user.email,
      full_name: user.fullName || "Developer",
      created_at: new Date().toISOString(),
    });
  }
  return user;
}

export async function getProjects(userId?: string) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      if (userId) {
        return await sql`
          SELECT * FROM projects 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
        `;
      }
      return await sql`SELECT * FROM projects ORDER BY created_at DESC`;
    }
  } catch (err) {
    console.warn("[db.getProjects] Neon error, using fallback store:", err);
  }

  if (userId) {
    return fallbackStore.projects.filter((p) => p.user_id === userId || p.user_id === "user_demo_1");
  }
  return fallbackStore.projects;
}

export async function getProjectById(projectId: number | string) {
  await initializeDatabaseSchema();
  const numId = Number(projectId);
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = isNaN(numId)
        ? await sql`SELECT * FROM projects WHERE share_token = ${String(projectId)} LIMIT 1`
        : await sql`SELECT * FROM projects WHERE id = ${numId} OR share_token = ${String(projectId)} LIMIT 1`;
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (err) {
    console.warn("[db.getProjectById] Neon error, using fallback store:", err);
  }

  return fallbackStore.projects.find((p) => p.id === numId || p.share_token === String(projectId)) || fallbackStore.projects[0];
}

export async function createProject(data: {
  userId: string;
  name: string;
  description?: string;
  githubUrl?: string;
  isPublic?: boolean;
}) {
  await initializeDatabaseSchema();
  const shareToken = "sp-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36);
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = await sql`
        INSERT INTO projects (user_id, name, description, github_url, is_public, share_token, risk_score, progress_pct)
        VALUES (
          ${data.userId},
          ${data.name},
          ${data.description || null},
          ${data.githubUrl || null},
          ${data.isPublic ?? false},
          ${shareToken},
          15,
          0
        )
        RETURNING *
      `;
      return rows[0];
    }
  } catch (err) {
    console.warn("[db.createProject] Neon error, using fallback store:", err);
  }

  const newProj = {
    id: fallbackStore.projects.length + 1,
    user_id: data.userId,
    name: data.name,
    description: data.description || null,
    github_url: data.githubUrl || null,
    is_public: data.isPublic ?? false,
    share_token: shareToken,
    risk_score: 15,
    progress_pct: 0,
    created_at: new Date().toISOString(),
  };
  fallbackStore.projects.unshift(newProj);
  return newProj;
}

export async function getDailyLogs(projectId: number) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      return await sql`
        SELECT * FROM daily_logs 
        WHERE project_id = ${projectId} 
        ORDER BY created_at DESC
      `;
    }
  } catch (err) {
    console.warn("[db.getDailyLogs] Neon error, using fallback store:", err);
  }

  return fallbackStore.daily_logs.filter((l) => l.project_id === projectId);
}

export async function saveDailyLog(data: {
  projectId: number;
  userId: string;
  rawInput: string;
  aiSummary: string;
  riskScore: number;
  progressPct?: number;
}) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      // 1. Insert daily log
      const logRows = await sql`
        INSERT INTO daily_logs (project_id, user_id, raw_input, ai_summary)
        VALUES (${data.projectId}, ${data.userId}, ${data.rawInput}, ${data.aiSummary})
        RETURNING *
      `;

      // 2. Update project risk score and progress pct
      const progressClause = typeof data.progressPct === "number" ? data.progressPct : null;
      if (progressClause !== null) {
        await sql`
          UPDATE projects
          SET risk_score = ${data.riskScore}, progress_pct = ${progressClause}
          WHERE id = ${data.projectId}
        `;
      } else {
        await sql`
          UPDATE projects
          SET risk_score = ${data.riskScore}
          WHERE id = ${data.projectId}
        `;
      }

      return logRows[0];
    }
  } catch (err) {
    console.warn("[db.saveDailyLog] Neon error, using fallback store:", err);
  }

  const newLog = {
    id: fallbackStore.daily_logs.length + 1,
    project_id: data.projectId,
    user_id: data.userId,
    raw_input: data.rawInput,
    ai_summary: data.aiSummary,
    created_at: new Date().toISOString(),
  };
  fallbackStore.daily_logs.unshift(newLog);

  const proj = fallbackStore.projects.find((p) => p.id === data.projectId);
  if (proj) {
    proj.risk_score = data.riskScore;
    if (typeof data.progressPct === "number") {
      proj.progress_pct = data.progressPct;
    }
  }

  return newLog;
}

export async function getProjectTasks(projectId: number) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = await sql`
        SELECT * FROM tasks 
        WHERE project_id = ${projectId}
        ORDER BY priority DESC, days_in_status DESC
      `;
      if (rows && rows.length > 0) return rows;
    }
  } catch (err) {
    console.warn("[db.getProjectTasks] Neon error, using fallback store:", err);
  }

  return fallbackStore.tasks.filter((t) => t.project_id === projectId);
}

export async function createProjectTask(data: {
  projectId: number;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  daysInStatus?: number;
}) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = await sql`
        INSERT INTO tasks (project_id, title, status, assignee, priority, days_in_status)
        VALUES (${data.projectId}, ${data.title}, ${data.status}, ${data.assignee}, ${data.priority}, ${data.daysInStatus || 0})
        RETURNING *
      `;
      return rows[0];
    }
  } catch (err) {
    console.warn("[db.createProjectTask] Neon error, using fallback store:", err);
  }

  const newTask = {
    id: fallbackStore.tasks.length + 1,
    project_id: data.projectId,
    title: data.title,
    status: data.status,
    assignee: data.assignee,
    priority: data.priority,
    days_in_status: data.daysInStatus || 0,
  };
  fallbackStore.tasks.push(newTask);
  return newTask;
}

// Community Data Helpers

export async function getCommunityFeed() {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const posts = await sql`
        SELECT 
          p.id, 
          p.user_id, 
          p.title, 
          p.content, 
          p.post_type, 
          p.likes_count, 
          p.created_at,
          COALESCE(u.full_name, 'Developer') as author_name,
          COALESCE(u.email, 'dev@shippilot.io') as author_email,
          (SELECT COUNT(*)::int FROM post_comments c WHERE c.post_id = p.id) as comments_count
        FROM community_posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `;

      const publicProjects = await sql`
        SELECT 
          pr.id,
          pr.name,
          pr.description,
          pr.github_url,
          pr.risk_score,
          pr.progress_pct,
          pr.share_token,
          pr.created_at,
          COALESCE(u.full_name, 'Project Lead') as author_name
        FROM projects pr
        LEFT JOIN users u ON pr.user_id = u.id
        WHERE pr.is_public = TRUE
        ORDER BY pr.created_at DESC
        LIMIT 10
      `;

      return { posts, publicProjects };
    }
  } catch (err) {
    console.warn("[db.getCommunityFeed] Neon error, using fallback store:", err);
  }

  const posts = fallbackStore.community_posts.map((p) => {
    const author = fallbackStore.users.find((u) => u.id === p.user_id);
    const commentsCount = fallbackStore.post_comments.filter((c) => c.post_id === p.id).length;
    return {
      ...p,
      author_name: author?.full_name || "Developer",
      author_email: author?.email || "dev@shippilot.io",
      comments_count: commentsCount,
    };
  });

  const publicProjects = fallbackStore.projects
    .filter((pr) => pr.is_public)
    .map((pr) => {
      const author = fallbackStore.users.find((u) => u.id === pr.user_id);
      return {
        ...pr,
        author_name: author?.full_name || "Project Lead",
      };
    });

  return { posts, publicProjects };
}

export async function createCommunityPost(data: {
  userId: string;
  title: string;
  content: string;
  postType: "idea" | "showcase";
}) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = await sql`
        INSERT INTO community_posts (user_id, title, content, post_type, likes_count)
        VALUES (${data.userId}, ${data.title}, ${data.content}, ${data.postType}, 0)
        RETURNING *
      `;
      return rows[0];
    }
  } catch (err) {
    console.warn("[db.createCommunityPost] Neon error, using fallback store:", err);
  }

  const newPost = {
    id: fallbackStore.community_posts.length + 1,
    user_id: data.userId,
    title: data.title,
    content: data.content,
    post_type: data.postType,
    likes_count: 0,
    created_at: new Date().toISOString(),
  };
  fallbackStore.community_posts.unshift(newPost);
  return newPost;
}

export async function likeCommunityPost(postId: number) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const rows = await sql`
        UPDATE community_posts
        SET likes_count = likes_count + 1
        WHERE id = ${postId}
        RETURNING likes_count
      `;
      if (rows && rows.length > 0) return rows[0].likes_count;
    }
  } catch (err) {
    console.warn("[db.likeCommunityPost] Neon error, using fallback store:", err);
  }

  const post = fallbackStore.community_posts.find((p) => p.id === postId);
  if (post) {
    post.likes_count += 1;
    return post.likes_count;
  }
  return 1;
}

export async function getPostComments(postId: number) {
  await initializeDatabaseSchema();
  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      return await sql`
        SELECT 
          c.id, 
          c.post_id, 
          c.user_id, 
          c.comment_text, 
          c.created_at,
          COALESCE(u.full_name, 'Developer') as author_name,
          COALESCE(u.email, 'dev@shippilot.io') as author_email
        FROM post_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ${postId}
        ORDER BY c.created_at ASC
      `;
    }
  } catch (err) {
    console.warn("[db.getPostComments] Neon error, using fallback store:", err);
  }

  return fallbackStore.post_comments
    .filter((c) => c.post_id === postId)
    .map((c) => {
      const user = fallbackStore.users.find((u) => u.id === c.user_id);
      return {
        ...c,
        author_name: user?.full_name || "Developer",
        author_email: user?.email || "dev@shippilot.io",
      };
    });
}

export async function addPostComment(data: {
  postId: number;
  userId: string;
  commentText: string;
}) {
  await initializeDatabaseSchema();
  let postAuthorEmail: string | null = null;
  let postTitle: string = "your community post";

  try {
    if (databaseUrl && !databaseUrl.includes("placeholder")) {
      const commentRows = await sql`
        INSERT INTO post_comments (post_id, user_id, comment_text)
        VALUES (${data.postId}, ${data.userId}, ${data.commentText})
        RETURNING *
      `;

      // Fetch author details for notification
      const postRows = await sql`
        SELECT p.title, u.email, u.full_name
        FROM community_posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ${data.postId}
        LIMIT 1
      `;
      if (postRows && postRows.length > 0) {
        postAuthorEmail = postRows[0].email;
        postTitle = postRows[0].title;
      }

      return {
        comment: commentRows[0],
        postAuthorEmail,
        postTitle,
      };
    }
  } catch (err) {
    console.warn("[db.addPostComment] Neon error, using fallback store:", err);
  }

  const newComment = {
    id: fallbackStore.post_comments.length + 1,
    post_id: data.postId,
    user_id: data.userId,
    comment_text: data.commentText,
    created_at: new Date().toISOString(),
  };
  fallbackStore.post_comments.push(newComment);

  const post = fallbackStore.community_posts.find((p) => p.id === data.postId);
  if (post) {
    postTitle = post.title;
    const author = fallbackStore.users.find((u) => u.id === post.user_id);
    postAuthorEmail = author?.email || "author@example.com";
  }

  return {
    comment: newComment,
    postAuthorEmail,
    postTitle,
  };
}
