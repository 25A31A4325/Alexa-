import { renderLayout } from '../components/layout.js';
import { OrchestratorDatabase } from '@orchestra/orchestrator';

export function renderMissionsListPage(db: OrchestratorDatabase, ownerSessionId?: string): string {
  const missions = ownerSessionId
    ? (db as any).db.prepare(`
        SELECT m.* FROM missions m
        JOIN mission_owners o ON o.mission_id = m.id
        WHERE o.owner_session_id = ?
        ORDER BY m.created_at DESC
      `).all(ownerSessionId)
    : [];

  const bodyContent = `
    <div class="max-w-6xl mx-auto space-y-6 relative">
      <!-- Floating Bright Luminous Glass Bubbles Layer (High Visibility) -->
      <div class="absolute inset-0 pointer-events-none select-none overflow-visible z-20" aria-hidden="true">
        <!-- Bubble 1: Bright Blue Orb Top-Center -->
        <div class="absolute -top-5 right-1/4 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400/50 via-blue-500/40 to-sky-100/70 border-2 border-sky-400/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.95),0_0_25px_rgba(14,165,233,0.55),0_6px_20px_rgba(56,189,248,0.35)] backdrop-blur-xs" style="animation: floatBubbleA 6.5s ease-in-out infinite;">
          <div class="absolute top-1.5 left-2.5 w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white] rotate-[-35deg]"></div>
          <div class="absolute bottom-2 right-2.5 w-1.5 h-1.5 rounded-full bg-sky-200"></div>
        </div>
        <!-- Bubble 2: Bright Emerald Orb Mid-Left -->
        <div class="absolute top-20 -left-6 sm:-left-3 w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 to-emerald-100/70 border-2 border-emerald-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_24px_rgba(16,185,129,0.55)] backdrop-blur-xs" style="animation: floatBubbleB 8s ease-in-out infinite 1.2s;">
          <div class="absolute top-1.5 left-2 w-3 h-1.5 rounded-full bg-white shadow-[0_0_4px_white] rotate-[-30deg]"></div>
        </div>
        <!-- Bubble 3: Radiant Purple Orb Lower-Right -->
        <div class="absolute bottom-8 -right-4 sm:right-6 w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 to-indigo-100/70 border-2 border-indigo-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_25px_rgba(99,102,241,0.55)] backdrop-blur-xs" style="animation: floatBubbleC 7s ease-in-out infinite 0.8s;">
          <div class="absolute top-1.5 left-2 w-3 h-1.5 rounded-full bg-white shadow-[0_0_4px_white]"></div>
        </div>
        <!-- Bubble 4: Sparkling Cyan Orb Mid-Right -->
        <div class="absolute top-1/2 -right-3 w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400/60 via-blue-500/50 to-white/80 border-2 border-cyan-400/90 shadow-[0_0_20px_rgba(34,211,238,0.65)]" style="animation: floatBubbleA 5.5s ease-in-out infinite 2s;">
          <div class="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white"></div>
        </div>
      </div>

      <div class="flex items-center justify-between relative z-10">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Missions</h1>
          <p class="text-xs text-slate-500 mt-1">Real-time status of all autonomous agentic execution DAGs.</p>
        </div>
        <div class="flex items-center gap-3">
          <a href="/missions/demo-meeting-prep" class="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Demo: Meeting Preparation
          </a>
          <a href="/new" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
            + New Mission
          </a>
        </div>
      </div>

      <div class="space-y-3">
        ${
          missions.length === 0
            ? `<div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
                 <p class="text-sm font-medium text-slate-800">No missions found in persistent SQLite storage.</p>
                 <a href="/new" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm">Create a Mission</a>
               </div>`
            : missions.map((m: any) => `
                <div class="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition flex items-center justify-between">
                  <div class="space-y-1.5 min-w-0 pr-4">
                    <div class="flex items-center gap-2.5">
                      <span class="w-2.5 h-2.5 rounded-full ${
                        m.status === 'COMPLETED' ? 'bg-emerald-500' :
                        m.status === 'AWAITING_APPROVAL' ? 'bg-amber-500 animate-pulse' :
                        m.status === 'FAILED' ? 'bg-rose-500' : 'bg-blue-500'
                      }"></span>
                      <a href="/missions/${m.id}" class="text-sm font-bold text-slate-900 hover:text-blue-600 truncate block">
                        ${m.goal}
                      </a>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate-500">
                      <span>ID: <code class="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">${m.id}</code></span>
                      <span>Created: ${new Date(m.created_at).toLocaleString()}</span>
                      ${m.error_message ? `<span class="text-rose-600 font-medium">Error: ${m.error_message}</span>` : ''}
                    </div>
                  </div>

                  <div class="flex items-center gap-4 flex-shrink-0">
                    <span class="text-xs font-bold px-3 py-1 rounded-full border ${
                      m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      m.status === 'AWAITING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      m.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }">${m.status}</span>
                    <a href="/missions/${m.id}" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition">
                      Inspect →
                    </a>
                  </div>
                </div>
              `).join('')
        }
      </div>
    </div>
  `;

  return renderLayout({
    activeRoute: '/missions',
    isLightContent: true,
    title: 'ORCHESTRA — Missions',
    bodyContent
  });
}
