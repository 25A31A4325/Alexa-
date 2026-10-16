import { renderLayout } from '../components/layout.js';
import { OrchestratorDatabase } from '@orchestra/orchestrator';

export function renderResultsPage(db: OrchestratorDatabase): string {
  const missions = (db as any).db ? (db as any).db.prepare('SELECT * FROM missions ORDER BY created_at DESC LIMIT 10').all() : [];
  const completedMissions = missions.filter((m: any) => m.status === 'COMPLETED');
  const activeMission = completedMissions[0] || (missions.length > 0 ? missions[0] : null);
  const missionId = activeMission ? activeMission.id : 'demo-meeting-prep';
  const verification = db.getVerificationResult(missionId);
  const confidenceScore = verification ? Math.round(verification.confidence_score * 100) : 94;
  const missionSummaryText = verification ? verification.summary : 'Autonomous preparation briefing generated, verified, and cross-referenced in 24 seconds.';

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
          <span class="text-slate-800 font-bold">Results</span>
        </div>

        <!-- Sub-Navigation Links -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <a href="/missions" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Mission</a>
          <a href="/new" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Chat</a>
          <a href="/plan" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Plan</a>
          <a href="/tools" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Tool Execution</a>
          <a href="/results" class="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg transition">Results</a>
        </div>
      </div>

      <!-- Header Banner: Green Check Icon & Action Buttons -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xl font-bold flex-shrink-0 shadow-sm">
            ✓
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">Your request is complete!</h1>
              <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Score: ${confidenceScore}%
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">${missionSummaryText}</p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-shrink-0">
          <button type="button" onclick="exportResultsJSON()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition shadow-2xs flex items-center gap-1.5 cursor-pointer">
            <span>⬇ Export</span>
          </button>
          <button type="button" onclick="saveToNotionSim()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer">
            <span>📓 Save to Notion</span>
          </button>
        </div>
      </div>

      <!-- Tabs Navigation (Summary | Action Plan | Key Insights | Sources | Tool Activity) -->
      <div class="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
        <button type="button" onclick="switchResultsTab('summary')" id="rtab-btn-summary" class="rtab-btn text-xs font-bold text-blue-600 border-b-2 border-blue-600 pb-3 px-4 transition cursor-pointer">
          Summary
        </button>
        <button type="button" onclick="switchResultsTab('action-plan')" id="rtab-btn-action-plan" class="rtab-btn text-xs font-medium text-slate-500 hover:text-slate-800 pb-3 px-4 transition cursor-pointer">
          Action Plan
        </button>
        <button type="button" onclick="switchResultsTab('insights')" id="rtab-btn-insights" class="rtab-btn text-xs font-medium text-slate-500 hover:text-slate-800 pb-3 px-4 transition cursor-pointer">
          Key Insights
        </button>
        <button type="button" onclick="switchResultsTab('sources')" id="rtab-btn-sources" class="rtab-btn text-xs font-medium text-slate-500 hover:text-slate-800 pb-3 px-4 transition cursor-pointer">
          Sources
        </button>
        <button type="button" onclick="switchResultsTab('activity')" id="rtab-btn-activity" class="rtab-btn text-xs font-medium text-slate-500 hover:text-slate-800 pb-3 px-4 transition cursor-pointer">
          Tool Activity
        </button>
      </div>

      <!-- TAB CONTENT 1: Summary (Default Active) -->
      <div id="rtab-panel-summary" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Summary Card (Meeting Prep Bullet Points) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900">Executive Meeting Briefing</h2>
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">✓ Verified</span>
          </div>

          <div class="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-800 leading-relaxed">
            <strong>Meeting:</strong> Product Roadmap Discussion &bull; Tomorrow, 10:00 AM – 11:00 AM on Google Meet
          </div>

          <div class="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div class="flex items-start gap-2.5">
              <span class="text-blue-600 font-bold mt-0.5">•</span>
              <div>
                <strong>Q1 Feature Roadmap Alignment:</strong> The primary objective is to review prioritized deliverables across the 3 engineering pods and lock down release milestones.
              </div>
            </div>

            <div class="flex items-start gap-2.5">
              <span class="text-blue-600 font-bold mt-0.5">•</span>
              <div>
                <strong>Engineering Staffing Requests:</strong> Analysis of <code class="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Q4_Roadmap.pdf</code> indicates 2 open backend positions need stakeholder sign-off before sprint kickoff.
              </div>
            </div>

            <div class="flex items-start gap-2.5">
              <span class="text-blue-600 font-bold mt-0.5">•</span>
              <div>
                <strong>Budget Contingency Strategy:</strong> Review contingency plans for cloud infrastructure scaling based on Q3 surge metrics in <code class="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Competitor_Analysis.docx</code>.
              </div>
            </div>

            <div class="flex items-start gap-2.5">
              <span class="text-blue-600 font-bold mt-0.5">•</span>
              <div>
                <strong>Identified Timeline Risk:</strong> Database migration v2 has a 4-day critical dependency on data pipeline refactoring that must be explicitly discussed.
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps Task Checklist with Blue Start Buttons and Set Reminders Toggles -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900">Next Steps Checklist</h2>
            <span class="text-xs text-slate-500 font-medium">4 Action Items</span>
          </div>

          <div class="space-y-3.5">
            <!-- Item 1 -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-bold text-slate-900 leading-snug">Review Q1 Roadmap slides (pages 3–7)</span>
                <span class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">15 min</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input type="checkbox" onchange="toggleReminder(this, 'Review Q1 Roadmap slides')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span>Set Reminder</span>
                </label>
                <button type="button" onclick="startTaskSim(this, 'Review Q1 Roadmap slides')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs">
                  Start →
                </button>
              </div>
            </div>

            <!-- Item 2 -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-bold text-slate-900 leading-snug">Confirm headcount numbers with Engineering Lead</span>
                <span class="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">High</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input type="checkbox" onchange="toggleReminder(this, 'Confirm headcount numbers')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <span>Set Reminder</span>
                </label>
                <button type="button" onclick="startTaskSim(this, 'Confirm headcount numbers')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs">
                  Start →
                </button>
              </div>
            </div>

            <!-- Item 3 -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-bold text-slate-900 leading-snug">Prepare talking points on budget approval contingency</span>
                <span class="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">Medium</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input type="checkbox" onchange="toggleReminder(this, 'Prepare talking points')" class="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Set Reminder</span>
                </label>
                <button type="button" onclick="startTaskSim(this, 'Prepare talking points')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs">
                  Start →
                </button>
              </div>
            </div>

            <!-- Item 4 -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-bold text-slate-900 leading-snug">Confirm attendance with Stakeholder Sync team</span>
                <span class="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">Low</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input type="checkbox" onchange="toggleReminder(this, 'Confirm attendance')" class="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Set Reminder</span>
                </label>
                <button type="button" onclick="startTaskSim(this, 'Confirm attendance')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs">
                  Start →
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- TAB CONTENT 2: Action Plan (Hidden by default) -->
      <div id="rtab-panel-action-plan" class="hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Prioritized Action Plan</h3>
        <p class="text-xs text-slate-600 leading-relaxed">
          Step-by-step checklist synthesized from document extraction and agenda priorities.
        </p>
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div>1. <strong>Pre-Meeting (Today 5:00 PM):</strong> Review competitor analysis slides to counter pricing objections.</div>
          <div>2. <strong>Morning Briefing (Tomorrow 9:15 AM):</strong> Verify database migration timeline estimates with tech lead.</div>
          <div>3. <strong>Meeting Kickoff (Tomorrow 10:00 AM):</strong> Present Q1 priorities and propose resource allocation sign-off.</div>
        </div>
      </div>

      <!-- TAB CONTENT 3: Key Insights (Hidden by default) -->
      <div id="rtab-panel-insights" class="hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Extracted Key Insights</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="font-bold text-slate-900 block mb-1">Resource Allocation Bottleneck</span>
            <p class="text-slate-600">Frontend and Backend capacity are currently at 94% utilization. Approval of the 2 requisitions is required to hit target dates.</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="font-bold text-slate-900 block mb-1">Market Window Opportunity</span>
            <p class="text-slate-600">Launching the agentic workflows in Q1 gives a 4-month market lead over competing enterprise offerings.</p>
          </div>
        </div>
      </div>

      <!-- TAB CONTENT 4: Sources (Hidden by default) -->
      <div id="rtab-panel-sources" class="hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Referenced Documents & Data Sources</h3>
        <div class="space-y-2 text-xs">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span class="font-mono text-slate-900">Q4_Roadmap.pdf</span>
            <span class="text-blue-600 font-semibold">12 pages (High Relevance)</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span class="font-mono text-slate-900">Competitor_Analysis.docx</span>
            <span class="text-blue-600 font-semibold">8 pages (High Relevance)</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span class="font-mono text-slate-900">Google Calendar API</span>
            <span class="text-emerald-600 font-semibold">Live Event Sync</span>
          </div>
        </div>
      </div>

      <!-- TAB CONTENT 5: Tool Activity (Hidden by default) -->
      <div id="rtab-panel-activity" class="hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Tool Execution Telemetry</h3>
        <div class="space-y-2 text-xs font-mono">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            [10:12:02] calendar_read_events -> 1 event parsed (320ms)
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            [10:12:05] search_knowledge -> 2 documents indexed (520ms)
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            [10:12:18] document_analysis -> 4 decisions & 2 risks extracted (1200ms)
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
            [10:12:24] verify_action -> Verification passed (Confidence 94%)
          </div>
        </div>
      </div>

    </div>

    <!-- Quick Toast Notification -->
    <div id="results-toast" class="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium transform translate-y-20 opacity-0 transition-all duration-300 z-50 flex items-center gap-2">
      <span id="rtoast-icon">✓</span>
      <span id="rtoast-msg">Action completed</span>
    </div>

    <script>
      function switchResultsTab(tabKey) {
        const tabs = ['summary', 'action-plan', 'insights', 'sources', 'activity'];
        tabs.forEach(t => {
          const btn = document.getElementById('rtab-btn-' + t);
          const panel = document.getElementById('rtab-panel-' + t);
          if (btn) {
            if (t === tabKey) {
              btn.className = 'rtab-btn text-xs font-bold text-blue-600 border-b-2 border-blue-600 pb-3 px-4 transition cursor-pointer';
            } else {
              btn.className = 'rtab-btn text-xs font-medium text-slate-500 hover:text-slate-800 pb-3 px-4 transition cursor-pointer';
            }
          }
          if (panel) {
            if (t === tabKey) {
              panel.classList.remove('hidden');
            } else {
              panel.classList.add('hidden');
            }
          }
        });
      }

      function showResultsToast(msg) {
        const toast = document.getElementById('results-toast');
        const msgEl = document.getElementById('rtoast-msg');
        if (!toast || !msgEl) return;
        msgEl.textContent = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => {
          toast.classList.remove('translate-y-0', 'opacity-100');
          toast.classList.add('translate-y-20', 'opacity-0');
        }, 2500);
      }

      function exportResultsJSON() {
        const data = {
          title: "Product Roadmap Discussion Meeting Prep",
          status: "COMPLETE",
          confidenceScore: 0.94,
          agenda: "Q1 Feature Milestones, Resource Allocation, Budget Approvals",
          checklist: [
            "Review Q1 Roadmap slides (pages 3-7)",
            "Confirm headcount numbers with Engineering Lead",
            "Prepare talking points on budget contingency",
            "Confirm attendance with Stakeholder Sync team"
          ]
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meeting-prep-results.json';
        a.click();
        URL.revokeObjectURL(url);
        window.showToast ? window.showToast('Exported results to JSON file', 'success', '⬇') : showResultsToast('Exported results to JSON file');
      }

      function saveToNotionSim() {
        window.showToast ? window.showToast('Meeting briefing synchronized to your Notion workspace!', 'success', '📓') : showResultsToast('📓 Meeting preparation briefing saved to your Notion workspace!');
      }

      function startTaskSim(btn, taskName) {
        btn.textContent = '✓ Active';
        btn.className = 'px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer';
        window.showToast ? window.showToast('Started: ' + taskName, 'info', '⚡') : showResultsToast('Started: ' + taskName);
      }

      function toggleReminder(checkbox, taskName) {
        if (checkbox.checked) {
          window.showToast ? window.showToast('Reminder scheduled for ' + taskName, 'success', '🔔') : showResultsToast('🔔 Reminder enabled for ' + taskName);
        } else {
          window.showToast ? window.showToast('Reminder disabled for ' + taskName, 'info', '🔕') : showResultsToast('🔕 Reminder disabled for ' + taskName);
        }
      }
    </script>
  `;

  return renderLayout({
    activeRoute: '/results',
    isLightContent: true,
    title: 'ORCHESTRA — Results',
    bodyContent
  });
}
