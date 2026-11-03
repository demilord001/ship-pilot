-- ShipPilot Neon PostgreSQL Schema Setup

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    risk_score INT DEFAULT 25,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'In Progress', -- 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked'
    assignee TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    days_in_status INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_summary TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sample Seed Data for immediate testing
INSERT INTO users (id, email, full_name)
VALUES ('user_demo_pilot', 'demo@shippilot.dev', 'Alex Mercer (Lead)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, user_id, name, risk_score)
VALUES (1, 'user_demo_pilot', 'Core Payment & Checkout Refactor', 74)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (project_id, title, status, assignee, priority, days_in_status)
VALUES 
(1, 'Implement Stripe 3DS Webhook Listener', 'Blocked', 'Sarah Chen', 'Critical', 5),
(1, 'Migrate Subscriptions to Usage-Based Billing', 'In Progress', 'Alex Mercer', 'High', 4),
(1, 'Refactor Cart Session Redis Caching', 'In Review', 'David Kim', 'Medium', 2),
(1, 'Update Checkout Error Boundary Fallbacks', 'Done', 'Sarah Chen', 'Low', 1),
(1, 'Stripe Radar Rule Set Tuning', 'To Do', 'Marcus Vance', 'High', 0)
ON CONFLICT DO NOTHING;

INSERT INTO ai_insights (project_id, issue_summary, suggested_action, severity)
VALUES
(1, 'Stripe 3DS Webhook Listener has been blocked for 5 days. Critical path for Checkout launch is stalling.', 'Reassign senior integration engineer to unblock webhook verification sandbox; review Stripe TLS certificate configs.', 'Critical'),
(1, 'Usage-Based Billing task is 4 days in progress with no PR update. Risk of sprint scope slippage.', 'Break billing migration into two incremental sub-deliverables: metering ingest first, rate-limiting second.', 'High')
ON CONFLICT DO NOTHING;
