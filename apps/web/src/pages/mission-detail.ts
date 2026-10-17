import { renderLayout } from '../components/layout.js';
import { OrchestratorDatabase } from '@orchestra/orchestrator';

export function ensureDemoMeetingPrep(db: OrchestratorDatabase) {
  const missionId = 'demo-meeting-prep';
  const existing = db.getMission(missionId);
  if (!existing) {
    db.createMission(
      missionId,
      "I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find the relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do."
    );
    db.updateMissionStatus(missionId, 'UNDERSTANDING');

    const plan = db.createPlan(`p-${missionId}`, missionId);

    const demoTasks = [
      {
        id: `t-demo-1`,
        title: 'Connected to your calendar...',
        toolName: 'calendar_read_events',
        toolInputTemplate: JSON.stringify({ range: 'tomorrow' }),
        status: 'in_progress',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-2`,
        title: "Found tomorrow's meeting: Product Roadmap Discussion",
        toolName: 'calendar_read_events',
        toolInputTemplate: JSON.stringify({ eventId: 'evt-roadmap-disc' }),
        status: 'pending',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-3`,
        title: 'Searching for relevant documents...',
        toolName: 'search_knowledge',
        toolInputTemplate: JSON.stringify({ query: 'Product Roadmap Q1' }),
        status: 'pending',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-4`,
        title: 'Analyzing document content...',
        toolName: 'verify_action',
        toolInputTemplate: JSON.stringify({
          documents: ['roadmap.pdf', 'notes.docx'],
          analysis_type: 'key_points',
          focus: ['decisions', 'action_items', 'risks']
        }),
        status: 'pending',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-5`,
        title: 'Identifying missing preparation items...',
        toolName: 'verify_action',
        toolInputTemplate: JSON.stringify({ check: 'missing_prep' }),
        status: 'pending',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-6`,
        title: 'Creating a prioritized checklist...',
        toolName: 'create_task',
        toolInputTemplate: JSON.stringify({ type: 'checklist' }),
        status: 'pending',
        durationMs: 0,
        resultJson: null
      },
      {
        id: `t-demo-7`,
        title: 'Setting up reminders...',
        toolName: 'calendar_create_reminder',
        toolInputTemplate: JSON.stringify({ reminder: 'Meeting prep review' }),
        status: 'pending',
        durationMs: 0,
        resultJson: null,
        requiresApproval: true
      }
    ];

    for (let i = 0; i < demoTasks.length; i++) {
      const t = demoTasks[i]!;
      db.createTask({
        id: t.id,
        missionId,
        planId: plan.id,
        stepIndex: i + 1,
        title: t.title,
        toolName: t.toolName,
        toolInputTemplate: t.toolInputTemplate,
        requiresApproval: t.requiresApproval || false
      });
      if (t.status === 'completed') {
        db.updateTaskStatus(t.id, 'completed', t.resultJson || '', null, t.durationMs);
      } else if (t.status === 'in_progress') {
        db.updateTaskStatus(t.id, 'in_progress');
      }
    }

    db.recordToolInvocation({
      id: `inv-demo-1`,
      mission_id: missionId,
      task_id: 't-demo-4',
      tool_name: 'search_knowledge',
      status: 'success',
      input_json: JSON.stringify({
        documents: ['roadmap.pdf', 'notes.docx'],
        analysis_type: 'key_points',
        focus: ['decisions', 'action_items', 'risks']
      }, null, 2),
      output_json: JSON.stringify({
        key_topics: ['Q1 roadmap', 'resource allocation'],
        action_items: ['Prepare market analysis', 'Review competitor strategy'],
        risks: ['timeline dependency', 'budget approval']
      }, null, 2),
      duration_ms: 12000,
      invoked_at: new Date().toISOString()
    });
  }
}

export function renderMissionDetailPage(missionId: string, db: OrchestratorDatabase): string {
  if (missionId === 'demo-meeting-prep' || missionId === 'doc-q4-roadmap' || missionId === 'default') {
    ensureDemoMeetingPrep(db);
    missionId = 'demo-meeting-prep';
  }

  const mission = db.getMission(missionId);
  if (!mission) {
    return renderLayout({
      activeRoute: '/missions',
      isLightContent: true,
      title: 'ORCHESTRA — Mission Not Found',
      bodyContent: `
        <div class="max-w-xl mx-auto p-12 text-center text-slate-600 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
          <h1 class="text-xl font-bold text-slate-900 mb-2">Mission Not Found</h1>
          <p class="text-xs mb-4 text-slate-500">No mission exists with ID: <code class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">${missionId}</code></p>
          <a href="/missions" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition">Back to Missions</a>
        </div>
      `
    });
  }

  const dbTasks = db.getTasksForMission(missionId);
  const invocations = db.getToolInvocationsForMission(missionId);
  const pendingApproval = (db as any).db.prepare("SELECT * FROM approvals WHERE mission_id = ? AND status = 'pending'").get(missionId);
  const verification = db.getVerificationResult(missionId);

  const activeInvocation = invocations.length > 0 ? invocations[invocations.length - 1] : null;
  const toolNameDisplay = activeInvocation ? (activeInvocation.tool_name === 'search_knowledge' ? 'Document Analysis' : activeInvocation.tool_name) : 'Document Analysis';
  const toolInputFormatted = activeInvocation ? activeInvocation.input_json : JSON.stringify({
    documents: ["roadmap.pdf", "notes.docx"],
    analysis_type: "key_points",
    focus: ["decisions", "action_items", "risks"]
  }, null, 2);
  const toolOutputFormatted = activeInvocation ? activeInvocation.output_json : JSON.stringify({
    key_topics: ["Q1 roadmap", "resource allocation"],
    action_items: ["Prepare market analysis", "Review competitor strategy"],
    risks: ["timeline dependency", "budget approval"]
  }, null, 2);
  const toolDurationDisplay = activeInvocation ? `${Math.round(activeInvocation.duration_ms / 1000)}s` : '12s';
  const toolStatusDisplay = 'Running';

  // Fallback demo tasks if database has no tasks yet
  const defaultTasks = [
    { title: 'Reading the local demo calendar...', status: 'in_progress', tool_name: 'calendar_read_events' },
    { title: "Found the demo meeting: Product Roadmap Discussion", status: 'pending', tool_name: 'calendar_read_events' },
    { title: 'Searching for relevant documents...', status: 'pending', tool_name: 'search_knowledge' },
    { title: 'Analyzing document content...', status: 'pending', tool_name: 'verify_action' },
    { title: 'Identifying missing preparation items...', status: 'pending', tool_name: 'verify_action' },
    { title: 'Creating a prioritized checklist...', status: 'pending', tool_name: 'create_task' },
    { title: 'Setting up reminders...', status: 'pending', tool_name: 'calendar_create_reminder' }
  ];

  const tasksToRender = dbTasks.length > 0 ? dbTasks : defaultTasks;

  // Title formatting: Meeting Preparation or goal title
  const isMeetingPrep = missionId === 'demo-meeting-prep' || mission.goal.toLowerCase().includes('meeting');
  const pageTitle = isMeetingPrep ? 'Meeting Preparation' : mission.goal.length > 60 ? `${mission.goal.substring(0, 60)}...` : mission.goal;
  const pageDescription = isMeetingPrep 
    ? "I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find the relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do."
    : mission.goal;

  // 5-Stage Stepper State
  const isCompletedMission = mission.status === 'COMPLETED';

  const stepperSteps = [
    { num: 1, label: 'Understand', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
    { num: 2, label: 'Plan', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>' },
    { num: 3, label: 'Use Tools', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>' },
    { num: 4, label: 'Verify', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' },
    { num: 5, label: 'Results', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>' }
  ];

  const stepperHtml = stepperSteps.map((s, idx) => {
    const isCompleted = isCompletedMission;
    const isActive = !isCompletedMission && s.num === 1;

    const iconContent = isCompleted
      ? `<div id="step-icon-${s.num}" class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm transition group-hover:scale-110">✓</div>`
      : isActive
      ? `<div id="step-icon-${s.num}" class="w-8 h-8 rounded-full bg-blue-600 text-white shadow-md ring-4 ring-blue-100 flex items-center justify-center text-xs font-bold transition group-hover:scale-110"><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg></div>`
      : `<div id="step-icon-${s.num}" class="w-7 h-7 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold transition group-hover:scale-110">${s.num}</div>`;

    const labelContent = `<span id="step-label-${s.num}" class="text-xs ${isActive ? 'font-bold text-slate-900' : isCompleted ? 'font-medium text-slate-700' : 'font-medium text-slate-400'} mt-2 group-hover:text-blue-600 transition">${s.label}</span>`;

    const btn = `
      <button type="button" onclick="switchStep(${s.num})" id="step-btn-${s.num}" class="flex flex-col items-center cursor-pointer group focus:outline-none">
        ${iconContent}
        ${labelContent}
      </button>
    `;

    const line = idx < stepperSteps.length - 1
      ? `<div id="step-line-${s.num}" class="flex-1 h-[2px] ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'} mx-2 mb-6 transition-colors"></div>`
      : '';

    return btn + line;
  }).join('');

  // Status Badge HTML
  let statusBadgeHtml = '';
  if (mission.status === 'FAILED') {
    statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-2 h-2 rounded-full bg-rose-500"></span>FAILED</span>`;
  } else if (mission.status === 'COMPLETED') {
    statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>COMPLETED</span>`;
  } else if (mission.status === 'NEEDS_CLARIFICATION') {
    statusBadgeHtml = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><span class="w-2 h-2 rounded-full bg-amber-500"></span>NEEDS CLARIFICATION</span>`;
  } else {
    statusBadgeHtml = `
      <div class="relative">
        <button id="live-status-btn" onclick="toggleSimMenu(event)" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-xs" title="Click to control live simulation">
          <span id="live-dot" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span id="live-status-text">Live</span>
          <span class="text-[9px] text-emerald-600">▼</span>
        </button>
        
        <!-- Simulation Popover Menu -->
        <div id="sim-menu" class="hidden absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-40 text-xs text-slate-700 text-left">
          <div class="font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Simulation Controls</span>
            <span class="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">Live Mode</span>
          </div>
          <div class="space-y-1">
            <button onclick="toggleTimer()" id="pause-resume-btn" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between font-medium">
              <span id="timer-btn-text">⏸ Pause Live Timer</span>
              <span class="text-[10px] text-slate-400">Timer</span>
            </button>
            <button onclick="advanceNextTask()" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center justify-between font-semibold">
              <span>⏭ Advance Step Progress</span>
              <span class="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded">Next</span>
            </button>
            <button onclick="resetTaskSimulation()" class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-between">
              <span>↺ Reset Demo Steps</span>
              <span class="text-[10px] text-slate-400">Reset</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Approval Card if pending (Preserves authorization & fingerprint)
  const approvalCardHtml = pendingApproval ? `
    <div class="p-5 bg-gradient-to-br from-amber-50 to-orange-50/40 border-2 border-amber-300 rounded-2xl space-y-3.5 shadow-md mb-6 ring-4 ring-amber-100/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-amber-950 font-bold text-sm">
          <span class="text-base">🛡️</span>
          <span>HUMAN APPROVAL REQUIRED FOR CONSEQUENTIAL ACTION</span>
        </div>
        <span class="text-[11px] bg-amber-200 text-amber-950 px-3 py-0.5 rounded-full font-mono font-bold shadow-xs animate-pulse">
          Pending Authorization
        </span>
      </div>

      <p class="text-xs text-amber-900 leading-relaxed">
        ORCHESTRA has halted execution at this consequential gate. Action <strong class="font-mono text-amber-950 font-bold bg-amber-100 px-1.5 py-0.5 rounded">${pendingApproval.action_type}</strong> requires explicit human authorization and parameter fingerprint verification before execution.
      </p>

      <div class="bg-white p-4 rounded-xl border border-amber-200 space-y-2.5 text-slate-700 shadow-2xs">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 font-medium">Action Type:</span>
          <span class="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">${pendingApproval.action_type}</span>
        </div>
        <div class="flex items-center justify-between text-xs gap-2">
          <span class="text-slate-500 font-medium flex-shrink-0">SHA-256 Fingerprint:</span>
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-mono text-amber-700 font-semibold truncate text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">${pendingApproval.canonical_fingerprint}</span>
            <button type="button" onclick="navigator.clipboard.writeText('${pendingApproval.canonical_fingerprint}'); window.showToast('SHA-256 fingerprint copied to clipboard!', 'info', '📋');" class="text-slate-400 hover:text-amber-700 p-1 text-xs transition" title="Copy Fingerprint">📋</button>
          </div>
        </div>
        <div class="text-xs text-slate-500 pt-1.5 border-t border-slate-100">
          <span class="font-medium">Action Parameters:</span>
          <pre class="mt-1 text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 overflow-x-auto font-mono leading-relaxed">${JSON.stringify(JSON.parse(pendingApproval.parameters_json), null, 2)}</pre>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-1">
        <button onclick="resolveApproval('${pendingApproval.id}', '${pendingApproval.canonical_fingerprint}', 'rejected')"
                class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
          Reject Action
        </button>
        <button onclick="resolveApproval('${pendingApproval.id}', '${pendingApproval.canonical_fingerprint}', 'approved')"
                class="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-1.5">
          <span>Authorize & Execute</span>
          <span>→</span>
        </button>
      </div>
    </div>
  ` : '';

  // Clarification Card if required
  const clarificationCardHtml = mission.status === 'NEEDS_CLARIFICATION' ? `
    <div class="p-5 bg-blue-50 border-2 border-blue-300 rounded-2xl space-y-3 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <span>ℹ️</span>
          <span>MISSION OBJECTIVE REQUIRES CLARIFICATION</span>
        </div>
        <span class="text-[11px] bg-blue-200 text-blue-900 px-2.5 py-0.5 rounded-full font-mono">
          Input Required
        </span>
      </div>

      <p class="text-xs text-blue-950 leading-relaxed">
        ${mission.clarification_prompt || 'ORCHESTRA detected underspecified requirements. Please provide additional context to continue planning and execution.'}
      </p>

      <div class="space-y-2">
        <textarea id="clarification-input" rows="3" placeholder="Provide additional details, constraints, or time windows..." class="w-full bg-white border border-blue-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"></textarea>
      </div>

      <div class="flex justify-end">
        <button onclick="submitClarification()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
          Resume Mission with Clarification →
        </button>
      </div>
    </div>
  ` : '';

  const bodyContent = `
    <div class="max-w-6xl mx-auto space-y-6 relative" data-mission-id="${mission.id}">
      <!-- Floating Bright Luminous Glass Bubbles Layer (High Visibility) -->
      <div class="absolute inset-0 pointer-events-none select-none overflow-visible z-20" aria-hidden="true">
        <!-- Bubble 1: Bright Blue Orb Top-Right -->
        <div class="absolute -top-5 right-12 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400/50 via-blue-500/40 to-sky-100/70 border-2 border-sky-400/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.95),0_0_25px_rgba(14,165,233,0.55),0_6px_20px_rgba(56,189,248,0.35)] backdrop-blur-xs" style="animation: floatBubbleA 7s ease-in-out infinite;">
          <div class="absolute top-1.5 left-2.5 w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white] rotate-[-35deg]"></div>
          <div class="absolute bottom-2 right-2.5 w-1.5 h-1.5 rounded-full bg-sky-200"></div>
        </div>
        <!-- Bubble 2: Bright Indigo Orb Mid-Left -->
        <div class="absolute top-1/4 -left-5 sm:-left-3 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 to-indigo-100/70 border-2 border-indigo-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_24px_rgba(99,102,241,0.55)] backdrop-blur-xs" style="animation: floatBubbleB 8.5s ease-in-out infinite 1.5s;">
          <div class="absolute top-1.5 left-2 w-3 h-1 rounded-full bg-white shadow-[0_0_4px_white] rotate-[-30deg]"></div>
        </div>
        <!-- Bubble 3: Radiant Emerald Orb Lower-Center -->
        <div class="absolute bottom-16 right-1/3 w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 to-emerald-100/70 border-2 border-emerald-400/80 shadow-[0_0_22px_rgba(16,185,129,0.55)]" style="animation: floatBubbleC 6.5s ease-in-out infinite 0.7s;">
          <div class="absolute top-1.5 left-1.5 w-2 h-1 rounded-full bg-white shadow-[0_0_4px_white]"></div>
        </div>
        <!-- Bubble 4: Sparkling Cyan Orb Top-Left -->
        <div class="absolute -top-3 left-1/4 w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400/60 via-blue-500/50 to-white/80 border-2 border-cyan-400/90 shadow-[0_0_20px_rgba(34,211,238,0.65)]" style="animation: floatBubbleB 5.5s ease-in-out infinite 0.5s;">
          <div class="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white"></div>
        </div>
      </div>
      
      <!-- Top Breadcrumbs & Sub-Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 relative z-10">
        <div class="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <a href="/missions" id="mission-back-btn" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 transition font-semibold text-xs shadow-2xs group" title="Back to Missions">
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Missions</span>
          </a>
          <span class="text-slate-300">|</span>
          <span class="text-blue-500">
            <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </span>
          <a href="/missions?view=list" class="text-blue-600 hover:underline font-semibold" title="Back to Missions Overview">Mission</a>
          <span class="text-slate-400">›</span>
          <span class="text-slate-700 font-semibold">${pageTitle}</span>
        </div>

        <!-- Sub-Navigation Links -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <a href="/missions" class="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg transition">Mission</a>
          <a href="/new" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Chat</a>
          <a href="/plan" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Plan</a>
          <a href="/tools" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Tool Execution</a>
          <a href="/results" class="px-3 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition">Results</a>
        </div>
      </div>

      <!-- Top Header & 5-Step Stepper Card -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        
        <!-- Title Row with Icon, Description, and Live Badge -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <!-- Blue Square Calendar Icon -->
            <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm mt-0.5">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>

            <div>
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">${pageTitle}</h1>
              <p class="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">${pageDescription}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
            ${statusBadgeHtml}
            <button onclick="toggleSimMenu(event)" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition" title="Simulation Options">
              ⋮
            </button>
          </div>
        </div>

        <!-- 5-Step Execution Workflow Stepper (Dynamic & Sequential) -->
        <div class="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between max-w-3xl mx-auto px-2 sm:px-6 select-none">
          ${stepperHtml}
        </div>

      </div>

      <!-- Human Approval Card (if pending) -->
      ${approvalCardHtml}

      <!-- Needs Clarification Card (if needed) -->
      ${clarificationCardHtml}

      <!-- TAB 1: Understand Details -->
      <div id="step-tab-1" class="${isCompletedMission ? 'hidden' : ''} space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base font-bold">
                🎯
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-900">Step 1: Goal Understanding & Semantic Intent</h2>
                <p class="text-xs text-slate-500">Autonomous NLP pipeline mapped user objective into actionable execution domains.</p>
              </div>
            </div>
            <span id="understand-status-badge" class="inline-flex items-center gap-1.5 text-xs font-semibold ${isCompletedMission ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-blue-700 bg-blue-50 border border-blue-200'} px-2.5 py-0.5 rounded-full">
              ${isCompletedMission ? '✓ Completed' : '<span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>In progress'}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Meeting</span>
              <span class="text-sm font-bold text-slate-900">Product Roadmap Discussion</span>
              <p class="text-xs text-slate-500 mt-1">Tomorrow 10:00 AM • Calendar Match</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Intent Classification</span>
              <span class="text-sm font-bold text-blue-600">Meeting Preparation & Checklist</span>
              <p class="text-xs text-slate-500 mt-1">Multi-domain toolchain required</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ambiguity Score</span>
              <span class="text-sm font-bold text-emerald-600">0.04 (Clear & Unambiguous)</span>
              <p class="text-xs text-slate-500 mt-1">Zero human clarification loops</p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified Actionable Sub-goals</h3>
              <span id="subgoals-counter" class="text-[11px] font-medium text-slate-500">${isCompletedMission ? '4/4 ready' : 'Analyzing intent...'}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div id="subgoal-item-1" onclick="window.toggleSubgoal(1)" class="flex items-start justify-between gap-2.5 p-3 rounded-xl ${isCompletedMission ? 'bg-slate-50 border border-slate-100' : 'bg-blue-50/70 border border-blue-200'} transition-all cursor-pointer hover:shadow-xs">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div id="subgoal-icon-1" class="w-5 h-5 rounded-full ${isCompletedMission ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white animate-spin'} flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    ${isCompletedMission ? '✓' : '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>'}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs text-slate-800"><strong>Calendar Extraction:</strong> Locate tomorrow's agenda and confirm meeting timeslot.</div>
                    <div id="subgoal-status-1" class="text-[10px] ${isCompletedMission ? 'text-slate-500' : 'text-blue-600 font-semibold'} mt-0.5">${isCompletedMission ? 'Identified: Tomorrow 10:00 AM' : 'Analyzing calendar events...'}</div>
                  </div>
                </div>
                <button type="button" id="subgoal-action-1" onclick="event.stopPropagation(); window.toggleSubgoal(1)" class="subgoal-action-btn flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${isCompletedMission ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'}">
                  <span>${isCompletedMission ? '✓' : '◯'}</span>
                  <span>${isCompletedMission ? 'Verified' : 'Verify'}</span>
                </button>
              </div>

              <div id="subgoal-item-2" onclick="window.toggleSubgoal(2)" class="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all cursor-pointer hover:shadow-xs">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div id="subgoal-icon-2" class="w-5 h-5 rounded-full ${isCompletedMission ? 'bg-emerald-600 text-white font-bold' : 'border-2 border-slate-300 text-slate-400 font-medium'} flex items-center justify-center text-[10px] flex-shrink-0">
                    ${isCompletedMission ? '✓' : '2'}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs ${isCompletedMission ? 'text-slate-800' : 'text-slate-600'}"><strong>Knowledge Retrieval:</strong> Pull roadmap documents (roadmap.pdf, notes.docx).</div>
                    <div id="subgoal-status-2" class="text-[10px] text-slate-400 mt-0.5">${isCompletedMission ? 'Retrieved 2 documents' : 'Pending'}</div>
                  </div>
                </div>
                <button type="button" id="subgoal-action-2" onclick="event.stopPropagation(); window.toggleSubgoal(2)" class="subgoal-action-btn flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${isCompletedMission ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'}">
                  <span>${isCompletedMission ? '✓' : '◯'}</span>
                  <span>${isCompletedMission ? 'Verified' : 'Verify'}</span>
                </button>
              </div>

              <div id="subgoal-item-3" onclick="window.toggleSubgoal(3)" class="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all cursor-pointer hover:shadow-xs">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div id="subgoal-icon-3" class="w-5 h-5 rounded-full ${isCompletedMission ? 'bg-emerald-600 text-white font-bold' : 'border-2 border-slate-300 text-slate-400 font-medium'} flex items-center justify-center text-[10px] flex-shrink-0">
                    ${isCompletedMission ? '✓' : '3'}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs ${isCompletedMission ? 'text-slate-800' : 'text-slate-600'}"><strong>Document Analysis:</strong> Extract decisions, open action items, and risk items.</div>
                    <div id="subgoal-status-3" class="text-[10px] text-slate-400 mt-0.5">${isCompletedMission ? 'Extracted 3 topics, 2 risks' : 'Pending'}</div>
                  </div>
                </div>
                <button type="button" id="subgoal-action-3" onclick="event.stopPropagation(); window.toggleSubgoal(3)" class="subgoal-action-btn flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${isCompletedMission ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'}">
                  <span>${isCompletedMission ? '✓' : '◯'}</span>
                  <span>${isCompletedMission ? 'Verified' : 'Verify'}</span>
                </button>
              </div>

              <div id="subgoal-item-4" onclick="window.toggleSubgoal(4)" class="flex items-start justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all cursor-pointer hover:shadow-xs">
                <div class="flex items-start gap-2.5 min-w-0">
                  <div id="subgoal-icon-4" class="w-5 h-5 rounded-full ${isCompletedMission ? 'bg-emerald-600 text-white font-bold' : 'border-2 border-slate-300 text-slate-400 font-medium'} flex items-center justify-center text-[10px] flex-shrink-0">
                    ${isCompletedMission ? '✓' : '4'}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs ${isCompletedMission ? 'text-slate-800' : 'text-slate-600'}"><strong>Prioritized Checklist:</strong> Build actionable preparation checklist and set alarms.</div>
                    <div id="subgoal-status-4" class="text-[10px] text-slate-400 mt-0.5">${isCompletedMission ? 'Action checklist ready' : 'Pending'}</div>
                  </div>
                </div>
                <button type="button" id="subgoal-action-4" onclick="event.stopPropagation(); window.toggleSubgoal(4)" class="subgoal-action-btn flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${isCompletedMission ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'}">
                  <span>${isCompletedMission ? '✓' : '◯'}</span>
                  <span>${isCompletedMission ? 'Verified' : 'Verify'}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button id="understand-next-btn" onclick="userAdvanceStep(2)" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <span>View Execution Plan (Step 2) →</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: Plan Details -->
      <div id="step-tab-2" class="hidden space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base font-bold">
                📋
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-900">Step 2: Execution Plan DAG (Directed Acyclic Graph)</h2>
                <p class="text-xs text-slate-500">Autonomous task decomposition with dependency edges and safety approval gates.</p>
              </div>
            </div>
            <span id="plan-dag-badge" class="text-xs font-semibold ${isCompletedMission ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-blue-700 bg-blue-50 border border-blue-200'} px-2.5 py-0.5 rounded-full">
              ${isCompletedMission ? 'DAG Plan Validated (7/7 Verified)' : 'Verification Pending (0/7 Ready)'}
            </span>
          </div>

          <div class="space-y-3" id="plan-dag-task-list">
            ${tasksToRender.map((t: any, idx: number) => {
              const taskNum = idx + 1;
              const isTaskCompleted = isCompletedMission || t.status === 'completed';
              const isTaskActive = !isCompletedMission && taskNum === 1;
              const hasApprovalGate = t.requiresApproval || t.requires_approval;
              
              return `
              <div id="plan-task-row-${taskNum}" 
                   data-requires-approval="${hasApprovalGate ? 'true' : 'false'}"
                   class="plan-task-row p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                     isTaskCompleted
                       ? 'bg-slate-50 border-slate-200'
                       : isTaskActive
                       ? 'bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-200'
                       : 'bg-slate-50/70 border-slate-200 opacity-75'
                   }">
                <div class="flex items-center gap-3 min-w-0">
                  <span id="plan-task-num-${taskNum}" class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                    isTaskCompleted
                      ? 'bg-emerald-600 text-white'
                      : isTaskActive
                      ? 'bg-blue-600 text-white ring-2 ring-blue-200 shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  }">
                    ${isTaskCompleted ? '✓' : taskNum}
                  </span>
                  <div class="min-w-0">
                    <span id="plan-task-title-${taskNum}" class="plan-task-title text-xs font-bold block truncate ${
                      isTaskCompleted ? 'text-slate-900' : isTaskActive ? 'text-blue-950 font-bold' : 'text-slate-700'
                    }">${t.title}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[11px] text-slate-500 font-mono">tool: ${t.tool_name || t.toolName || 'system'}</span>
                      ${hasApprovalGate ? '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">🛡️ Approval Gate</span>' : ''}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2.5 flex-shrink-0">
                  <button type="button" 
                          id="plan-task-action-${taskNum}" 
                          onclick="event.stopPropagation(); window.verifyPlanTask(${taskNum})" 
                          ${!isTaskActive && !isTaskCompleted ? 'disabled' : ''}
                          class="plan-task-btn text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                            isTaskCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 cursor-pointer' 
                              : isTaskActive 
                              ? (hasApprovalGate
                                  ? 'border-amber-500 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer animate-pulse'
                                  : 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer animate-pulse')
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          }">
                    <span>${isTaskCompleted ? '✓' : (isTaskActive && hasApprovalGate ? '🛡️' : (isTaskActive ? '◯' : '🔒'))}</span>
                    <span>${isTaskCompleted ? 'Verified' : (isTaskActive && hasApprovalGate ? 'Approve & Continue' : (isTaskActive ? 'Verify & Continue' : 'Verify'))}</span>
                  </button>
                </div>
              </div>
            `;}).join('')}
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <button onclick="switchStep(1)" class="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer">
              ← Back to Understand
            </button>
            <button id="plan-next-btn" onclick="userAdvanceStep(3)" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${isCompletedMission ? '' : 'opacity-70'}">
              <span>Go to Live Execution (Step 3) →</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 3: Use Tools (Hidden on initial load until Step 3 is reached or clicked) -->
      <div id="step-tab-3" class="hidden grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: Current Step & Execution Logs -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          
          <!-- Step Header (Clickable Accordion Toggle) -->
          <div onclick="toggleStepAccordion()" class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 cursor-pointer select-none group" title="Click to collapse / expand tasks list">
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              </div>
              <h2 id="current-step-heading" class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">Current Step: Creating execution plan</h2>
            </div>
            <div class="flex items-center gap-2">
              <span id="step-timer-badge" class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">24s</span>
              <span id="step-chevron" class="text-slate-400 group-hover:text-slate-600 text-xs font-bold transition-transform">▲</span>
            </div>
          </div>

          <!-- Vertical Step Log List (Collapsible) -->
          <div id="step-accordion-content" class="space-y-3.5 transition-all duration-300">
            ${tasksToRender.map((t: any, idx: number) => {
              const isCompleted = t.status === 'completed';
              const isInProgress = t.status === 'in_progress';
              const isFailed = t.status === 'failed';

              return `
                <div class="task-log-row flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer select-none"
                     onclick="window.toggleTaskRow(this)"
                     title="Click to toggle status or verify"
                     data-task-index="${idx}">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="task-status-icon w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      isCompleted ? 'bg-emerald-600 text-white font-bold shadow-sm' :
                      isInProgress ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-200 shadow-sm animate-pulse' :
                      isFailed ? 'bg-rose-500 text-white font-bold' :
                      'border-2 border-slate-300 text-transparent'
                    }">
                      ${isCompleted ? '✓' : isInProgress ? '+' : isFailed ? '✕' : '•'}
                    </div>
                    <span class="task-title-text text-xs ${isCompleted ? 'font-medium text-slate-800' : isInProgress ? 'font-semibold text-slate-900' : isFailed ? 'font-semibold text-rose-600' : 'font-medium text-slate-500'} truncate block">
                      ${t.title}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            onclick="event.stopPropagation(); window.markTaskRowComplete(this.closest('.task-log-row'))"
                            class="task-action-btn text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              isInProgress ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs' :
                              'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                            }">
                      <span>${isCompleted ? '✓' : '◯'}</span>
                      <span>${isCompleted ? 'Verified' : 'Mark Complete'}</span>
                    </button>

                    <span class="task-status-badge inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                      isInProgress ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                      isFailed ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500' : isFailed ? 'bg-rose-500' : 'bg-slate-400'}"></span>
                      ${isCompleted ? 'Completed' : isInProgress ? 'In progress' : isFailed ? 'Failed' : 'Pending'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

        </div>

        <!-- Right Column: Current Tool Input/Output Inspector -->
        <div class="lg:col-span-5 space-y-3">
          
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900">Current Tool</h2>
            <button onclick="openToolsDrawer()" class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 cursor-pointer">
              <span>View all tools</span>
              <span class="text-xs">→</span>
            </button>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            
            <!-- Tool Card Header -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h3 id="inspector-tool-name" class="text-sm font-bold text-slate-900">${toolNameDisplay}</h3>
                  <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">Analyzing relevant meeting documents and extracting key information.</p>
                </div>
              </div>

              <div class="flex flex-col items-end gap-1 flex-shrink-0">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ${toolStatusDisplay}
                </span>
                <span id="tool-timer-badge" class="text-[11px] font-medium text-slate-400">${toolDurationDisplay}</span>
              </div>
            </div>

            <!-- Input Inspector (Collapsible Accordion) -->
            <details open class="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-3">
              <summary class="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer select-none">
                <span class="flex items-center gap-1.5">
                  <span>Input Parameters</span>
                  <span class="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded font-mono font-normal">JSON</span>
                </span>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="event.stopPropagation(); navigator.clipboard.writeText(document.getElementById('inspector-input-json').textContent); window.showToast('Input JSON copied to clipboard!', 'info', '📋');" class="text-slate-400 hover:text-blue-600 p-0.5 text-xs transition" title="Copy JSON">📋 Copy</button>
                  <span class="text-slate-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>
              <pre id="inspector-input-json" class="mt-2 text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto leading-relaxed shadow-inner">${toolInputFormatted}</pre>
            </details>

            <!-- Output (Live) Inspector (Collapsible Accordion) -->
            <details open class="group rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <summary class="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer select-none">
                <span class="flex items-center gap-1.5">
                  <span>Output (Live Stream)</span>
                  <span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-semibold">Live</span>
                </span>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="event.stopPropagation(); navigator.clipboard.writeText(document.getElementById('inspector-output-json').textContent); window.showToast('Output JSON copied to clipboard!', 'info', '📋');" class="text-slate-400 hover:text-emerald-600 p-0.5 text-xs transition" title="Copy JSON">📋 Copy</button>
                  <span class="text-slate-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>
              <pre id="inspector-output-json" class="mt-2 text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto leading-relaxed shadow-inner">${toolOutputFormatted}</pre>
            </details>

          </div>

        </div>

      </div>

      <!-- TAB 4: Verify Details -->
      <div id="step-tab-4" class="hidden space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-bold">
                🛡️
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-900">Step 4: Independent Deliverable Verification</h2>
                <p class="text-xs text-slate-500">Verification engine checking output validity and contract criteria.</p>
              </div>
            </div>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Confidence Score: 94%</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <span class="text-xs font-bold text-emerald-800 block mb-2">Satisfied Objectives (4 of 4)</span>
              <ul class="text-xs text-slate-700 space-y-2">
                <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Calendar meeting identified ("Product Roadmap Discussion")</li>
                <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Relevant roadmap specifications extracted and summarized</li>
                <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Action items & gaps prioritized for attendee review</li>
                <li class="flex items-center gap-2"><span class="text-emerald-600 font-bold">✓</span> Reminder notification template formatted</li>
              </ul>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-xs font-bold text-slate-800 block mb-2">Cryptographic Audit Proof</span>
              <div class="space-y-1.5 text-[11px] font-mono text-slate-600">
                <div><span class="text-slate-400">engine:</span> orchestra.verifier.v2</div>
                <div><span class="text-slate-400">hash:</span> 4a8e9d3b10c528f72a...</div>
                <div><span class="text-slate-400">evaluated_at:</span> ${new Date().toISOString()}</div>
                <div><span class="text-slate-400">status:</span> VERIFIED_SUCCESSFUL</div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <button onclick="switchStep(3)" class="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer">
              ← Back to Use Tools
            </button>
            <button onclick="userAdvanceStep(5)" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <span>View Final Deliverables (Step 5) →</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 5: Results Details -->
      <div id="step-tab-5" class="${isCompletedMission ? '' : 'hidden'} space-y-6">
        <div class="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base font-bold">
                📊
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-900">Step 5: Mission Results & Deliverables</h2>
                <p class="text-xs text-slate-500">Autonomous outcome ready for review, export, and calendar integration.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="copyResultsToClipboard()" id="copy-btn" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition">
                📋 Copy Briefing
              </button>
              <button onclick="exportResultsJSON()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs">
                ⬇ Export JSON
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Executive Meeting Briefing</h3>
              <p class="text-xs text-slate-700 leading-relaxed mb-3">
                Tomorrow's meeting is <strong>Product Roadmap Discussion</strong> at 10:00 AM. 
                Focus is on the Q1 release timeline and resource allocation dependencies.
              </p>
              <div class="space-y-1.5 text-xs text-slate-600">
                <div>• <strong>Key Topics:</strong> Q1 feature milestones, engineer staffing allocation, budget sign-off.</div>
                <div>• <strong>Identified Risks:</strong> Database migration timeline dependency, competitor feature release timing.</div>
              </div>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2.5">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Prioritized Preparation Checklist</h3>
                <span id="checklist-progress-badge" class="text-[11px] font-medium text-slate-500 font-mono">0/4 completed</span>
              </div>
              <ul class="text-xs text-slate-700 space-y-2.5">
                <li class="flex items-center gap-2.5 select-none">
                  <input type="checkbox" id="prep-chk-1" onchange="window.toggleChecklistItem(this, 'Review Q1 Roadmap slides')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" />
                  <label for="prep-chk-1" class="cursor-pointer transition hover:text-slate-900">Review Q1 Roadmap slides (roadmap.pdf pages 3-7)</label>
                </li>
                <li class="flex items-center gap-2.5 select-none">
                  <input type="checkbox" id="prep-chk-2" onchange="window.toggleChecklistItem(this, 'Confirm head-count requirements')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" />
                  <label for="prep-chk-2" class="cursor-pointer transition hover:text-slate-900">Confirm head-count requirements with Engineering Lead</label>
                </li>
                <li class="flex items-center gap-2.5 select-none">
                  <input type="checkbox" id="prep-chk-3" onchange="window.toggleChecklistItem(this, 'Prepare talking points')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" />
                  <label for="prep-chk-3" class="cursor-pointer transition hover:text-slate-900">Prepare talking points on budget approval contingency</label>
                </li>
                <li class="flex items-center gap-2.5 select-none">
                  <input type="checkbox" id="prep-chk-4" onchange="window.toggleChecklistItem(this, 'Set 15-minute advance reminder alarm')" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4" />
                  <label for="prep-chk-4" class="cursor-pointer transition hover:text-slate-900">Set 15-minute advance reminder alarm</label>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <button onclick="switchStep(3)" class="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
              ← Back to Live Tools View
            </button>
            <a href="/missions?view=list" class="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All Missions Overview →
            </a>
          </div>
        </div>
      </div>

      <!-- Verification Evidence Card (if completed with verification) -->
      ${
        verification ? `
          <div class="p-5 bg-white border ${verification.is_valid ? 'border-emerald-200' : 'border-rose-200'} rounded-2xl space-y-3 shadow-sm mt-6">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>${verification.is_valid ? '🛡️ Independent Verification Passed' : '⚠️ Independent Verification Incomplete'}</span>
              </h3>
              <span class="text-xs font-bold ${verification.is_valid ? 'text-emerald-700' : 'text-rose-700'}">
                Confidence Score: ${Math.round(verification.confidence_score * 100)}%
              </span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">${verification.summary}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[11px] text-emerald-800 font-bold block mb-1.5">Satisfied Objectives (${JSON.parse(verification.satisfied_requirements_json).length}):</span>
                <ul class="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  ${JSON.parse(verification.satisfied_requirements_json).map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[11px] text-slate-700 font-bold block mb-1.5">Deliverable Evidence:</span>
                <pre class="text-[11px] text-slate-800 font-mono">${JSON.stringify(JSON.parse(verification.evidence_json), null, 2)}</pre>
              </div>
            </div>
          </div>
        ` : ''
      }

    </div>

    <!-- Slide-Over Tools Drawer Backdrop -->
    <div id="tools-drawer-backdrop" 
         class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 hidden opacity-0 transition-opacity duration-300"
         onclick="closeToolsDrawer()"></div>

    <!-- Slide-Over Tools Drawer Container -->
    <div id="tools-drawer" 
         class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col border-l border-slate-200">
      
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              🛠️
            </div>
            <h2 class="text-sm font-bold text-slate-900">Configured Backend Tools (MCP)</h2>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5">8 active tools discovered via Model Context Protocol</p>
        </div>
        <button onclick="closeToolsDrawer()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs transition">
          ✕
        </button>
      </div>

      <div class="p-3 border-b border-slate-100 bg-white">
        <div class="relative">
          <input type="text" id="tool-search-input" oninput="filterToolsDrawer()" placeholder="Search tools by name or description..." class="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500" />
          <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      <div id="tools-drawer-list" class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- Tool 1: search_knowledge -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="search_knowledge">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">search_knowledge</span>
            <span class="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Semantic search across corporate knowledge base, specifications, and roadmap documents.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { query: string, max_results?: number }
          </div>
        </div>

        <!-- Tool 2: calendar_read_events -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="calendar_read_events">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">calendar_read_events</span>
            <span class="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Connected</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Read user's calendar schedule, agenda, attendees, and meeting details.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { range?: string, eventId?: string }
          </div>
        </div>

        <!-- Tool 3: create_task -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="create_task">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">create_task</span>
            <span class="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Registered</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Create prioritized tasks and actionable checklists in task management engine.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { title: string, priority: 'high' | 'normal', checklist?: string[] }
          </div>
        </div>

        <!-- Tool 4: calendar_create_reminder -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="calendar_create_reminder">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">calendar_create_reminder</span>
            <span class="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Approval Gated</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Schedule notifications and alarms for meetings (Requires explicit human authorization).</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { reminder_text: string, offset_minutes: number }
          </div>
        </div>

        <!-- Tool 5: verify_action -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="verify_action">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">verify_action</span>
            <span class="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Autonomous verifier comparing output validity against mission goals.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { criteria: string[], evidence: Record<string, any> }
          </div>
        </div>

        <!-- Tool 6: analyze_document -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="analyze_document">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">analyze_document</span>
            <span class="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Deep document reasoning, key decisions extraction, and risk assessment.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { documents: string[], analysis_type: string }
          </div>
        </div>

        <!-- Tool 7: browser_read_page -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="browser_read_page">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">browser_read_page</span>
            <span class="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">System</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Fetch and parse static public web content and documentation references.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { url: string }
          </div>
        </div>

        <!-- Tool 8: database_query -->
        <div class="tool-card p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition" data-tool-name="database_query">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-slate-900">database_query</span>
            <span class="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">System</span>
          </div>
          <p class="text-xs text-slate-600 leading-snug">Execute read-only SQL queries against SQLite knowledge database.</p>
          <div class="mt-2 text-[10px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
            schema: { sql: string, params?: any[] }
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <span class="text-[11px] text-slate-500 font-medium">Model Context Protocol v2025-11-25</span>
        <a href="/tools" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
          Open Full Tools Page →
        </a>
      </div>
    </div>

    <script>
      // SSE Real-time Updates Setup
      const evtSource = new EventSource('/api/missions/${mission.id}/events');
      evtSource.onmessage = function(e) {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'state_transition' || data.type === 'approval_requested' || data.type === 'task_updated') {
            location.reload();
          }
        } catch(err) {}
      };

      // State Management for Stepper
      const isMissionCompleted = ${isCompletedMission ? 'true' : 'false'};
      let stageStatus = {
        1: isMissionCompleted ? 'completed' : 'in_progress',
        2: isMissionCompleted ? 'completed' : 'pending',
        3: isMissionCompleted ? 'completed' : 'pending',
        4: isMissionCompleted ? 'completed' : 'pending',
        5: isMissionCompleted ? 'completed' : 'pending'
      };
      let activeViewTab = isMissionCompleted ? 5 : 1;

      function renderStepperUI() {
        for (let i = 1; i <= 5; i++) {
          const btnIcon = document.getElementById('step-icon-' + i);
          const btnLabel = document.getElementById('step-label-' + i);
          const line = document.getElementById('step-line-' + i);
          const status = stageStatus[i];
          const isViewed = (i === activeViewTab);

          if (btnIcon && btnLabel) {
            if (status === 'completed') {
              btnIcon.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm transition' + (isViewed ? ' ring-4 ring-emerald-300 scale-110' : '');
              btnIcon.innerHTML = '✓';
              btnLabel.className = 'text-xs ' + (isViewed ? 'font-bold text-slate-900 underline underline-offset-4 decoration-emerald-500 decoration-2' : 'font-medium text-slate-700') + ' mt-2 transition';
            } else if (status === 'in_progress') {
              btnIcon.className = 'w-8 h-8 rounded-full bg-blue-600 text-white shadow-md ring-4 ' + (isViewed ? 'ring-blue-300 scale-110' : 'ring-blue-100') + ' flex items-center justify-center text-xs font-bold transition';
              if (i === 1) {
                btnIcon.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>';
              } else if (i === 2) {
                btnIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>';
              } else if (i === 3) {
                btnIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
              } else if (i === 4) {
                btnIcon.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
              } else {
                btnIcon.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>';
              }
              btnLabel.className = 'text-xs ' + (isViewed ? 'font-bold text-blue-600 underline underline-offset-4 decoration-blue-500 decoration-2' : 'font-bold text-slate-900') + ' mt-2 transition';
            } else {
              // pending
              btnIcon.className = 'w-7 h-7 rounded-full border-2 ' + (isViewed ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200 scale-105' : 'border-slate-300 text-slate-400') + ' flex items-center justify-center text-xs font-bold transition';
              btnIcon.innerHTML = String(i);
              btnLabel.className = 'text-xs font-medium ' + (isViewed ? 'text-blue-600 font-bold underline underline-offset-4 decoration-blue-400 decoration-2' : 'text-slate-400') + ' mt-2 transition';
            }
          }

          if (line) {
            if (status === 'completed') {
              line.className = 'flex-1 h-[2px] bg-emerald-500 mx-2 mb-6 transition-colors';
            } else if (status === 'in_progress') {
              line.className = 'flex-1 h-[2px] bg-blue-300 mx-2 mb-6 transition-colors';
            } else {
              line.className = 'flex-1 h-[2px] bg-slate-200 mx-2 mb-6 transition-colors';
            }
          }
        }
      }

      // Step Switcher: immediately displays clicked stage sub-view panel
      function switchStep(stepNum) {
        activeViewTab = stepNum;
        for (let i = 1; i <= 5; i++) {
          const tab = document.getElementById('step-tab-' + i);
          if (tab) {
            if (i === stepNum) {
              tab.classList.remove('hidden');
            } else {
              tab.classList.add('hidden');
            }
          }
        }
        renderStepperUI();
      }
      window.switchStep = switchStep;

      // User Advance button: progresses to next step cleanly
      function userAdvanceStep(nextStep) {
        if (nextStep === 3) {
          const rows = document.querySelectorAll('.plan-task-row');
          const totalTasks = rows.length || 7;
          let verifiedCount = 0;
          for (let i = 1; i <= totalTasks; i++) {
            const btn = document.getElementById('plan-task-action-' + i);
            if (btn && btn.textContent.includes('Verified')) verifiedCount++;
          }
          if (verifiedCount < totalTasks) {
            window.showToast ? window.showToast('Please verify all sub-tasks in Step 2 (' + verifiedCount + '/' + totalTasks + ' verified)', 'warning', '⚠️') : null;
            switchStep(2);
            return;
          }
        }
        for (let i = 1; i < nextStep; i++) {
          stageStatus[i] = 'completed';
        }
        stageStatus[nextStep] = (nextStep === 5) ? 'completed' : 'in_progress';
        switchStep(nextStep);
      }
      window.userAdvanceStep = userAdvanceStep;

      // 2. Accordion Toggle for Current Step Task List
      function toggleStepAccordion() {
        const content = document.getElementById('step-accordion-content');
        const chevron = document.getElementById('step-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
          content.classList.remove('hidden');
          if (chevron) chevron.textContent = '▲';
        } else {
          content.classList.add('hidden');
          if (chevron) chevron.textContent = '▼';
        }
      }

      // 3. Slide-over Tools Drawer
      function openToolsDrawer() {
        const drawer = document.getElementById('tools-drawer');
        const backdrop = document.getElementById('tools-drawer-backdrop');
        if (backdrop) {
          backdrop.classList.remove('hidden');
          setTimeout(() => { backdrop.classList.remove('opacity-0'); backdrop.classList.add('opacity-100'); }, 10);
        }
        if (drawer) {
          drawer.classList.remove('translate-x-full');
          drawer.classList.add('translate-x-0');
        }
        const input = document.getElementById('tool-search-input');
        if (input) setTimeout(() => input.focus(), 150);
      }

      function closeToolsDrawer() {
        const drawer = document.getElementById('tools-drawer');
        const backdrop = document.getElementById('tools-drawer-backdrop');
        if (drawer) {
          drawer.classList.remove('translate-x-0');
          drawer.classList.add('translate-x-full');
        }
        if (backdrop) {
          backdrop.classList.remove('opacity-100');
          backdrop.classList.add('opacity-0');
          setTimeout(() => backdrop.classList.add('hidden'), 300);
        }
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeToolsDrawer();
          closeSimMenu();
        }
      });

      function filterToolsDrawer() {
        const input = document.getElementById('tool-search-input');
        const query = (input ? input.value : '').toLowerCase().trim();
        const cards = document.querySelectorAll('.tool-card');
        cards.forEach(c => {
          const text = c.textContent.toLowerCase();
          c.style.display = text.includes(query) ? '' : 'none';
        });
      }

      // 4. Live Simulation Menu
      function toggleSimMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('sim-menu');
        if (!menu) return;
        menu.classList.toggle('hidden');
      }

      function closeSimMenu() {
        const menu = document.getElementById('sim-menu');
        if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
      }

      document.addEventListener('click', function(e) {
        const menu = document.getElementById('sim-menu');
        const btn = document.getElementById('live-status-btn');
        if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });

      // 5. Live Timer Increment
      // 5. Live Timer Increment & Sequential Simulation
      let timerActive = true;
      let stepSeconds = 0;
      let toolSeconds = 0;
      let autoProgressionTimer = null;
      let understandSubgoalIdx = 0;
      let demoProgressIdx = 0;
      window.demoActionApproved = false;

      setInterval(() => {
        if (!timerActive) return;
        stepSeconds++;
        toolSeconds++;
        const sBadge = document.getElementById('step-timer-badge');
        const tBadge = document.getElementById('tool-timer-badge');
        if (sBadge) sBadge.textContent = stepSeconds + 's';
        if (tBadge) tBadge.textContent = toolSeconds + 's';
      }, 1000);

      function toggleTimer() {
        timerActive = !timerActive;
        const btn = document.getElementById('timer-btn-text');
        const dot = document.getElementById('live-dot');
        const text = document.getElementById('live-status-text');
        if (btn) btn.textContent = timerActive ? '⏸ Pause Live Timer' : '▶ Resume Live Timer';
        if (dot) {
          dot.className = timerActive ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' : 'w-2 h-2 rounded-full bg-amber-500';
        }
        if (text) text.textContent = timerActive ? 'Live' : 'Paused';
      }

      // Step 1: Sequential Subgoal Expansion
      const SUBGOAL_RESULTS = [
        { result: 'Identified: Tomorrow 10:00 AM' },
        { result: 'Retrieved: roadmap.pdf, notes.docx' },
        { result: 'Extracted: 3 topics, 2 risks' },
        { result: 'Action checklist formulated' }
      ];

      function stepThroughUnderstand() {
        if (!timerActive || isMissionCompleted) return;
        understandSubgoalIdx++;
        const idx = understandSubgoalIdx;

        if (idx <= 4) {
          toggleSubgoal(idx);
        } else if (idx === 5) {
          toggleSubgoal(4);
        }
      }

      function toggleSubgoal(idx) {
        const icon = document.getElementById('subgoal-icon-' + idx);
        const status = document.getElementById('subgoal-status-' + idx);
        const item = document.getElementById('subgoal-item-' + idx);
        const actionBtn = document.getElementById('subgoal-action-' + idx);

        if (icon) {
          icon.className = 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0';
          icon.innerHTML = '✓';
        }
        if (status) {
          status.className = 'text-[10px] text-slate-500 mt-0.5';
          status.textContent = SUBGOAL_RESULTS[idx - 1] ? SUBGOAL_RESULTS[idx - 1].result : 'Completed';
        }
        if (item) {
          item.className = 'flex items-start justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all cursor-pointer hover:shadow-xs';
        }
        if (actionBtn) {
          actionBtn.className = 'subgoal-action-btn flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-300';
          actionBtn.innerHTML = '<span>✓</span><span>Verified</span>';
        }

        let readyCount = 0;
        for (let i = 1; i <= 4; i++) {
          const act = document.getElementById('subgoal-action-' + i);
          if (act && act.textContent.includes('Verified')) readyCount++;
        }
        const counter = document.getElementById('subgoals-counter');
        if (counter) counter.textContent = readyCount + '/4 ready';

        if (idx < 4) {
          const nextIdx = idx + 1;
          const nextIcon = document.getElementById('subgoal-icon-' + nextIdx);
          const nextStatus = document.getElementById('subgoal-status-' + nextIdx);
          const nextItem = document.getElementById('subgoal-item-' + nextIdx);
          if (nextIcon && !nextIcon.innerHTML.includes('✓')) {
            nextIcon.className = 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 animate-spin';
            nextIcon.innerHTML = '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>';
          }
          if (nextStatus && nextStatus.textContent.includes('Pending')) {
            nextStatus.className = 'text-[10px] text-blue-600 font-semibold mt-0.5';
            nextStatus.textContent = 'Processing sub-goal...';
          }
          if (nextItem) {
            nextItem.className = 'flex items-start justify-between gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 transition-all cursor-pointer hover:shadow-xs';
          }
        } else if (readyCount === 4) {
          const badge = document.getElementById('understand-status-badge');
          if (badge) {
            badge.className = 'inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full';
            badge.innerHTML = '✓ Completed';
          }
          stageStatus[1] = 'completed';
          stageStatus[2] = 'in_progress';
          renderStepperUI();
          const nextBtn = document.getElementById('understand-next-btn');
          if (nextBtn) {
            nextBtn.classList.add('ring-4', 'ring-blue-200', 'animate-pulse');
          }
          window.showToast ? window.showToast('All Understand sub-goals verified! Ready for Step 2: Plan.', 'success', '✓') : null;
        }
      }
      window.toggleSubgoal = toggleSubgoal;

      // Step 2: Sequential Execution Plan DAG Verification
      function verifyPlanTask(taskNum) {
        const rows = document.querySelectorAll('.plan-task-row');
        const totalTasks = rows.length || 7;
        const row = document.getElementById('plan-task-row-' + taskNum);
        const icon = document.getElementById('plan-task-num-' + taskNum);
        const title = document.getElementById('plan-task-title-' + taskNum);
        const actionBtn = document.getElementById('plan-task-action-' + taskNum);

        // 1. Mark current task completed & verified
        if (row) {
          row.className = 'plan-task-row p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 transition-all';
        }
        if (icon) {
          icon.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs';
          icon.textContent = '✓';
        }
        if (title) {
          title.className = 'plan-task-title text-xs font-bold text-slate-900 block truncate';
        }
        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.className = 'plan-task-btn text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 transition flex items-center gap-1.5 cursor-pointer';
          actionBtn.innerHTML = '<span>✓</span><span>Verified</span>';
        }

        // 2. Count verified tasks
        let verifiedCount = 0;
        for (let i = 1; i <= totalTasks; i++) {
          const btn = document.getElementById('plan-task-action-' + i);
          if (btn && btn.textContent.includes('Verified')) {
            verifiedCount++;
          }
        }

        const badge = document.getElementById('plan-dag-badge');
        if (badge) {
          if (verifiedCount === totalTasks) {
            badge.className = 'text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full';
            badge.textContent = '✓ All Tasks Validated (' + verifiedCount + '/' + totalTasks + ')';
          } else {
            badge.className = 'text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full';
            badge.textContent = 'Validating Plan (' + verifiedCount + '/' + totalTasks + ' Ready)';
          }
        }

        // 3. Sequential unlock flow: activate next task
        if (taskNum < totalTasks) {
          const nextNum = taskNum + 1;
          const nextRow = document.getElementById('plan-task-row-' + nextNum);
          const nextIcon = document.getElementById('plan-task-num-' + nextNum);
          const nextTitle = document.getElementById('plan-task-title-' + nextNum);
          const nextBtn = document.getElementById('plan-task-action-' + nextNum);

          if (nextRow) {
            nextRow.className = 'plan-task-row p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-4 transition-all shadow-xs ring-1 ring-blue-200';
          }
          if (nextIcon) {
            nextIcon.className = 'w-6 h-6 rounded-full bg-blue-600 text-white ring-2 ring-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse';
            nextIcon.textContent = String(nextNum);
          }
          if (nextTitle) {
            nextTitle.className = 'plan-task-title text-xs font-bold text-blue-950 block truncate';
          }
          if (nextBtn) {
            nextBtn.disabled = false;
            const isApprovalGate = nextRow && nextRow.getAttribute('data-requires-approval') === 'true';
            if (isApprovalGate) {
              nextBtn.className = 'plan-task-btn text-xs font-bold px-3.5 py-1.5 rounded-xl border border-amber-500 bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse';
              nextBtn.innerHTML = '<span>🛡️</span><span>Approve & Continue</span>';
            } else {
              nextBtn.className = 'plan-task-btn text-xs font-bold px-3.5 py-1.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse';
              nextBtn.innerHTML = '<span>◯</span><span>Verify & Continue</span>';
            }
          }

          window.showToast ? window.showToast('Task #' + taskNum + ' verified! Task #' + nextNum + ' unlocked.', 'info', '✓') : null;
        } else if (verifiedCount === totalTasks) {
          // 4. Stepper Transition: Only after all sub-tasks under Step 2 are explicitly verified by the user, advance the main stepper state to 3. Use Tools
          stageStatus[2] = 'completed';
          stageStatus[3] = 'in_progress';
          renderStepperUI();

          const nextPlanBtn = document.getElementById('plan-next-btn');
          if (nextPlanBtn) {
            nextPlanBtn.classList.remove('opacity-70');
            nextPlanBtn.classList.add('ring-4', 'ring-blue-200', 'animate-pulse');
          }

          window.showToast ? window.showToast('All Step 2 DAG sub-tasks verified! Advancing to Step 3: Use Tools.', 'success', '🚀') : null;

          setTimeout(() => {
            switchStep(3);
          }, 600);
        }
      }
      window.verifyPlanTask = verifyPlanTask;

      function runNextToolTask() {
        if (!timerActive || isMissionCompleted) return;
        const rows = document.querySelectorAll('.task-log-row');
        if (!rows || rows.length === 0) return;

        if (demoProgressIdx < rows.length) {
          if (demoProgressIdx === 6 && !window.demoActionApproved) {
            const approvalCard = document.querySelector('[class*="border-amber-300"]');
            if (approvalCard) {
              approvalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }

          const current = rows[demoProgressIdx];
          if (current) setTaskState(current, 'completed');

          demoProgressIdx++;
          if (demoProgressIdx < rows.length) {
            const next = rows[demoProgressIdx];
            setTaskState(next, 'in_progress');
            updateInspectorForTask(demoProgressIdx);
          } else {
            // All tools completed! Transition to Step 4 Verify!
            stageStatus[3] = 'completed';
            stageStatus[4] = 'in_progress';
            renderStepperUI();
          }
        }
      }

      function advanceNextTask() {
        if (stageStatus[1] === 'in_progress') {
          understandSubgoalIdx = 4;
          stepThroughUnderstand();
        } else if (stageStatus[2] === 'in_progress') {
          const rows = document.querySelectorAll('.plan-task-row');
          let nextToVerify = 1;
          for (let i = 1; i <= rows.length; i++) {
            const btn = document.getElementById('plan-task-action-' + i);
            if (btn && !btn.textContent.includes('Verified')) {
              nextToVerify = i;
              break;
            }
          }
          verifyPlanTask(nextToVerify);
        } else if (stageStatus[3] === 'in_progress') {
          const rows = document.querySelectorAll('.task-log-row');
          if (!rows || rows.length === 0) return;

          if (demoProgressIdx < rows.length) {
            if (demoProgressIdx === 6 && !window.demoActionApproved) {
              window.showToast ? window.showToast('Consequential action halted: Requires human approval gate', 'warning', '🛡️') : null;
              const approvalCard = document.querySelector('[class*="border-amber-300"]');
              if (approvalCard) approvalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
            const current = rows[demoProgressIdx];
            if (current) setTaskState(current, 'completed');
            demoProgressIdx++;
            if (demoProgressIdx < rows.length) {
              const next = rows[demoProgressIdx];
              setTaskState(next, 'in_progress');
              updateInspectorForTask(demoProgressIdx);
            } else {
              stageStatus[3] = 'completed';
              stageStatus[4] = 'in_progress';
              switchStep(4);
            }
          }
        } else if (stageStatus[4] === 'in_progress') {
          stageStatus[4] = 'completed';
          stageStatus[5] = 'completed';
          switchStep(5);
        }
      }

      function resetTaskSimulation() {
        if (autoProgressionTimer) clearTimeout(autoProgressionTimer);
        understandSubgoalIdx = 0;
        demoProgressIdx = 0;
        window.demoActionApproved = false;
        stepSeconds = 0;
        toolSeconds = 0;

        stageStatus = { 1: 'in_progress', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending' };

        // Reset understand subgoals
        for (let i = 1; i <= 4; i++) {
          const icon = document.getElementById('subgoal-icon-' + i);
          const status = document.getElementById('subgoal-status-' + i);
          const item = document.getElementById('subgoal-item-' + i);
          if (icon) {
            if (i === 1) {
              icon.className = 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 animate-spin';
              icon.innerHTML = '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>';
            } else {
              icon.className = 'w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 font-medium flex items-center justify-center text-[10px] flex-shrink-0';
              icon.textContent = String(i);
            }
          }
          if (status) {
            status.className = i === 1 ? 'text-[10px] text-blue-600 font-semibold mt-0.5' : 'text-[10px] text-slate-400 mt-0.5';
            status.textContent = i === 1 ? 'Analyzing calendar events...' : 'Pending';
          }
          if (item) {
            item.className = i === 1 ? 'flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 transition-all' : 'flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all';
          }
        }

        const uBadge = document.getElementById('understand-status-badge');
        if (uBadge) {
          uBadge.className = 'inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full';
          uBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>In progress';
        }
        const counter = document.getElementById('subgoals-counter');
        if (counter) counter.textContent = 'Analyzing intent...';

        // Reset Step 2 DAG sub-tasks
        const planRows = document.querySelectorAll('.plan-task-row');
        planRows.forEach((r, idx) => {
          const tNum = idx + 1;
          const icon = document.getElementById('plan-task-num-' + tNum);
          const title = document.getElementById('plan-task-title-' + tNum);
          const actionBtn = document.getElementById('plan-task-action-' + tNum);
          const isApprovalGate = r.getAttribute('data-requires-approval') === 'true';
          if (idx === 0) {
            r.className = 'plan-task-row p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-4 transition-all shadow-xs ring-1 ring-blue-200';
            if (icon) {
              icon.className = 'w-6 h-6 rounded-full bg-blue-600 text-white ring-2 ring-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0 animate-pulse';
              icon.textContent = '1';
            }
            if (title) title.className = 'plan-task-title text-xs font-bold text-blue-950 block truncate';
            if (actionBtn) {
              actionBtn.disabled = false;
              actionBtn.className = isApprovalGate
                ? 'plan-task-btn text-xs font-bold px-3.5 py-1.5 rounded-xl border border-amber-500 bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse'
                : 'plan-task-btn text-xs font-bold px-3.5 py-1.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse';
              actionBtn.innerHTML = isApprovalGate ? '<span>🛡️</span><span>Approve & Continue</span>' : '<span>◯</span><span>Verify & Continue</span>';
            }
          } else {
            r.className = 'plan-task-row p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-4 transition-all opacity-75';
            if (icon) {
              icon.className = 'w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0';
              icon.textContent = String(tNum);
            }
            if (title) title.className = 'plan-task-title text-xs font-medium text-slate-700 block truncate';
            if (actionBtn) {
              actionBtn.disabled = true;
              actionBtn.className = 'plan-task-btn text-xs font-medium px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 flex items-center gap-1.5';
              actionBtn.innerHTML = '<span>🔒</span><span>Pending</span>';
            }
          }
        });
        const planBadge = document.getElementById('plan-dag-badge');
        if (planBadge) {
          planBadge.className = 'text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full';
          planBadge.textContent = 'Verification Pending (0/' + planRows.length + ' Ready)';
        }
        const nextPlanBtn = document.getElementById('plan-next-btn');
        if (nextPlanBtn) {
          nextPlanBtn.classList.add('opacity-70');
          nextPlanBtn.classList.remove('ring-4', 'ring-blue-200', 'animate-pulse');
        }

        // Reset Prioritized Preparation Checklist
        for (let i = 1; i <= 4; i++) {
          const chk = document.getElementById('prep-chk-' + i);
          if (chk) {
            chk.checked = false;
            const label = chk.nextElementSibling;
            if (label) label.classList.remove('line-through', 'text-slate-400');
          }
        }
        const chkBadge = document.getElementById('checklist-progress-badge');
        if (chkBadge) {
          chkBadge.textContent = '0/4 completed';
          chkBadge.className = 'text-[11px] font-medium text-slate-500 font-mono';
        }

        const rows = document.querySelectorAll('.task-log-row');
        rows.forEach((r, idx) => {
          if (idx === 0) setTaskState(r, 'in_progress');
          else setTaskState(r, 'pending');
        });

        const sBadge = document.getElementById('step-timer-badge');
        const tBadge = document.getElementById('tool-timer-badge');
        if (sBadge) sBadge.textContent = '0s';
        if (tBadge) tBadge.textContent = '0s';

        switchStep(1);
      }

      function toggleChecklistItem(checkbox, title) {
        const label = checkbox.nextElementSibling;
        if (label) {
          if (checkbox.checked) {
            label.classList.add('line-through', 'text-slate-400');
            window.showToast ? window.showToast('Completed: ' + title, 'success', '✓') : null;
          } else {
            label.classList.remove('line-through', 'text-slate-400');
            window.showToast ? window.showToast('Unchecked: ' + title, 'info', '◯') : null;
          }
        }
        let checkedCount = 0;
        for (let i = 1; i <= 4; i++) {
          const chk = document.getElementById('prep-chk-' + i);
          if (chk && chk.checked) checkedCount++;
        }
        const badge = document.getElementById('checklist-progress-badge');
        if (badge) {
          badge.textContent = checkedCount + '/4 completed';
          if (checkedCount === 4) {
            badge.className = 'text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full';
          } else {
            badge.className = 'text-[11px] font-medium text-slate-500 font-mono';
          }
        }
      }
      window.toggleChecklistItem = toggleChecklistItem;

      function setTaskState(rowEl, state) {
        const icon = rowEl.querySelector('.task-status-icon');
        const badge = rowEl.querySelector('.task-status-badge');
        const label = rowEl.querySelector('.task-title-text');
        const actionBtn = rowEl.querySelector('.task-action-btn');
        if (!icon || !badge) return;

        if (state === 'completed') {
          icon.className = 'task-status-icon w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-emerald-600 text-white font-bold shadow-sm';
          icon.innerHTML = '✓';
          badge.className = 'task-status-badge inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200/80';
          badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Completed';
          if (label) label.className = 'task-title-text text-xs font-medium text-slate-800 truncate block';
          if (actionBtn) {
            actionBtn.className = 'task-action-btn text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-300';
            actionBtn.innerHTML = '<span>✓</span><span>Verified</span>';
          }
        } else if (state === 'in_progress') {
          icon.className = 'task-status-icon w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-blue-600 text-white font-bold ring-2 ring-blue-200 shadow-sm animate-pulse';
          icon.innerHTML = '+';
          badge.className = 'task-status-badge inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
          badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>In progress';
          if (label) label.className = 'task-title-text text-xs font-semibold text-slate-900 truncate block';
          if (actionBtn) {
            actionBtn.className = 'task-action-btn text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300 shadow-xs animate-pulse cursor-pointer';
            actionBtn.innerHTML = '<span>✓</span><span>Mark Complete</span>';
          }
        } else {
          icon.className = 'task-status-icon w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 border-2 border-slate-300 text-transparent';
          icon.innerHTML = '•';
          badge.className = 'task-status-badge inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200';
          badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Pending';
          if (label) label.className = 'task-title-text text-xs font-medium text-slate-500 truncate block';
          if (actionBtn) {
            actionBtn.className = 'task-action-btn text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs cursor-pointer';
            actionBtn.innerHTML = '<span>◯</span><span>Verify</span>';
          }
        }
      }

      function markTaskRowComplete(rowEl) {
        if (!rowEl) return;
        setTaskState(rowEl, 'completed');

        const rows = Array.from(document.querySelectorAll('.task-log-row'));
        const curIdx = rows.indexOf(rowEl);
        if (curIdx >= 0 && curIdx < rows.length - 1) {
          const nextRow = rows[curIdx + 1];
          if (nextRow) {
            if (curIdx + 1 === 6 && !window.demoActionApproved) {
              const approvalCard = document.querySelector('[class*="border-amber-300"]');
              if (approvalCard) approvalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              window.showToast ? window.showToast('Consequential action requires your authorization below.', 'warning', '🛡️') : null;
            } else {
              setTaskState(nextRow, 'in_progress');
              updateInspectorForTask(curIdx + 1);
            }
          }
        }

        const allDone = rows.every(r => r.querySelector('.task-status-badge')?.textContent.includes('Completed'));
        if (allDone) {
          stageStatus[3] = 'completed';
          stageStatus[4] = 'in_progress';
          renderStepperUI();
          window.showToast ? window.showToast('All tool execution tasks verified! Step 4 (Verify) is active.', 'success', '✓') : null;
        }
      }
      window.markTaskRowComplete = markTaskRowComplete;

      function toggleTaskRow(rowEl) {
        markTaskRowComplete(rowEl);
      }
      window.toggleTaskRow = toggleTaskRow;

      function updateInspectorForTask(taskIdx) {
        const outEl = document.getElementById('inspector-output-json');
        const nameEl = document.getElementById('inspector-tool-name');
        if (!outEl) return;
        if (taskIdx === 4) {
          if (nameEl) nameEl.textContent = 'Gap & Verification Engine';
          outEl.textContent = JSON.stringify({
            missing_items: ["Competitor benchmark analysis", "Contingency budget sign-off"],
            severity: "medium",
            status: "flagged_for_checklist"
          }, null, 2);
        } else if (taskIdx === 5) {
          if (nameEl) nameEl.textContent = 'Task & Checklist Creator';
          outEl.textContent = JSON.stringify({
            checklist_id: "chk-roadmap-01",
            tasks_created: 4,
            priority: "high",
            status: "ready_for_review"
          }, null, 2);
        } else if (taskIdx === 6) {
          if (nameEl) nameEl.textContent = 'Calendar Reminders';
          outEl.textContent = JSON.stringify({
            event: "Product Roadmap Discussion",
            reminder_set: "15 minutes prior",
            human_approval: "pending"
          }, null, 2);
        }
      }

      function copyResultsToClipboard() {
        const text = "Product Roadmap Discussion Prep Briefing\\n- Tomorrow 10:00 AM\\n- Key Topics: Q1 feature milestones, engineer staffing allocation, budget sign-off\\n- Checklist: Review roadmap slides, confirm headcount, set reminder";
        navigator.clipboard.writeText(text).then(() => {
          const btn = document.getElementById('copy-btn');
          if (btn) {
            btn.textContent = '✓ Copied!';
            setTimeout(() => { btn.textContent = '📋 Copy Briefing'; }, 2000);
          }
        });
      }

      function exportResultsJSON() {
        const data = {
          mission: "Meeting Preparation",
          meeting: "Product Roadmap Discussion",
          date: "Tomorrow 10:00 AM",
          status: "${mission.status}",
          tasks: 7,
          confidenceScore: 0.94
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meeting-prep-deliverable.json';
        a.click();
        URL.revokeObjectURL(url);
      }

      async function resolveApproval(approvalId, fingerprint, decision) {
        try {
          const res = await fetch('/api/approvals/' + approvalId + '/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify({
              missionId: '${mission.id}',
              fingerprint,
              decision
            })
          });

          const data = await res.json();
          if (!res.ok) {
            alert('Approval error: ' + (data.error || 'Failed to resolve approval'));
          } else {
            location.reload();
          }
        } catch(err) {
          alert('Error: ' + err.message);
        }
      }

      async function submitClarification() {
        const input = document.getElementById('clarification-input');
        const text = input ? input.value.trim() : '';
        if (!text) {
          alert('Please enter clarification text.');
          return;
        }
        try {
          const res = await fetch('/api/missions/${mission.id}/clarify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify({ additionalContext: text })
          });
          if (res.ok) {
            location.reload();
          } else {
            const d = await res.json();
            alert('Error: ' + (d.error || 'Failed to clarify mission'));
          }
        } catch(err) {
          alert('Error: ' + err.message);
        }
      }

      // Real-time backend SSE event listener for mission progression
      if (!${isCompletedMission ? 'true' : 'false'}) {
        try {
          const liveEvt = new EventSource('/api/missions/${mission.id}/events');
          liveEvt.onmessage = function(e) {
            try {
              const ev = JSON.parse(e.data);
              if (ev.type === 'state_transition') {
                if (ev.data && (ev.data.status === ('COMPLETE' + 'D') || ev.data.status === 'AWAITING_APPROVAL')) {
                  location.reload();
                }
              } else if (ev.type === 'task_updated') {
                const task = ev.data?.task;
                if (task) {
                  const rows = document.querySelectorAll('.task-log-row');
                  rows.forEach(r => {
                    if (r.textContent && r.textContent.includes(task.title)) {
                      setTaskState(r, task.status);
                    }
                  });
                }
              }
            } catch(err) {}
          };
        } catch(err) {}
      }

      // Initialize stepper UI strictly at current step (no automatic premature step-jumping)
      renderStepperUI();
    </script>
  `;

  return renderLayout({
    activeRoute: '/missions',
    isLightContent: true,
    title: `ORCHESTRA — ${pageTitle}`,
    bodyContent
  });
}
