import { renderLayout } from '../components/layout.js';
import { OrchestratorDatabase } from '@orchestra/orchestrator';

export function renderHomePage(db: OrchestratorDatabase): string {
  // Query actual persisted data from SQLite
  const rawMissions = (db as any).db.prepare('SELECT * FROM missions ORDER BY created_at DESC LIMIT 5').all();
  const activities = (db as any).db.prepare('SELECT * FROM activity_events ORDER BY created_at DESC LIMIT 5').all();

  const totalMissions = (db as any).db.prepare('SELECT COUNT(*) as count FROM missions').get().count;
  const completedMissions = (db as any).db.prepare("SELECT COUNT(*) as count FROM missions WHERE status = 'COMPLETED'").get().count;
  const pendingApprovals = (db as any).db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'").get().count;
  const totalInvocations = (db as any).db.prepare('SELECT COUNT(*) as count FROM tool_invocation_records').get().count;

  const missionsListHtml = rawMissions.length === 0
    ? `<div class="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
         <p class="text-sm font-medium">No missions executed yet.</p>
         <p class="text-xs text-slate-600 mt-1">Type an objective above or click a popular use case card to launch a mission.</p>
       </div>`
    : rawMissions.map((m: any) => `
        <div class="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all">
          <div class="flex items-center gap-3.5 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full ${m.status === 'COMPLETED' ? 'bg-emerald-400' : m.status === 'AWAITING_APPROVAL' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'}"></span>
            <div class="min-w-0">
              <a href="/missions/${m.id}" class="text-sm font-semibold text-slate-200 hover:text-blue-400 truncate block">${m.goal}</a>
              <span class="text-xs text-slate-500">${new Date(m.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded border ${
              m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              m.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }">${m.status}</span>
            <a href="/missions/${m.id}" class="text-xs text-blue-400 hover:underline">View →</a>
          </div>
        </div>
      `).join('');

  const bodyContent = `
    <!-- ===================================================================== -->
    <!-- CINEMATIC INTRO SPLASH SCREEN WITH AMAZON LOGO ANIMATION             -->
    <!-- ===================================================================== -->
    <div id="intro-splash-screen" 
         class="fixed inset-0 z-50 bg-[#070A12] flex flex-col items-center justify-center transition-opacity duration-700 ease-out select-none cursor-pointer overflow-hidden"
         title="Click anywhere to skip intro">
      
      <!-- Instant Session Check: remove immediately if already seen in current session -->
      <script>
        (function() {
          try {
            if (sessionStorage.getItem('hasSeenIntro') === 'true' || sessionStorage.getItem('alexa_intro_seen') === 'true') {
              var el = document.getElementById('intro-splash-screen');
              if (el) { el.style.display = 'none'; el.remove(); }
            }
          } catch(e) {}
        })();
      </script>
      
      <!-- Celestial background radial glow & floating particle bubbles -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(33,150,243,0.16)_0%,rgba(255,153,0,0.08)_35%,transparent_70%)] blur-2xl animate-pulse"></div>
        <div class="absolute top-1/4 left-1/3 w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400/25 to-white/40 border border-sky-300/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]" style="animation: floatBubbleA 5s ease-in-out infinite;"></div>
        <div class="absolute bottom-1/3 right-1/4 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400/25 to-white/40 border border-amber-300/40 shadow-[0_0_18px_rgba(255,184,0,0.3)]" style="animation: floatBubbleC 6s ease-in-out infinite 0.5s;"></div>
      </div>

      <!-- Centered Animated Amazon Branding -->
      <div class="relative z-10 flex flex-col items-center transform transition-all duration-1000 scale-100">
        
        <div class="relative w-48 sm:w-56 h-auto flex flex-col items-center">
          
          <!-- Sequential Letter-Reveal / Typewriter "amazon" Wordmark -->
          <div class="flex items-center justify-center text-4xl sm:text-5xl font-black text-white tracking-tight leading-none select-none font-sans filter drop-shadow-[0_2px_15px_rgba(255,255,255,0.3)]">
            <span class="splash-letter" style="animation-delay: 0.08s;">a</span>
            <span class="splash-letter" style="animation-delay: 0.18s;">m</span>
            <span class="splash-letter" style="animation-delay: 0.28s;">a</span>
            <span class="splash-letter" style="animation-delay: 0.38s;">z</span>
            <span class="splash-letter" style="animation-delay: 0.48s;">o</span>
            <span class="splash-letter" style="animation-delay: 0.58s;">n</span>
            <span class="splash-caret"></span>
          </div>

          <!-- Glowing Orange Smile Arc Drawing Itself Underneath (starts right after letters finish) -->
          <div class="relative mt-2 w-36 sm:w-44 flex items-center justify-center splash-smile-draw">
            <img src="/static/amazon-smile-logo.png" 
                 alt="Amazon Smile" 
                 class="w-full h-auto object-contain filter drop-shadow-[0_0_24px_rgba(255,153,0,1)]" />
          </div>

          <!-- Subsequent: Electric Blue Alexa+ Glow Signature (smoothly fades in after logo) -->
          <div class="mt-4 flex items-center gap-2 splash-subsequent">
            <span class="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#2196F3] to-[#60a5fa] drop-shadow-[0_0_20px_rgba(33,150,243,0.7)] tracking-tight">
              Alexa+
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-500/40 uppercase tracking-widest shadow-sm">
              INTELLIGENT AGENT
            </span>
          </div>
        </div>

        <!-- Subsequent: Animated Loading Progress Line (smoothly fades in with Alexa+) -->
        <div class="mt-8 flex flex-col items-center gap-2 splash-subsequent">
          <div class="w-40 h-1.5 rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/60 p-[1px]">
            <div class="h-full bg-gradient-to-r from-sky-400 via-[#FF9900] to-blue-500 rounded-full splash-progress-fill"></div>
          </div>
          <span class="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">INITIALIZING AGENT ENVIRONMENT...</span>
        </div>
      </div>
    </div>

    <div class="relative w-full flex flex-col justify-between pb-4 bg-[#0A0D14]">
      
      <!-- ================================================================= -->
      <!-- FULL-WIDTH PANORAMIC EARTH HORIZON ARC & SUBTLE ATMOSPHERIC GLOW  -->
      <!-- ================================================================= -->
      <div class="absolute inset-x-0 top-0 h-[640px] pointer-events-none overflow-hidden z-0 flex justify-center">
        <!-- Subtle soft side glows with celestial animation -->
        <div class="absolute -left-36 top-10 w-[520px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)] blur-3xl animate-pulse-soft"></div>
        <div class="absolute -right-36 top-10 w-[520px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.09)_0%,transparent_70%)] blur-3xl animate-pulse-soft" style="animation-delay: 1.5s;"></div>

        <!-- Subtle golden dawn glow around the Amazon smile logo area with breathing effect -->
        <div class="absolute top-[180px] sm:top-[190px] md:top-[200px] w-[360px] h-[80px] bg-[radial-gradient(ellipse_at_center,rgba(255,184,0,0.4)_0%,rgba(255,153,0,0.15)_45%,transparent_75%)] rounded-[100%] blur-xl animate-celestial"></div>
        <div class="absolute top-[219px] sm:top-[229px] md:top-[239px] w-[280px] h-[4px] bg-gradient-to-r from-transparent via-[#FFB800] to-transparent rounded-full blur-[1px]"></div>

        <!-- Smooth thin curved horizon arc (Earth curvature style) spanning across the background -->
        <div class="absolute top-[220px] sm:top-[230px] md:top-[240px] w-[220vw] min-w-[1600px] max-w-[3200px] h-[1000px] rounded-[50%] border-t-[1.5px] border-sky-400/90 shadow-[0_-3px_24px_rgba(56,189,248,0.75),0_-10px_45px_rgba(37,99,235,0.35)] bg-gradient-to-b from-[#10243d] via-[#0b172a] to-[#0A0D14]">
          <!-- Celestial Earth atmospheric haze along the horizon line -->
          <div class="w-full h-36 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.22)_0%,rgba(14,165,233,0.08)_40%,transparent_70%)]"></div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- 1. HERO SECTION: TOP PILL TAG, HEADLINE, SUBTITLE, CHIPS, SMILE   -->
      <!-- ================================================================= -->
      <div class="relative z-10 pt-1 sm:pt-3 text-center flex flex-col items-center">
        <!-- Centered Top Pill Tag: AMAZON ALEXA+ -->
        <div class="text-center mb-2.5">
          <span class="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#8aa0ba] uppercase px-4 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 select-none shadow-sm backdrop-blur-md transition-all">
            <span class="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
            AMAZON ALEXA+
          </span>
        </div>

        <!-- Main Headline with radiant gradient & Floating Glass Bubbles -->
        <div class="relative w-full max-w-4xl mx-auto px-4">
          <!-- Floating Iridescent Glass Bubbles cluster orbiting the headline -->
          <div class="absolute inset-0 pointer-events-none select-none overflow-visible z-0" aria-hidden="true">
            <!-- Bubble 1: Large luminous cyan-blue bubble top-left -->
            <div class="absolute -top-4 left-2 sm:-left-8 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500/20 via-blue-400/15 to-white/35 border border-sky-300/50 shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),0_0_25px_rgba(56,189,248,0.4)] backdrop-blur-xs" style="animation: floatBubbleA 6s ease-in-out infinite;">
              <div class="absolute top-1.5 left-2 w-3 h-1.5 rounded-full bg-white/80 rotate-[-35deg]"></div>
              <div class="absolute bottom-2 right-2.5 w-1 h-1 rounded-full bg-sky-200/70"></div>
            </div>

            <!-- Bubble 2: Medium pearlescent glass bubble mid-left -->
            <div class="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-14 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-400/15 to-white/30 border border-sky-200/40 shadow-[inset_0_2px_5px_rgba(255,255,255,0.6),0_0_18px_rgba(99,102,241,0.35)] backdrop-blur-xs" style="animation: floatBubbleB 7.5s ease-in-out infinite 0.8s;">
              <div class="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/75 rotate-[-30deg]"></div>
            </div>

            <!-- Bubble 3: Micro sparkle orb lower-left -->
            <div class="absolute -bottom-2 left-8 sm:left-4 w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400/30 to-white/50 border border-cyan-200/60 shadow-[0_0_12px_rgba(34,211,238,0.5)]" style="animation: floatBubbleC 5s ease-in-out infinite 1.4s;">
              <div class="absolute top-0.5 left-0.5 w-1 h-0.5 rounded-full bg-white/90"></div>
            </div>

            <!-- Bubble 4: Radiant electric blue hero bubble orbiting top-right near "Alexa+" -->
            <div class="absolute -top-6 right-2 sm:-right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600/25 via-sky-400/20 to-white/40 border border-sky-300/60 shadow-[inset_0_3px_10px_rgba(255,255,255,0.7),0_0_30px_rgba(33,150,243,0.5)] backdrop-blur-xs" style="animation: floatBubbleC 6.8s ease-in-out infinite 1.1s;">
              <div class="absolute top-2 left-2.5 w-3.5 h-2 rounded-full bg-white/85 rotate-[-35deg]"></div>
              <div class="absolute bottom-2.5 right-3 w-1.5 h-1.5 rounded-full bg-cyan-200/80"></div>
            </div>

            <!-- Bubble 5: Medium glass bubble flanking right of Alexa+ -->
            <div class="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-12 w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-400/15 to-white/35 border border-sky-200/50 shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-xs" style="animation: floatBubbleA 5.5s ease-in-out infinite 2s;">
              <div class="absolute top-1.5 left-2 w-2.5 h-1 rounded-full bg-white/75 rotate-[-30deg]"></div>
            </div>

            <!-- Bubble 6: Sparkling micro bubble floating lower-right -->
            <div class="absolute -bottom-3 right-10 sm:right-6 w-5 h-5 rounded-full bg-gradient-to-tr from-sky-400/30 to-white/60 border border-sky-200/60 shadow-[0_0_14px_rgba(56,189,248,0.6)]" style="animation: floatBubbleB 4.8s ease-in-out infinite 0.5s;">
              <div class="absolute top-1 left-1 w-1.5 h-0.5 rounded-full bg-white"></div>
            </div>

            <!-- Subtle celestial radial glow behind "Alexa+" text -->
            <div class="absolute right-[10%] sm:right-[15%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,rgba(37,99,235,0.08)_45%,transparent_70%)] blur-md pointer-events-none"></div>
          </div>

          <!-- Headline Text -->
          <h1 class="relative z-10 text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-[1.14] max-w-3xl mx-auto">
            <span class="text-white block font-bold">Turn complex goals into</span>
            <span class="text-white font-bold">real outcomes with </span><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#2196F3] to-[#60a5fa] font-bold drop-shadow-[0_0_25px_rgba(33,150,243,0.5)]">Alexa+</span>
          </h1>
        </div>

        <!-- Subtitle -->
        <p class="text-slate-400 text-xs sm:text-[13px] font-normal max-w-xl mx-auto mt-2 tracking-normal leading-relaxed px-4">
          I can understand your objective, plan the work, use multiple tools, take actions, and keep you updated.
        </p>

        <!-- Four Compact Capability Pills matching reference with interactive micro-elevations -->
        <div class="flex items-center justify-center flex-wrap gap-2.5 mt-3.5 max-w-3xl mx-auto px-4 z-10 relative">
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-sky-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] backdrop-blur-md text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm select-none cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0" onclick="fillPromptAndFocus('Plan a complex task: ')">
            <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Plan a complex task
          </span>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm select-none cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0" onclick="fillPromptAndFocus('Analyze documents: ')">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Analyze documents
          </span>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm select-none cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0" onclick="fillPromptAndFocus('Find and organize information on ')">
            <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Find and organize information
          </span>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm select-none cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0" onclick="fillPromptAndFocus('Take actions with my tools: ')">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            Take actions with my tools
          </span>
        </div>

        <!-- Centered Amazon Smile Logo Floating Right in Dawn Corona -->
        <div class="relative z-10 mt-2 sm:mt-2.5 flex items-center justify-center animate-float-slow">
          <img src="/static/amazon-smile-logo.png" 
               alt="Amazon Smile" 
               class="w-32 sm:w-36 h-auto object-contain filter drop-shadow-[0_2px_18px_rgba(255,153,0,0.95)]" />
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- 2. SLEEK FLOATING WHITE PROMPT BOX (OVERLAPPING LOWER HORIZON)   -->
      <!-- ================================================================= -->
      <div class="relative z-20 -mt-1 sm:-mt-1.5 max-w-3xl mx-auto w-full px-4">
        <form id="mission-form" class="rounded-2xl bg-white shadow-[0_16px_50px_rgba(0,0,0,0.5)] px-4 py-3 sm:px-5 sm:py-3.5 border border-white/95 focus-within:ring-4 focus-within:ring-blue-500/25 focus-within:border-blue-400 transition-all">
          <div id="mission-error" class="hidden mb-1.5 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200"></div>

          <!-- Active Attached Files Chips Container -->
          <div id="attached-files-container" class="hidden mb-2 flex flex-wrap items-center gap-1.5 pt-0.5"></div>

          <textarea id="mission-goal-input" 
                    rows="1" 
                    placeholder="Tell me your goal in natural language..." 
                    class="w-full text-slate-900 placeholder-[#8e9aa8] text-sm sm:text-[14.5px] font-normal resize-none focus:outline-none bg-transparent leading-snug py-0.5"
                    required></textarea>

          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <!-- Left Action Pill Buttons: +, Deep Research v, and 🌐 Web -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- + Attachment Button -->
              <button id="attach-context-btn" 
                      type="button" 
                      onclick="openAttachmentModal(event)"
                      class="w-6 h-6 rounded-full bg-[#f1f4f8] hover:bg-[#e2e8f0] text-[#475569] hover:text-[#1e293b] flex items-center justify-center text-xs font-bold shadow-sm transition"
                      title="Attach context documents (.pdf, .docx)">
                +
              </button>
              
              <!-- Deep Research Dropdown Button -->
              <div class="relative inline-block text-left">
                <button id="deep-research-btn" 
                        type="button" 
                        onclick="toggleDeepResearchMenu(event)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f1f4f8] hover:bg-[#e2e8f0] text-[#1e293b] text-xs font-semibold shadow-sm transition border border-transparent hover:border-slate-200">
                  <span id="deep-research-label">Deep Research</span>
                  <span class="text-[9px] text-slate-500">⌵</span>
                </button>

                <!-- Dropdown Menu -->
                <div id="deep-research-menu" class="hidden absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 divide-y divide-slate-100">
                  <button type="button" onclick="setResearchMode('quick', 'Quick Mode', event)" class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition">
                    <span class="text-sm mt-0.5">⚡</span>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">Quick</span>
                        <span class="mode-check quick-check hidden text-blue-600 text-xs font-bold">✓</span>
                      </div>
                      <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Fast single-pass research & execution</p>
                    </div>
                  </button>
                  <button type="button" onclick="setResearchMode('deep', 'Deep Research', event)" class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition">
                    <span class="text-sm mt-0.5">🔬</span>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">Deep Research</span>
                        <span class="mode-check deep-check text-blue-600 text-xs font-bold">✓</span>
                      </div>
                      <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Multi-source deep synthesis & fact validation</p>
                    </div>
                  </button>
                  <button type="button" onclick="setResearchMode('autonomous', 'Autonomous', event)" class="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition">
                    <span class="text-sm mt-0.5">🤖</span>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-800">Autonomous</span>
                        <span class="mode-check autonomous-check hidden text-blue-600 text-xs font-bold">✓</span>
                      </div>
                      <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Autonomous multi-step DAG tool orchestration</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 🌐 Web Search Toggle Button -->
              <button id="web-search-btn" 
                      type="button" 
                      onclick="toggleWebSearch(event)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs transition"
                      title="Toggle Web Search capability">
                <span>🌐</span>
                <span>Web</span>
                <span id="web-search-indicator" class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              </button>
            </div>

            <!-- Right Controls: Voice Mic Icon & Blue Submission Arrow Button -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button id="voice-mic-btn"
                      type="button" 
                      onclick="toggleVoiceInput(event)"
                      class="text-[#64748b] hover:text-[#1e293b] p-1 transition text-sm rounded-full hover:bg-slate-100" 
                      title="Voice Input">
                🎙️
              </button>
              <button id="mission-submit-btn" 
                      type="submit" 
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center font-bold text-sm shadow-md transition disabled:opacity-50"
                      title="Launch Mission">
                ↑
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- ================================================================= -->
      <!-- 3. POPULAR USE CASES (4 CARDS IN A ROW)                          -->
      <!-- ================================================================= -->
      <div class="relative z-20 mt-3 sm:mt-4 max-w-5xl mx-auto w-full px-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold tracking-[0.2em] text-[#718298] uppercase flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            POPULAR USE CASES
          </span>
          <a href="/missions" class="text-xs font-semibold text-[#38bdf8] hover:text-white transition flex items-center gap-1">
            <span>View all</span>
            <span>→</span>
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          <!-- Card 1: Prepare me for my investor meeting... (Blue calendar icon) -->
          <div class="use-case-card relative p-3.5 rounded-xl bg-[#0c1424]/95 border border-[#1b2b45] hover:border-blue-400/60 hover:bg-[#111e36] backdrop-blur-md transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg min-h-[130px] transform hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(37,99,235,0.25)] overflow-hidden"
               data-prompt="Prepare me for my investor meeting tomorrow: check calendar, summarize financial updates, analyze documents, and create a talking points checklist.">
            <!-- Top neon accent stripe -->
            <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center text-xs mb-2 group-hover:scale-110 transition-transform shadow-md">
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors mb-0.5 leading-snug">Prepare me for my investor meeting...</h3>
              <p class="text-[11px] text-[#7c8ba1] group-hover:text-slate-300 leading-relaxed transition-colors">
                Check my calendar, summarize financials, analyze documents, and create talking points.
              </p>
            </div>
            <div class="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
              <span class="text-[10px] text-sky-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch now</span>
              <span class="text-[#475569] group-hover:text-[#38bdf8] group-hover:translate-x-1 transition-all text-xs font-bold">→</span>
            </div>
          </div>

          <!-- Card 2: Analyze these documents... (Green document icon) -->
          <div class="use-case-card relative p-3.5 rounded-xl bg-[#0c1424]/95 border border-[#1b2b45] hover:border-emerald-400/60 hover:bg-[#111e36] backdrop-blur-md transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg min-h-[130px] transform hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(16,185,129,0.25)] overflow-hidden"
               data-prompt="Analyze these documents: summarize key information, find insights, and create an action plan.">
            <!-- Top neon accent stripe -->
            <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xs mb-2 group-hover:scale-110 transition-transform shadow-md">
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 class="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors mb-0.5 leading-snug">Analyze these documents...</h3>
              <p class="text-[11px] text-[#7c8ba1] group-hover:text-slate-300 leading-relaxed transition-colors">
                Summarize key information, find insights, and create an action plan.
              </p>
            </div>
            <div class="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
              <span class="text-[10px] text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch now</span>
              <span class="text-[#475569] group-hover:text-emerald-400 group-hover:translate-x-1 transition-all text-xs font-bold">→</span>
            </div>
          </div>

          <!-- Card 3: Review this data... (Purple chart icon) -->
          <div class="use-case-card relative p-3.5 rounded-xl bg-[#0c1424]/95 border border-[#1b2b45] hover:border-purple-400/60 hover:bg-[#111e36] backdrop-blur-md transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg min-h-[130px] transform hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(168,85,247,0.25)] overflow-hidden"
               data-prompt="Review this data: find key trends, risks and opportunities, and generate a report.">
            <!-- Top neon accent stripe -->
            <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-xs mb-2 group-hover:scale-110 transition-transform shadow-md">
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <h3 class="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors mb-0.5 leading-snug">Review this data...</h3>
              <p class="text-[11px] text-[#7c8ba1] group-hover:text-slate-300 leading-relaxed transition-colors">
                Find key trends, risks and opportunities, and generate a report.
              </p>
            </div>
            <div class="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
              <span class="text-[10px] text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch now</span>
              <span class="text-[#475569] group-hover:text-purple-400 group-hover:translate-x-1 transition-all text-xs font-bold">→</span>
            </div>
          </div>

          <!-- Card 4: Create an action plan (Orange checklist icon) -->
          <div class="use-case-card relative p-3.5 rounded-xl bg-[#0c1424]/95 border border-[#1b2b45] hover:border-amber-400/60 hover:bg-[#111e36] backdrop-blur-md transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-lg min-h-[130px] transform hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(245,158,11,0.25)] overflow-hidden"
               data-prompt="Create an action plan: break down my goal into tasks, set priorities, and track progress.">
            <!-- Top neon accent stripe -->
            <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center text-xs mb-2 group-hover:scale-110 transition-transform shadow-md">
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              </div>
              <h3 class="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors mb-0.5 leading-snug">Create an action plan</h3>
              <p class="text-[11px] text-[#7c8ba1] group-hover:text-slate-300 leading-relaxed transition-colors">
                Break down my goal into tasks, set priorities, and track progress.
              </p>
            </div>
            <div class="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
              <span class="text-[10px] text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Launch now</span>
              <span class="text-[#475569] group-hover:text-amber-400 group-hover:translate-x-1 transition-all text-xs font-bold">→</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================= -->
      <!-- ATTACHMENT MODAL (File Picker & Context Document Chooser)         -->
      <!-- ================================================================= -->
      <div id="attachment-modal" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">📄</div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Attach Context Documents</h3>
                <p class="text-[11px] text-slate-500">Provide document context to ground Alexa+'s agentic tools</p>
              </div>
            </div>
            <button type="button" onclick="closeAttachmentModal()" class="text-slate-400 hover:text-slate-600 p-1 text-base leading-none font-bold">✕</button>
          </div>

          <!-- File upload drag & drop box -->
          <div class="mt-4">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Upload local documents (.pdf, .docx, .txt, .json):</label>
            <div class="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/25 transition" onclick="document.getElementById('modal-file-input').click()">
              <input type="file" id="modal-file-input" multiple accept=".pdf,.docx,.doc,.txt,.md,.json,.csv" class="hidden" onchange="handleFilesSelected(event)">
              <div class="text-2xl mb-1">📁</div>
              <p class="text-xs font-semibold text-slate-700">Click to browse or drop local files</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, TXT, JSON, CSV (stored in MCP context)</p>
            </div>
          </div>

          <!-- Quick-select repository files -->
          <div class="mt-4">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-slate-700">Available MCP Knowledge Documents:</label>
              <span class="text-[10px] text-slate-400 font-medium">Click to attach</span>
            </div>
            <div id="modal-docs-list" class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <div class="p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 bg-slate-50/80 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition" onclick="attachPredefinedDoc('doc-q4-roadmap', 'Q4 Product Roadmap.pdf', 'PDF', '4.2 MB')">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">PDF</span>
                  <span class="text-xs font-medium text-slate-800 truncate">Q4 Product Roadmap</span>
                  <span class="text-[10px] text-slate-400">(4.2 MB)</span>
                </div>
                <span class="text-xs font-bold text-blue-600 hover:underline">Attach +</span>
              </div>
              <div class="p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 bg-slate-50/80 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition" onclick="attachPredefinedDoc('doc-competitor-analysis', 'Competitor Analysis 2026.docx', 'DOCX', '1.8 MB')">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">DOCX</span>
                  <span class="text-xs font-medium text-slate-800 truncate">Competitor Analysis 2026</span>
                  <span class="text-[10px] text-slate-400">(1.8 MB)</span>
                </div>
                <span class="text-xs font-bold text-blue-600 hover:underline">Attach +</span>
              </div>
              <div class="p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 bg-slate-50/80 hover:bg-blue-50/40 flex items-center justify-between cursor-pointer transition" onclick="attachPredefinedDoc('doc-market-trends', 'Market Trends 2026 Sheet', 'Sheet', '2.1 MB')">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">SHEET</span>
                  <span class="text-xs font-medium text-slate-800 truncate">Market Trends 2026 Sheet</span>
                  <span class="text-[10px] text-slate-400">(2.1 MB)</span>
                </div>
                <span class="text-xs font-bold text-blue-600 hover:underline">Attach +</span>
              </div>
            </div>
          </div>

          <!-- Done button -->
          <div class="mt-5 pt-3 border-t border-slate-100 flex justify-end">
            <button type="button" onclick="closeAttachmentModal()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition">
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- 4. REAL ORCHESTRA METRICS & EXECUTION LEDGER                      -->
      <!-- ================================================================= -->
      <details class="max-w-5xl mx-auto w-full px-4 mt-3 mb-2 z-20 relative group text-xs">
        <summary class="cursor-pointer text-slate-500 hover:text-slate-300 py-1.5 flex items-center justify-between select-none">
          <span class="flex items-center gap-2 font-semibold tracking-wider uppercase text-[10px] text-slate-400">
            <span>📊</span> Live Mission Ledger & Statistics (Click to inspect)
          </span>
          <span class="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <section class="space-y-4 pt-3 pb-2">
          <!-- Live Metrics Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-xs text-slate-400 font-medium">Total Missions</span>
              <p class="text-xl font-bold text-white mt-1">${totalMissions}</p>
            </div>
            <div class="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-xs text-emerald-400 font-medium">Completed Missions</span>
              <p class="text-xl font-bold text-emerald-400 mt-1">${completedMissions}</p>
            </div>
            <div class="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-xs text-amber-400 font-medium">Pending Approvals</span>
              <p class="text-xl font-bold text-amber-400 mt-1">${pendingApprovals}</p>
            </div>
            <div class="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span class="text-xs text-blue-400 font-medium">Tool Invocations</span>
              <p class="text-xl font-bold text-blue-400 mt-1">${totalInvocations}</p>
            </div>
          </div>

          <!-- Recent Missions & Activity Streams -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2 space-y-2">
              <div class="flex items-center justify-between">
                <h2 class="text-xs font-bold text-white uppercase tracking-wider">Recent Executions</h2>
                <a href="/missions" class="text-xs font-semibold text-blue-400 hover:underline">View all →</a>
              </div>
              <div class="space-y-2">
                ${missionsListHtml}
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h2 class="text-xs font-bold text-white uppercase tracking-wider">Audit Stream</h2>
                <a href="/activity" class="text-xs font-semibold text-blue-400 hover:underline">View log →</a>
              </div>
              <div class="bg-slate-900/60 rounded-xl border border-slate-800 p-3 space-y-2 max-h-48 overflow-y-auto">
                ${
                  activities.length === 0
                    ? '<p class="text-xs text-slate-500 py-2 text-center">No recorded activity events.</p>'
                    : activities.map((a: any) => `
                        <div class="text-xs border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                          <div class="flex items-center justify-between text-slate-400 text-[11px]">
                            <span class="font-medium text-slate-300">${a.title}</span>
                            <span>${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p class="text-slate-500 text-[11px] mt-0.5 truncate">${a.description}</p>
                        </div>
                      `).join('')
                }
              </div>
            </div>
          </div>
        </section>
      </details>

    </div>

    <!-- Client-side script for natural-language mission creation and card interactions -->
    <script>
      (function() {
        const form = document.getElementById('mission-form');
        const input = document.getElementById('mission-goal-input');
        const submitBtn = document.getElementById('mission-submit-btn');
        const errorBox = document.getElementById('mission-error');

        let currentResearchMode = 'deep';
        let isWebActive = true;
        let attachedFiles = [];

        // Auto-fit textarea height
        function adjustHeight() {
          if (input) {
            input.style.height = 'auto';
            input.style.height = Math.min(Math.max(input.scrollHeight, 28), 120) + 'px';
          }
        }
        if (input) {
          input.addEventListener('input', adjustHeight);
        }

        // Fill prompt & focus helper (used by top capability pills)
        window.fillPromptAndFocus = function(prefix) {
          if (input) {
            input.value = prefix;
            adjustHeight();
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };

        // Deep Research dropdown menu toggling & selection
        window.toggleDeepResearchMenu = function(e) {
          if (e) e.stopPropagation();
          const menu = document.getElementById('deep-research-menu');
          if (menu) menu.classList.toggle('hidden');
        };

        window.setResearchMode = function(mode, label, e) {
          if (e) e.stopPropagation();
          currentResearchMode = mode;
          const labelEl = document.getElementById('deep-research-label');
          if (labelEl) labelEl.textContent = label;

          document.querySelectorAll('.mode-check').forEach(el => el.classList.add('hidden'));
          const check = document.querySelector('.' + mode + '-check');
          if (check) check.classList.remove('hidden');

          const menu = document.getElementById('deep-research-menu');
          if (menu) menu.classList.add('hidden');
        };

        // Web search capability toggle
        window.toggleWebSearch = function(e) {
          if (e) e.stopPropagation();
          isWebActive = !isWebActive;
          const btn = document.getElementById('web-search-btn');
          const indicator = document.getElementById('web-search-indicator');
          if (btn && indicator) {
            if (isWebActive) {
              btn.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs transition';
              indicator.className = 'w-1.5 h-1.5 rounded-full bg-blue-600';
            } else {
              btn.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f1f4f8] hover:bg-[#e2e8f0] text-[#64748b] border border-transparent text-xs font-semibold shadow-xs transition';
              indicator.className = 'w-1.5 h-1.5 rounded-full bg-slate-300';
            }
          }
        };

        // Voice mic interaction
        window.toggleVoiceInput = function(e) {
          if (e) e.stopPropagation();
          const micBtn = document.getElementById('voice-mic-btn');
          if (micBtn) {
            micBtn.classList.toggle('animate-pulse');
            micBtn.classList.toggle('text-blue-600');
            if (input && !input.value) {
              input.placeholder = 'Listening... Speak your objective now';
              setTimeout(() => {
                input.placeholder = 'Tell me your goal in natural language...';
                micBtn.classList.remove('animate-pulse', 'text-blue-600');
              }, 3000);
            }
          }
        };

        // Attachment modal management
        window.openAttachmentModal = function(e) {
          if (e) e.stopPropagation();
          const modal = document.getElementById('attachment-modal');
          if (modal) modal.classList.remove('hidden');
        };

        window.closeAttachmentModal = function() {
          const modal = document.getElementById('attachment-modal');
          if (modal) modal.classList.add('hidden');
        };

        window.attachPredefinedDoc = function(id, name, type, size) {
          if (!attachedFiles.some(f => f.id === id || f.name === name)) {
            attachedFiles.push({ id, name, fileType: type, size });
            renderAttachmentChips();
          }
          window.closeAttachmentModal();
        };

        window.handleFilesSelected = function(e) {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const sizeStr = (file.size / 1024 > 1024)
              ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
              : Math.round(file.size / 1024) + ' KB';

            const reader = new FileReader();
            reader.onload = function(evt) {
              const content = evt.target && evt.target.result ? evt.target.result : '';
              attachedFiles.push({
                id: 'user-doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                name: file.name,
                fileType: file.name.split('.').pop().toUpperCase(),
                size: sizeStr,
                content: typeof content === 'string' ? content.substring(0, 50000) : ''
              });
              renderAttachmentChips();
            };
            reader.readAsText(file);
          }
          window.closeAttachmentModal();
        };

        window.removeAttachment = function(index) {
          attachedFiles.splice(index, 1);
          renderAttachmentChips();
        };

        function renderAttachmentChips() {
          const container = document.getElementById('attached-files-container');
          if (!container) return;
          if (attachedFiles.length === 0) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
          }
          container.classList.remove('hidden');
          container.innerHTML = attachedFiles.map((f, idx) => \`
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 shadow-xs">
              <span>📄</span>
              <span class="truncate max-w-[140px]">\${f.name}</span>
              <span class="text-[10px] text-slate-400">(\${f.size})</span>
              <button type="button" onclick="removeAttachment(\${idx})" class="text-slate-400 hover:text-rose-600 font-bold ml-0.5" title="Remove">✕</button>
            </span>
          \`).join('');
        }

        // Global dismiss for click-outside
        document.addEventListener('click', function(e) {
          const menu = document.getElementById('deep-research-menu');
          const btn = document.getElementById('deep-research-btn');
          if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
            menu.classList.add('hidden');
          }
          const modal = document.getElementById('attachment-modal');
          if (modal && e.target === modal) {
            modal.classList.add('hidden');
          }
        });

        // Core Mission Launcher Function
        async function launchMission(promptText) {
          const goal = (promptText || (input ? input.value : '')).trim();
          if (!goal || goal.length < 5) {
            if (errorBox) {
              errorBox.textContent = 'Please enter a detailed objective (at least 5 characters).';
              errorBox.classList.remove('hidden');
            }
            return;
          }

          if (errorBox) {
            errorBox.classList.add('hidden');
          }

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="inline-block animate-spin text-sm">⏳</span>';
          }

          const payload = {
            goal,
            researchMode: currentResearchMode,
            deepResearch: currentResearchMode === 'deep',
            webSearch: isWebActive,
            attachedFiles: attachedFiles
          };

          try {
            const res = await fetch('/api/missions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream, application/json'
              },
              body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.missionId) {
              window.location.href = '/missions/' + data.missionId;
            } else {
              throw new Error(data.error || 'Failed to initialize agent workflow.');
            }
          } catch (err) {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '↑';
            }
            if (errorBox) {
              errorBox.textContent = err.message || 'Error communicating with orchestrator.';
              errorBox.classList.remove('hidden');
            }
          }
        }

        // Popular Use Cases: clicking any card auto-populates input & launches the mission dynamically
        document.querySelectorAll('.use-case-card').forEach(card => {
          card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
              if (input) {
                input.value = prompt;
                adjustHeight();
              }
              // Active highlight feedback
              card.classList.add('ring-2', 'ring-blue-500', 'bg-[#122240]');
              setTimeout(() => {
                card.classList.remove('ring-2', 'ring-blue-500', 'bg-[#122240]');
              }, 1200);

              launchMission(prompt);
            }
          });
        });

        // Keyboard submit on Enter (without Shift) and Ctrl/Cmd+Enter
        if (input && form) {
          input.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' && !e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
              e.preventDefault();
              launchMission();
            }
          });
        }

        // Form submission via real API
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            launchMission();
          });
        }

        // Smooth Intro Splash Screen auto-dismiss & transition (Initial Session Load Only)
        (function() {
          const splash = document.getElementById('intro-splash-screen');
          if (!splash) return;

          // Check if already seen in session store
          try {
            if (sessionStorage.getItem('hasSeenIntro') === 'true' || sessionStorage.getItem('alexa_intro_seen') === 'true') {
              splash.remove();
              return;
            }
          } catch (e) {}

          function dismissSplash() {
            if (splash.classList.contains('opacity-0')) return;
            splash.classList.add('opacity-0', 'pointer-events-none');
            try {
              sessionStorage.setItem('hasSeenIntro', 'true');
              sessionStorage.setItem('alexa_intro_seen', 'true');
              document.documentElement.classList.add('intro-seen');
            } catch (e) {}
            setTimeout(() => {
              if (splash && splash.parentNode) {
                splash.remove();
              }
            }, 750);
          }

          // Auto-dismiss after 2.5 seconds (allowing full typewriter & reveal animation)
          const timer = setTimeout(dismissSplash, 2500);

          // Click anywhere to immediately dismiss
          splash.addEventListener('click', () => {
            clearTimeout(timer);
            dismissSplash();
          });

          // Press any key to skip intro
          window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
              clearTimeout(timer);
              dismissSplash();
            }
          }, { once: true });
        })();
      })();
    </script>
  `;

  return renderLayout({
    activeRoute: '/',
    title: 'ORCHESTRA — Turn complex goals into real outcomes with Alexa+',
    bodyContent
  });
}
