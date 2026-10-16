import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';

export interface KnowledgeDocumentRow {
  id: string;
  title: string;
  file_type: string;
  size: string;
  pages: number;
  category: string;
  summary: string;
  insights_json: string;
  action_items_json: string;
  content: string;
  is_local_demo: number;
  created_at: string;
}

export interface TaskRow {
  id: string;
  mission_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContextRow {
  key: string;
  value_json: string;
  mission_id: string | null;
  updated_at: string;
}

export interface ToolInvocationRow {
  id: string;
  tool_name: string;
  input_json: string;
  output_json: string;
  status: string;
  duration_ms: number;
  invoked_at: string;
}

export class ToolDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        file_type TEXT NOT NULL,
        size TEXT NOT NULL,
        pages INTEGER NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        insights_json TEXT NOT NULL,
        action_items_json TEXT NOT NULL,
        content TEXT NOT NULL,
        is_local_demo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS context_memory (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        mission_id TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_invocations (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        input_json TEXT NOT NULL,
        output_json TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        invoked_at TEXT NOT NULL
      );
    `);
  }

  public seedDemoKnowledge(force: boolean = false): void {
    const existing = this.db.prepare('SELECT COUNT(*) as cnt FROM knowledge_documents').get() as { cnt: number };
    if (existing && existing.cnt > 0 && !force) {
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO knowledge_documents 
      (id, title, file_type, size, pages, category, summary, insights_json, action_items_json, content, is_local_demo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    stmt.run(
      'doc-q4-roadmap',
      'Q4 Product Roadmap',
      'PDF',
      '4.2 MB',
      12,
      'meetings',
      'This document outlines the Q4 product roadmap, focusing on new feature releases, market expansion, and strategic partnerships. It includes timelines, key milestones, resource allocation, and risk assessment.',
      JSON.stringify([
        '3 major feature releases planned for Q4 2026',
        'Focus on AI-powered personalization and automation',
        'Expansion into international markets (APAC and Europe)',
        'Partnership opportunities with 5 key companies',
        'Identified potential risks in supply chain and regulatory compliance'
      ]),
      JSON.stringify([
        'Review and finalize feature specifications',
        'Prepare market expansion strategy for APAC',
        'Schedule partnership discussions',
        'Assess and mitigate identified risks'
      ]),
      'Q4 PRODUCT ROADMAP DISCUSSION BRIEF\n\nObjective: Align cross-functional leadership on Alexa+ agentic features.\nTarget Date: Tomorrow, 10:00 AM - 11:00 AM.\nKey Stakeholders: Product, Engineering, Design.\nKey Topics: Agent orchestration DAGs, self-hosted MCP server compatibility, verification pipelines.\nKnown Risks: Resource allocation bottleneck on model latency; dependency on human approval protocols.',
      '2026-10-10T10:00:00.000Z'
    );

    stmt.run(
      'doc-competitor-analysis',
      'Competitor Analysis',
      'DOCX',
      '1.8 MB',
      8,
      'research',
      'Analysis of competitive agentic orchestration frameworks and developer ecosystem trends in 2026.',
      JSON.stringify([
        'High market demand for truthful tool tracing over generic chatbots',
        'MCP emerging as the cross-platform tool standard'
      ]),
      JSON.stringify([
        'Benchmark execution latency across local and remote transports'
      ]),
      'COMPETITOR ANALYSIS REPORT 2026\n\nEnterprise AI systems are moving away from monolithic chatbots toward multi-step mission executors with verifiable tool invocations.',
      '2026-10-09T11:00:00.000Z'
    );

    stmt.run(
      'doc-market-trends',
      'Market Trends 2026',
      'Sheet',
      '2.1 MB',
      5,
      'data',
      'Data synthesis on agent adoption across Fortune 500 operations and autonomous execution frameworks.',
      JSON.stringify([
        '78% of enterprise engineering teams prioritize human-in-the-loop approvals for external mutations',
        'Multi-agent systems see 3.4x faster turnaround on research queries'
      ]),
      JSON.stringify([
        'Conduct deep dive on security gate architecture'
      ]),
      'MARKET TRENDS DATA MATRIX: Survey of 400 engineering leaders across cloud infrastructure.',
      '2026-10-08T10:00:00.000Z'
    );

    stmt.run(
      'doc-investor-notes',
      'Investor Meeting Notes',
      'PDF',
      '2.8 MB',
      6,
      'notes',
      'Detailed minutes and discussion notes from the Q3 investor update briefing and Q4 financial trajectory.',
      JSON.stringify([
        'Investors approved accelerated expansion into international market sectors',
        'Strong endorsement of open MCP interoperability strategy'
      ]),
      JSON.stringify([
        'Distribute finalized pitch slides to lead investors',
        'Prepare updated runway projections'
      ]),
      'INVESTOR MEETING NOTES — OCTOBER 2026\n\nAttendees: Executive Committee, Board Observers.\nKey Highlights: Demonstration of autonomous multi-tool missions received strong backing.',
      '2026-10-07T14:30:00.000Z'
    );

    stmt.run(
      'doc-product-requirements',
      'Product Requirements',
      'DOCX',
      '3.5 MB',
      15,
      'planning',
      'Comprehensive functional and technical PRD for the Alexa+ intelligent agentic mission execution platform.',
      JSON.stringify([
        'Strict requirement for zero-drift SHA-256 fingerprint validation',
        'Streamable HTTP transport mandated for real-time progress events',
        'Multi-pane responsive UI supporting both light and dark workspaces'
      ]),
      JSON.stringify([
        'Complete end-to-end integration tests for all 8 core views',
        'Verify zero hallucination safeguards across tool invocations'
      ]),
      'PRODUCT REQUIREMENTS DOCUMENT (PRD) — ALEXA+ AGENTIC PLATFORM\n\nVersion: 2.4\nStatus: Approved\nScope: Core Agent Orchestrator, Streamable MCP Client & Server, Interactive Web Workspace.',
      '2026-10-05T09:15:00.000Z'
    );
  }

  // --- Knowledge Methods ---
  public searchKnowledge(query: string, category: string = 'all', limit: number = 5): KnowledgeDocumentRow[] {
    let sql = 'SELECT * FROM knowledge_documents WHERE 1=1';
    const params: (string | number)[] = [];

    if (category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (query && query.trim() !== '') {
      sql += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
      const term = `%${query.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' LIMIT ?';
    params.push(limit);

    return this.db.prepare(sql).all(...params) as unknown as KnowledgeDocumentRow[];
  }

  public getDocument(id: string): KnowledgeDocumentRow | undefined {
    return this.db.prepare('SELECT * FROM knowledge_documents WHERE id = ?').get(id) as unknown as KnowledgeDocumentRow | undefined;
  }

  // --- Task Methods ---
  public createTask(missionId: string, title: string, description: string = '', priority: string = 'medium'): TaskRow {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO tasks (id, mission_id, title, description, priority, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', '', ?, ?)
    `).run(id, missionId, title, description, priority, now, now);

    return this.getTask(id)!;
  }

  public updateTask(id: string, status: string, notes?: string): TaskRow | undefined {
    const existing = this.getTask(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const updatedNotes = notes !== undefined ? notes : existing.notes;

    this.db.prepare(`
      UPDATE tasks SET status = ?, notes = ?, updated_at = ? WHERE id = ?
    `).run(status, updatedNotes, now, id);

    return this.getTask(id);
  }

  public getTask(id: string): TaskRow | undefined {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined;
  }

  public getTasksByMission(missionId: string): TaskRow[] {
    return this.db.prepare('SELECT * FROM tasks WHERE mission_id = ? ORDER BY created_at ASC').all(missionId) as unknown as TaskRow[];
  }

  // --- Context Memory Methods ---
  public saveContext(key: string, value: unknown, missionId?: string): ContextRow {
    const now = new Date().toISOString();
    const valJson = JSON.stringify(value);
    this.db.prepare(`
      INSERT OR REPLACE INTO context_memory (key, value_json, mission_id, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(key, valJson, missionId ?? null, now);

    return {
      key,
      value_json: valJson,
      mission_id: missionId ?? null,
      updated_at: now
    };
  }

  public getContext(keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const stmt = this.db.prepare('SELECT value_json FROM context_memory WHERE key = ?');
    for (const k of keys) {
      const row = stmt.get(k) as { value_json: string } | undefined;
      if (row) {
        try {
          result[k] = JSON.parse(row.value_json);
        } catch {
          result[k] = row.value_json;
        }
      }
    }
    return result;
  }

  // --- Tool Invocation Logging ---
  public logToolInvocation(toolName: string, input: unknown, output: unknown, status: string, durationMs: number): void {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO tool_invocations (id, tool_name, input_json, output_json, status, duration_ms, invoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, toolName, JSON.stringify(input), JSON.stringify(output), status, durationMs, now);
  }

  public close(): void {
    this.db.close();
  }
}
