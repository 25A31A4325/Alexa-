import { renderLayout } from '../components/layout.js';
import { OrchestratorDatabase } from '@orchestra/orchestrator';

export function renderPlanPage(db: OrchestratorDatabase): string {
  const missions = (db as any).db ? (db as any).db.prepare('SELECT * FROM missions ORDER BY created_at DESC LIMIT 10').all() : [];
  const activeMission = missions.find((m: any) => m.goal && (m.goal.toLowerCase().includes('roadmap') || m.goal.toLowerCase().includes('investor') || m.goal.toLowerCase().includes('meeting') || m.goal.toLowerCase().includes('product')))
    || missions.find((m: any) => m.status === 'PLANNING' || m.status === 'EXECUTING' || m.status === 'AWAITING_APPROVAL')
    || missions[0];
  const dbTasks = activeMission ? db.getTasksForMission(activeMission.id) : [];

  const defaultSteps = [
    { num: 1, title: 'Check calendar and meeting details', desc: 'Query calendar API for tomorrow 10:00 AM meeting "Product Roadmap Discussion"', status: 'in_progress', time: 'Running', tool: 'calendar_read_events' },
    { num: 2, title: 'Identify attendee profiles and agenda requirements', desc: 'Scan attendee list, past meeting notes, and sync requirements', status: 'pending', time: 'Pending', tool: 'calendar_read_events' },
    { num: 3, title: 'Search knowledge base for Q4 Product Roadmap specifications', desc: 'Retrieve Q4_Roadmap.pdf and Competitor_Analysis.docx from internal store', status: 'pending', time: 'Pending', tool: 'search_knowledge' },
    { num: 4, title: 'Analyze document content, decisions, and risk items', desc: 'Deep document extraction for key decisions, milestones, and open questions', status: 'pending', time: 'Pending', tool: 'document_analysis' },
    { num: 5, title: 'Create prioritized preparation checklist', desc: 'Synthesize gap analysis into 4 actionable prep items with priority scoring', status: 'pending', time: 'Pending', tool: 'create_task' },
    { num: 6, title: 'Draft notification reminders for key stakeholders', desc: 'Schedule alarm notifications and calendar alert offsets (requires approval gate)', status: 'pending', time: 'Pending', tool: 'calendar_create_reminder' },
    { num: 7, title: 'Finalize and independently verify deliverable integrity', desc: 'Autonomous verification engine evaluating contract coverage and audit proofs', status: 'pending', time: 'Pending', tool: 'verify_action' },
  ];

  const steps = dbTasks.length >= 7 ? dbTasks.map((t: any, idx: number) => ({
    num: idx + 1,
    title: t.title,
    desc: `Tool: ${t.tool_name} — Stage ${idx + 1} in validated DAG dependency graph`,
    status: t.status,
    time: t.duration_ms ? `${Math.round(t.duration_ms / 1000)}s` : t.status === 'in_progress' ? 'Running' : 'Pending',
    tool: t.tool_name
  })) : defaultSteps;

  const completedStepsCount = steps.filter((s: any) => s.status === 'completed').length;

  const tools = [
    { name: 'Calendar', desc: 'Reads calendar schedules, agendas, and attendee lists', icon: '📅', status: 'Active' },
    { name: 'Knowledge Search', desc: 'Semantic search over PDFs, roadmaps, and briefs', icon: '🔍', status: 'Active' },
    { name: 'Document Analysis', desc: 'Extracts decisions, talking points, and risks', icon: '📄', status: 'Active' },
    { name: 'Task Management', desc: 'Drafts and organizes prioritized preparation items', icon: '✅', status: 'Running' },
    { name: 'Notifications', desc: 'Schedules calendar reminder alarms (Gated)', icon: '🔔', status: 'Gated' }
  ];

  const services = [
    { name: 'Google Calendar', icon: '📆', connected: true },
    { name: 'Gmail', icon: '✉️', connected: true },
    { name: 'Notion', icon: '📓', connected: true },
    { name: 'Google Drive', icon: '📁', connected: true }
  ];

  const bodyContent = `
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Top Breadcrumbs & Sub-Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span class="text-blue-500">
            <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </span>
          <a href="/missions?view=list" class="text-blue-600 hover:underline">Mission</a>
          <span class="text-slate-400">›</span>
          <a href="/missions" class="text-blue-600 hover:underline">Meeting Preparation</a>
          <span class="text-slate-400">›</span>
          <span class="text-slate-800 font-bold">Execution Plan</span>
        </div>

        <!-- Sub-Navigation Links -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <a href="/missions" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Mission</a>
          <a href="/new" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Chat</a>
          <a href="/plan" class="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg transition">Plan</a>
          <a href="/tools" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Tool Execution</a>
          <a href="/results" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Results</a>
        </div>
      </div>

      <!-- Main Header Banner -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
              📋
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">Execution Plan</h1>
              <p class="text-xs text-slate-500 mt-1">Autonomous multi-step DAG with dependency safety gates and real-time execution telemetry.</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            DAG Active
          </span>
          <a href="/results" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
            View Deliverables →
          </a>
        </div>
      </div>

      <!-- Two-Column Plan Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: Numbered Vertical Execution Workflow Steps (1 to 7) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900">Workflow Steps (7)</h2>
            <span class="text-xs text-slate-500 font-medium">${completedStepsCount} of ${steps.length} steps completed</span>
          </div>

          <div class="space-y-3.5">
            ${steps.map((s: any) => {
              const isCompleted = s.status === 'completed';
              const isInProgress = s.status === 'in_progress';
              
              return `
                <div class="p-4 rounded-xl border transition-all ${
                  isInProgress ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-100 shadow-sm' :
                  isCompleted ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-50' :
                  'bg-white border-slate-200/80 hover:bg-slate-50'
                }">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3.5 min-w-0">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        isCompleted ? 'bg-emerald-600 text-white shadow-xs' :
                        isInProgress ? 'bg-blue-600 text-white ring-2 ring-blue-200 shadow-xs animate-pulse' :
                        'border-2 border-slate-300 text-slate-500'
                      }">
                        ${isCompleted ? '✓' : isInProgress ? '+' : s.num}
                      </div>
                      <div class="min-w-0">
                        <span class="text-xs font-bold ${isInProgress ? 'text-blue-900' : 'text-slate-900'} block">
                          Step ${s.num}: ${s.title}
                        </span>
                        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          ${s.desc}
                        </p>
                        <span class="inline-block mt-2 font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          tool: ${s.tool}
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                      <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isInProgress ? 'bg-blue-600 text-white border-blue-600 animate-pulse' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }">
                        ${isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                      </span>
                      <span class="text-[10px] text-slate-400 font-mono">${s.time}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right Column: Tools to be used & Connected Services -->
        <div class="lg:col-span-5 space-y-5">
          
          <!-- Card 1: Tools to be used -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 class="text-sm font-bold text-slate-900">Tools to be used</h2>
              <a href="/tools" class="text-xs font-semibold text-blue-600 hover:underline">View all</a>
            </div>

            <div class="space-y-2.5">
              ${tools.map(t => `
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-lg">${t.icon}</span>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-900 block truncate">${t.name}</span>
                      <span class="text-[11px] text-slate-500 block truncate">${t.desc}</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    t.status === 'Running' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }">${t.status}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Card 2: Connected Services -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 class="text-sm font-bold text-slate-900">Connected Services</h2>
              <a href="/integrations" class="text-xs font-semibold text-blue-600 hover:underline">Manage</a>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              ${services.map(s => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <span class="text-base">${s.icon}</span>
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-slate-800 block truncate">${s.name}</span>
                    <span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Connected
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  return renderLayout({
    activeRoute: '/plan',
    isLightContent: true,
    title: 'ORCHESTRA — Execution Plan',
    bodyContent
  });
}
