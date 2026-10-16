import { renderLayout } from '../components/layout.js';

export function renderNewConversationPage(): string {
  const bodyContent = `
    <!-- Main 2-Column Chat & Resource Workspace with Atmospheric Floating Bubbles -->
    <div class="max-w-[1400px] mx-auto min-h-[calc(100vh-5rem)] relative">
      
      <!-- Floating Bright Luminous Glass Bubbles Layer (High Visibility) -->
      <div class="absolute inset-0 pointer-events-none select-none overflow-visible z-20" aria-hidden="true">
        <!-- Bubble 1: Bright Electric Cyan Top-Left -->
        <div class="absolute -top-4 -left-4 sm:left-2 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400/50 via-blue-500/40 to-sky-100/70 border-2 border-sky-400/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.95),0_0_25px_rgba(14,165,233,0.55),0_6px_20px_rgba(56,189,248,0.35)] backdrop-blur-xs" style="animation: floatBubbleA 6.5s ease-in-out infinite;">
          <div class="absolute top-1.5 left-2.5 w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white] rotate-[-35deg]"></div>
          <div class="absolute bottom-2 right-2.5 w-1.5 h-1.5 rounded-full bg-sky-200"></div>
        </div>

        <!-- Bubble 2: Bright Radiant Indigo/Purple Mid-Left -->
        <div class="absolute top-1/4 -left-6 sm:-left-3 w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 to-indigo-100/70 border-2 border-indigo-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_22px_rgba(99,102,241,0.55)] backdrop-blur-xs" style="animation: floatBubbleB 7.8s ease-in-out infinite 0.8s;">
          <div class="absolute top-1 left-2 w-2.5 h-1 rounded-full bg-white shadow-[0_0_4px_white] rotate-[-30deg]"></div>
        </div>

        <!-- Bubble 3: Sparkling Cyan Orb Near Left Column Bottom -->
        <div class="absolute top-2/3 -left-3 w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400/60 via-blue-500/50 to-white/80 border-2 border-cyan-400/90 shadow-[0_0_20px_rgba(34,211,238,0.65)]" style="animation: floatBubbleC 5.5s ease-in-out infinite 1.4s;">
          <div class="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white"></div>
        </div>

        <!-- Bubble 4: Bright Electric Blue Top-Right -->
        <div class="absolute -top-5 -right-4 sm:right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600/50 via-sky-400/45 to-sky-100/75 border-2 border-blue-400/90 shadow-[inset_0_3px_10px_rgba(255,255,255,0.95),0_0_30px_rgba(37,99,235,0.55),0_8px_25px_rgba(56,189,248,0.4)] backdrop-blur-xs" style="animation: floatBubbleC 6.8s ease-in-out infinite 1.1s;">
          <div class="absolute top-2 left-2.5 w-4 h-2 rounded-full bg-white shadow-[0_0_6px_white] rotate-[-35deg]"></div>
          <div class="absolute bottom-2.5 right-3 w-2 h-2 rounded-full bg-sky-200"></div>
        </div>

        <!-- Bubble 5: Bright Emerald Glass Bubble Mid-Right -->
        <div class="absolute top-1/2 -right-5 sm:-right-2 w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 to-emerald-100/70 border-2 border-emerald-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_24px_rgba(16,185,129,0.5)] backdrop-blur-xs" style="animation: floatBubbleA 7.2s ease-in-out infinite 2s;">
          <div class="absolute top-1.5 left-2 w-3 h-1.5 rounded-full bg-white shadow-[0_0_4px_white] rotate-[-30deg]"></div>
        </div>

        <!-- Bubble 6: Glowing Amber Pearl Lower-Right -->
        <div class="absolute bottom-16 right-1/4 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/50 via-orange-400/40 to-amber-100/75 border-2 border-amber-400/80 shadow-[0_0_22px_rgba(245,158,11,0.55)]" style="animation: floatBubbleB 6s ease-in-out infinite 0.5s;">
          <div class="absolute top-1 left-1.5 w-2.5 h-1 rounded-full bg-white shadow-[0_0_4px_white]"></div>
        </div>
      </div>
      
      <!-- ======================================================== -->
      <!-- 1. INITIAL LANDING VIEW (CLEAN WHITE PRESET WORKSPACE)   -->
      <!-- ======================================================== -->
      <div id="initial-landing-view" class="relative z-10 max-w-4xl mx-auto py-6 sm:py-10 px-2 flex flex-col justify-between">
        
        <!-- Hero Section: Amazon Smile Wave Arc, Heading, Subtitle -->
        <div class="text-center">
          <!-- Centered Glowing Amazon Smile Wave Arc -->
          <div class="flex justify-center mb-5">
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,153,0,0.35)_0%,transparent_70%)] blur-xl"></div>
              <img src="/static/amazon-smile-logo.png" 
                   alt="Amazon Smile Wave Arc" 
                   class="h-9 w-auto object-contain filter drop-shadow-[0_2px_14px_rgba(255,153,0,0.85)] relative z-10 transition-transform hover:scale-105" />
            </div>
          </div>

          <!-- Main Heading -->
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-center leading-tight">
            How can <span class="text-[#0066FF] font-black">Alexa+</span> help you today?
          </h1>

          <!-- Reference Subtitle -->
          <p class="text-sm sm:text-base text-slate-500 max-w-2xl text-center mx-auto mt-3 leading-relaxed font-normal">
            Ask a complex question, set a goal, or give me a task. I can understand, plan, use the right tools, and get things done for you.
          </p>
        </div>

        <!-- 6 Preset Feature Cards Grid (2 rows x 3 columns) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          
          <!-- Card 1: Plan my day -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-blue-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Plan my day"
                  data-goal="Check my calendar and prepare for tomorrow's meeting."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">Plan my day</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;Check my calendar and prepare for tomorrow's meeting.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

          <!-- Card 2: Analyze a document -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-purple-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Analyze a document"
                  data-goal="Summarize this report and highlight key insights."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">Analyze a document</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;Summarize this report and highlight key insights.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-purple-50 text-slate-400 group-hover:text-purple-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

          <!-- Card 3: Create a checklist -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Create a checklist"
                  data-goal="I'm launching a project. Create a step-by-step checklist."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">Create a checklist</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;I'm launching a project. Create a step-by-step checklist.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

          <!-- Card 4: Find information -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-amber-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Find information"
                  data-goal="Search my knowledge base for relevant documents."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">Find information</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;Search my knowledge base for relevant documents.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

          <!-- Card 5: Analyze data -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-pink-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Analyze data"
                  data-goal="Analyze this data and generate a report."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-pink-600 transition-colors">Analyze data</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;Analyze this data and generate a report.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-pink-50 text-slate-400 group-hover:text-pink-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

          <!-- Card 6: Use my tools -->
          <button type="button" 
                  class="preset-card-btn bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-4 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                  data-title="Use my tools"
                  data-goal="Find documents in Drive, check my Notion, and summarize."
                  onclick="handlePresetClick(this)">
            <div>
              <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">Use my tools</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">&ldquo;Find documents in Drive, check my Notion, and summarize.&rdquo;</p>
            </div>
            <div class="flex justify-end mt-3">
              <span class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center text-xs font-bold transition-all group-hover:translate-x-0.5">→</span>
            </div>
          </button>

        </div>

        <!-- Bottom Floating Prompt Box -->
        <div class="mt-10 bg-white rounded-2xl border border-slate-200/90 shadow-md p-4 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          
          <!-- Textarea with Top-Right Action Controls -->
          <div class="flex items-start gap-3">
            <textarea id="landing-prompt-input" 
                      rows="2" 
                      placeholder="Describe what you want to do..." 
                      class="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                      onkeydown="handleLandingInputKeyDown(event)"></textarea>
            
            <!-- Top-Right Actions: Attachment clip, Microphone, Solid blue circular send arrow -->
            <div class="flex items-center gap-2 flex-shrink-0 pt-0.5">
              <button type="button" 
                      onclick="window.showToast ? window.showToast('Attachment dialog opened. Select local files or cloud documents.', 'info', '📎') : null"
                      class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition" 
                      title="Attach File">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
              </button>

              <button type="button" 
                      onclick="window.showToast ? window.showToast('Microphone listening... Speak your objective.', 'info', '🎙️') : null"
                      class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition" 
                      title="Voice Input">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </button>

              <button id="landing-send-btn" 
                      type="button" 
                      onclick="submitLandingPrompt()" 
                      class="w-9 h-9 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer" 
                      title="Send Goal">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <!-- Bottom Action Pill Row -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 flex-wrap gap-2">
            <!-- Left Pills: +, 🔍 Search, 📄 Deep Research, ☑️ Create Plan, 🛠️ Use Tools -->
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button type="button" 
                      onclick="window.showToast ? window.showToast('Add contextual document or workspace resource', 'info', '+') : null"
                      class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition" 
                      title="Add Context">
                +
              </button>

              <button type="button" 
                      onclick="togglePillActive(this, 'Search')" 
                      class="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer">
                <span>🔍</span>
                <span>Search</span>
              </button>

              <button type="button" 
                      onclick="togglePillActive(this, 'Deep Research')" 
                      class="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer">
                <span>📄</span>
                <span>Deep Research</span>
              </button>

              <button type="button" 
                      onclick="togglePillActive(this, 'Create Plan')" 
                      class="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer">
                <span>☑️</span>
                <span>Create Plan</span>
              </button>

              <button type="button" 
                      onclick="togglePillActive(this, 'Use Tools')" 
                      class="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer">
                <span>🛠️</span>
                <span>Use Tools</span>
              </button>
            </div>

            <!-- Right Model Selector: Claude 3.5 Sonnet v -->
            <div class="relative">
              <button type="button" 
                      onclick="toggleDropdown('landing-model-menu')" 
                      class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer">
                <span id="selected-model-label">Claude 3.5 Sonnet</span>
                <span class="text-[10px] text-slate-400">▼</span>
              </button>
              <div id="landing-model-menu" class="hidden absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 text-xs text-slate-700 z-30">
                <button type="button" onclick="setModel('Claude 3.5 Sonnet')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50 font-semibold text-blue-600">Claude 3.5 Sonnet</button>
                <button type="button" onclick="setModel('Claude 3 Opus')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50">Claude 3 Opus</button>
                <button type="button" onclick="setModel('GPT-4o Agent')" class="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50">GPT-4o Agent</button>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ======================================================== -->
      <!-- 2. SPLIT-PANE EXECUTION STREAM VIEW (ACTIVE CONVERSATION) -->
      <!-- ======================================================== -->
      <div id="execution-stream-view" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 hidden">
        
        <!-- Top Workspace Bar with Prominent Back to Capabilities button -->
        <div class="lg:col-span-12 flex items-center justify-between pb-3.5 -mb-2 border-b border-slate-200/90">
          <button type="button" 
                  id="return-to-landing-btn"
                  onclick="returnToLandingView()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-blue-600 font-bold text-xs shadow-xs transition group cursor-pointer">
            <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>← Back to Capabilities</span>
          </button>
          
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Active Mission Workspace
            </span>
          </div>
        </div>

        <!-- LEFT COLUMN: Interactive Chat & Live Execution Stream    -->
        <!-- ======================================================== -->
        <div class="lg:col-span-7 flex flex-col justify-between min-h-[82vh]">
          
          <!-- Chat Messages Container -->
          <div id="chat-stream-container" class="space-y-6 flex-1 pb-6">
            
            <!-- 1. User Prompt Bubble -->
            <div class="flex items-start gap-3.5">
              <div class="w-9 h-9 rounded-full bg-[#8fa0b5] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                SM
              </div>
              <div class="flex-1 max-w-2xl">
                <div id="user-prompt-text" class="bg-[#F0F5FD] border border-[#dbe6f6] rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 leading-relaxed shadow-xs">
                  I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do.
                </div>
                <div class="flex justify-end pr-1 mt-1">
                  <span class="text-[11px] text-slate-400">10:12 PM</span>
                </div>
              </div>
            </div>

            <!-- 2. Alexa+ Response Bubble -->
            <div class="flex items-start gap-3.5">
              <div class="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden p-1.5">
                <div class="flex flex-col items-center">
                  <span class="text-[9px] font-black tracking-tighter text-white leading-none">amazon</span>
                  <div class="w-4 h-0.5 bg-[#FF9900] rounded-full mt-0.5"></div>
                </div>
              </div>
              <div class="flex-1 max-w-2xl">
                <span class="text-xs font-bold text-slate-900 block mb-1.5">Alexa+</span>
                <p id="ai-response-text" class="text-xs text-slate-700 leading-relaxed">
                  Got it. I'll help you prepare for your meeting. I'll check your calendar, gather relevant documents, analyze the content, identify what's missing, and create a prioritized checklist. I'll also set reminders for you.
                </p>
                <span class="text-[11px] text-slate-400 mt-1.5 block">10:12 PM</span>
              </div>
            </div>

            <!-- 3. Live Execution Progress Card -->
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 ml-12">
              
              <!-- Progress Card Header (Collapsible) -->
              <div onclick="toggleExecAccordion()" class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 cursor-pointer select-none group" title="Click to collapse / expand execution steps">
                <div class="flex items-center gap-2.5">
                  <div id="exec-spinner" class="w-5 h-5 rounded-full border-2 border-slate-300 border-t-transparent flex items-center justify-center"></div>
                  <h3 id="exec-status-header" class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">Ready to execute...</h3>
                </div>
                <div class="flex items-center gap-2.5">
                  <span id="exec-counter-badge" class="text-xs font-medium text-slate-500">0/7 steps completed</span>
                  <span id="exec-chevron" class="text-slate-400 group-hover:text-slate-600 text-xs font-bold transition-transform">▲</span>
                </div>
              </div>

              <!-- Checklist Items List (7 Steps) -->
              <div id="exec-checklist-content" class="space-y-3">
                
                <!-- Step 1: In Progress -->
                <div id="exec-step-row-1" class="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/50 border border-blue-100/80 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-1" class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs animate-pulse ring-2 ring-blue-200">
                      +
                    </div>
                    <span id="exec-step-title-1" class="text-xs font-medium text-slate-800 truncate">Understanding your request and extracting key objectives...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-1" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(1)"
                            class="text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer animate-pulse shadow-xs">
                      ✓ Mark Complete
                    </button>
                    <span id="exec-step-badge-1" class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full animate-pulse">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>In progress
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 2: Pending -->
                <div id="exec-step-row-2" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-2" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </div>
                    <span id="exec-step-title-2" class="text-xs font-medium text-slate-700 truncate">Checking your calendar for upcoming meetings...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-2" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(2)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="exec-step-badge-2" class="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 3: Pending -->
                <div id="exec-step-row-3" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-3" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </div>
                    <span id="exec-step-title-3" class="text-xs font-medium text-slate-700 truncate">Finding and analyzing relevant documents...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-3" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(3)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="exec-step-badge-3" class="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 4: Pending -->
                <div id="exec-step-row-4" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-4" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      4
                    </div>
                    <span id="exec-step-title-4" class="text-xs font-medium text-slate-700 truncate">Identifying preparation gaps...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-4" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(4)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="exec-step-badge-4" class="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 5: Pending -->
                <div id="exec-step-row-5" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-5" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      5
                    </div>
                    <span id="exec-step-title-5" class="text-xs font-medium text-slate-700 truncate">Creating a prioritized checklist...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-5" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(5)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="exec-step-badge-5" class="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 6: Pending -->
                <div id="exec-step-row-6" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-6" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      6
                    </div>
                    <span id="exec-step-title-6" class="text-xs font-medium text-slate-700 truncate">Creating prioritized action plan...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-6" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(6)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="exec-step-badge-6" class="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

                <!-- Step 7: Pending (Requires Approval) -->
                <div id="exec-step-row-7" class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer" onclick="toggleTaskItem(this)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="exec-step-icon-7" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      7
                    </div>
                    <span id="exec-step-title-7" class="text-xs font-medium text-slate-700 truncate">Setting up reminders & actions...</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="exec-step-action-7" 
                            onclick="event.stopPropagation(); window.advanceStepInteractive(7)"
                            disabled
                            class="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60">
                      Authorize
                    </button>
                    <span id="exec-step-badge-7" class="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Requires Approval
                    </span>
                    <span class="text-slate-300 text-sm font-bold">›</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          <!-- 4. Bottom Floating Input Bar -->
          <div class="sticky bottom-4 bg-white rounded-2xl border border-slate-200 shadow-md p-3.5 z-20 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <textarea id="chat-input" 
                      rows="2" 
                      placeholder="Tell me what you want to do..." 
                      class="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                      onkeydown="handleInputKeyDown(event)"></textarea>
            
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
              <!-- Left Tool Pills -->
              <div class="flex items-center gap-2 flex-wrap">
                <button type="button" onclick="attachFileSim()" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition" title="Attach file or context">
                  +
                </button>

                <div class="relative">
                  <button type="button" onclick="toggleDropdown('deep-research-menu')" class="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition">
                    <span>Deep Research</span>
                    <span class="text-[10px] text-slate-400">▼</span>
                  </button>
                  <div id="deep-research-menu" class="hidden absolute left-0 bottom-full mb-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 text-xs text-slate-700 z-30">
                    <button type="button" onclick="selectModel('Deep Research v3')" class="w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 font-semibold text-blue-600">Deep Research v3</button>
                    <button type="button" onclick="selectModel('Fast Agent Mode')" class="w-full text-left px-2 py-1.5 rounded hover:bg-slate-50">Fast Agent Mode</button>
                    <button type="button" onclick="selectModel('Comprehensive Audit')" class="w-full text-left px-2 py-1.5 rounded hover:bg-slate-50">Comprehensive Audit</button>
                  </div>
                </div>

                <button type="button" id="web-toggle-btn" onclick="toggleWebSearch()" class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition">
                  <span>🌐</span>
                  <span>Web</span>
                </button>

                <button type="button" onclick="triggerMicSim()" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition" title="Voice Input">
                  🎙
                </button>
              </div>

              <!-- Right Actions: Mic & Send Arrow Button -->
              <div class="flex items-center gap-2">
                <button type="button" onclick="triggerMicSim()" class="text-slate-400 hover:text-slate-600 p-1.5 text-sm transition" title="Microphone">
                  🎤
                </button>
                <button id="send-btn" type="button" onclick="sendUserMessage()" class="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition cursor-pointer hover:scale-105 active:scale-95" title="Send message">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          </div>

        </div>


        <!-- ======================================================== -->
        <!-- RIGHT COLUMN: Execution Plan & Resource Cards Panel      -->
        <!-- ======================================================== -->
        <div class="lg:col-span-5 space-y-4">
          
          <!-- Top Tabs Header (Plan | Tools | Sources | Results) -->
          <div class="flex items-center border-b border-slate-200">
            <button type="button" onclick="switchRightTab('plan')" id="tab-btn-plan" class="tab-btn font-bold text-xs text-blue-600 border-b-2 border-blue-600 pb-2.5 px-3 transition cursor-pointer">
              Plan
            </button>
            <button type="button" onclick="switchRightTab('tools')" id="tab-btn-tools" class="tab-btn font-medium text-xs text-slate-500 hover:text-slate-800 pb-2.5 px-3 transition cursor-pointer">
              Tools
            </button>
            <button type="button" onclick="switchRightTab('sources')" id="tab-btn-sources" class="tab-btn font-medium text-xs text-slate-500 hover:text-slate-800 pb-2.5 px-3 transition cursor-pointer">
              Sources
            </button>
            <button type="button" onclick="switchRightTab('results')" id="tab-btn-results" class="tab-btn font-medium text-xs text-slate-500 hover:text-slate-800 pb-2.5 px-3 transition cursor-pointer">
              Results
            </button>
          </div>

          <!-- TAB PANEL 1: Plan (Default Visible) -->
          <div id="tab-panel-plan" class="space-y-4">
            
            <!-- Card 1: Execution Plan Widget -->
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                    📑
                  </div>
                  <h3 class="text-sm font-bold text-slate-900">Execution Plan</h3>
                </div>
                <a href="/missions" class="text-xs font-semibold text-blue-600 hover:underline">View Details</a>
              </div>

              <!-- 5 Numbered Steps -->
              <div class="space-y-3">
                
                <div id="plan-panel-step-1" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="plan-panel-icon-1" class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs ring-2 ring-blue-100">
                      1
                    </div>
                    <span class="text-slate-900 font-medium truncate">Check calendar and meeting details</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="plan-panel-action-1" 
                            onclick="event.stopPropagation(); window.advancePlanPanelInteractive(1)"
                            class="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer animate-pulse shadow-xs">
                      ✓ Mark Complete
                    </button>
                    <span id="plan-panel-badge-1" class="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">
                      In Progress
                    </span>
                  </div>
                </div>

                <div id="plan-panel-step-2" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="plan-panel-icon-2" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </div>
                    <span class="text-slate-700 font-medium truncate">Gather and analyze relevant documents</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="plan-panel-action-2" 
                            onclick="event.stopPropagation(); window.advancePlanPanelInteractive(2)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="plan-panel-badge-2" class="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Pending
                    </span>
                  </div>
                </div>

                <div id="plan-panel-step-3" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="plan-panel-icon-3" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </div>
                    <span class="text-slate-700 font-medium truncate">Identify missing preparation items</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="plan-panel-action-3" 
                            onclick="event.stopPropagation(); window.advancePlanPanelInteractive(3)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="plan-panel-badge-3" class="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Pending
                    </span>
                  </div>
                </div>

                <div id="plan-panel-step-4" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="plan-panel-icon-4" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      4
                    </div>
                    <span class="text-slate-900 font-medium truncate">Create prioritized checklist</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="plan-panel-action-4" 
                            onclick="event.stopPropagation(); window.advancePlanPanelInteractive(4)"
                            disabled
                            class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60">
                      Verify
                    </button>
                    <span id="plan-panel-badge-4" class="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Pending
                    </span>
                  </div>
                </div>

                <div id="plan-panel-step-5" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3 min-w-0">
                    <div id="plan-panel-icon-5" class="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      5
                    </div>
                    <span class="text-slate-500 font-medium truncate">Set reminders</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" 
                            id="plan-panel-action-5" 
                            onclick="event.stopPropagation(); window.advancePlanPanelInteractive(5)"
                            disabled
                            class="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60">
                      Authorize
                    </button>
                    <span id="plan-panel-badge-5" class="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Requires Approval
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Card 2: Key Information -->
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                    📅
                  </div>
                  <h3 class="text-sm font-bold text-slate-900">Key Information</h3>
                </div>
                <button onclick="showInfoToast('Calendar event sync confirmed')" class="text-xs font-semibold text-blue-600 hover:underline">View All</button>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-sm font-bold text-slate-900">Product Roadmap Discussion</h4>
                  <div class="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span>Tomorrow, 10:00 AM – 11:00 AM</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>📍 Google Meet</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-2.5 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    Discuss Q4 product roadmap, feature prioritization, and alignment with stakeholder goals.
                  </p>
                </div>
              </div>
            </div>

            <!-- Card 3: Documents Found (5) -->
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
              <div class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">
                    📄
                  </div>
                  <h3 class="text-sm font-bold text-slate-900">Documents Found (5)</h3>
                </div>
                <a href="/knowledge" class="text-xs font-semibold text-blue-600 hover:underline">View All</a>
              </div>

              <div class="space-y-3">
                
                <!-- Document 1 -->
                <div class="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer" onclick="openDocPreview('Q4_Roadmap.pdf')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      PDF
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-900 block truncate">Q4_Roadmap.pdf</span>
                      <span class="text-[11px] text-slate-400">PDF • 12 pages</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    Relevance: High
                  </span>
                </div>

                <!-- Document 2 -->
                <div class="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer" onclick="openDocPreview('Competitor_Analysis.docx')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      DOC
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-900 block truncate">Competitor_Analysis.docx</span>
                      <span class="text-[11px] text-slate-400">DOCX • 8 pages</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    Relevance: High
                  </span>
                </div>

                <!-- Document 3 -->
                <div class="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer" onclick="openDocPreview('Market_Trends_2026.pdf')">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      PDF
                    </div>
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-900 block truncate">Market_Trends_2026.pdf</span>
                      <span class="text-[11px] text-slate-400">PDF • 15 pages</span>
                    </div>
                  </div>
                  <span class="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                    Relevance: Medium
                  </span>
                </div>

              </div>
            </div>

            <!-- Card 4: Quick Actions Row -->
            <div class="p-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                <span class="text-amber-500">⚡</span>
                <span>Quick Actions</span>
              </div>
              <div class="grid grid-cols-3 gap-2.5">
                <button type="button" onclick="triggerQuickAction('reminder')" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                  <span>📅</span>
                  <span>Create Reminder</span>
                </button>
                <button type="button" onclick="triggerQuickAction('email')" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                  <span>✉️</span>
                  <span>Email Checklist</span>
                </button>
                <button type="button" onclick="triggerQuickAction('notion')" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer">
                  <span>📓</span>
                  <span>Save to Notion</span>
                </button>
              </div>
            </div>

          </div>

          <!-- TAB PANEL 2: Tools (Hidden by default) -->
          <div id="tab-panel-tools" class="hidden space-y-3">
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <h3 class="text-sm font-bold text-slate-900">Connected Tools for this Mission</h3>
              <div class="space-y-2 text-xs">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900">calendar_read_events</span>
                    <p class="text-slate-500 text-[11px]">Read calendar events and meeting schedules</p>
                  </div>
                  <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Executed</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900">search_knowledge</span>
                    <p class="text-slate-500 text-[11px]">Semantic search over PDFs and corporate roadmaps</p>
                  </div>
                  <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Executed</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900">create_task</span>
                    <p class="text-slate-500 text-[11px]">Compile prioritized preparation action items</p>
                  </div>
                  <span class="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold animate-pulse">Running</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900">calendar_create_reminder</span>
                    <p class="text-slate-500 text-[11px]">Schedule calendar notification alarm</p>
                  </div>
                  <span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Pending Approval</span>
                </div>
              </div>
              <a href="/tools" class="inline-block text-xs font-bold text-blue-600 hover:underline pt-2">View all 8 MCP tools →</a>
            </div>
          </div>

          <!-- TAB PANEL 3: Sources (Hidden by default) -->
          <div id="tab-panel-sources" class="hidden space-y-3">
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <h3 class="text-sm font-bold text-slate-900">Retrieved Context & Ground Truth Sources</h3>
              <div class="space-y-2.5 text-xs text-slate-700">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="font-bold text-slate-900">1. Calendar API (Google / Outlook Sync)</div>
                  <p class="text-slate-500 text-[11px] mt-0.5">Matched event ID <code class="bg-slate-200 px-1 rounded">evt-roadmap-disc</code> for tomorrow 10:00 AM.</p>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="font-bold text-slate-900">2. Q4_Roadmap.pdf (Internal Knowledge Store)</div>
                  <p class="text-slate-500 text-[11px] mt-0.5">Vector similarity match 0.94 against "Roadmap Discussion".</p>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="font-bold text-slate-900">3. Competitor_Analysis.docx</div>
                  <p class="text-slate-500 text-[11px] mt-0.5">Extracted key competitor release schedules and feature matrix.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 4: Results (Hidden by default) -->
          <div id="tab-panel-results" class="hidden space-y-3">
            <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">Generated Meeting Deliverables</h3>
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Ready</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span class="font-bold text-slate-900 block">Meeting Briefing Summary</span>
                <p class="text-slate-600 text-[11px] leading-relaxed">
                  Focus on Q1 milestones, engineer headcount requests, and budget contingency planning.
                </p>
              </div>
              <a href="/missions" class="block text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
                Open Full Mission DAG Workspace →
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- Quick Toast Notification -->
    <div id="action-toast" class="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium transform translate-y-20 opacity-0 transition-all duration-300 z-50 flex items-center gap-2">
      <span id="toast-icon">✓</span>
      <span id="toast-msg">Action completed</span>
    </div>

    <script>
      // Accordion toggle for Execution Progress
      function toggleExecAccordion() {
        const content = document.getElementById('exec-checklist-content');
        const chevron = document.getElementById('exec-chevron');
        if (!content) return;
        if (content.classList.contains('hidden')) {
          content.classList.remove('hidden');
          if (chevron) chevron.textContent = '▲';
        } else {
          content.classList.add('hidden');
          if (chevron) chevron.textContent = '▼';
        }
      }

      // Toggle Task row state
      // Toggle Task row state with expandable telemetry detail
      function toggleTaskItem(el) {
        let detail = el.nextElementSibling;
        if (detail && detail.classList.contains('step-telemetry-box')) {
          detail.remove();
          return;
        }
        
        const taskTitle = el.querySelector('span.text-xs')?.textContent || 'Step Details';
        const isCompleted = el.querySelector('.bg-emerald-600') !== null;
        const isInProgress = el.querySelector('.bg-blue-600') !== null;
        const match = el.id ? el.id.match(/exec-step-row-(\d+)/) : null;
        const stepNum = match ? parseInt(match[1], 10) : 1;
        
        detail = document.createElement('div');
        detail.className = 'step-telemetry-box bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 my-1.5 ml-8 text-[11px] text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-inner';
        detail.innerHTML = \`
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span class="font-bold text-slate-900 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full \` + (isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500 animate-ping' : 'bg-slate-400') + \`"></span>
              MCP Protocol Telemetry
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded \` + (isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') + \` font-semibold">
              \` + (isCompleted ? 'Verified & Persisted' : 'Running Streamable HTTP') + \`
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-slate-600">
            <div><strong class="text-slate-800">Transport:</strong> Streamable HTTP (SSE)</div>
            <div><strong class="text-slate-800">Security Gate:</strong> SHA-256 Validated</div>
          </div>
          <div class="bg-white p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-800 overflow-x-auto">
            {"status":"\` + (isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'pending') + \`","task":"\` + taskTitle.substring(0, 35) + \`...","verification":true}
          </div>
          \` + (isInProgress ? \`
          <div class="pt-1 flex justify-end">
            <button type="button" onclick="event.stopPropagation(); window.advanceStepInteractive(\` + stepNum + \`)" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer">
              <span>✓</span><span>Complete Step \` + stepNum + \` & Advance →</span>
            </button>
          </div>\` : '') + \`
        \`;
        el.parentNode.insertBefore(detail, el.nextSibling);
        window.showToast ? window.showToast('Inspecting: ' + taskTitle.substring(0, 30) + '...', 'info', '🔍') : showInfoToast('Inspecting step logs');
      }

      function advanceStepInteractive(stepNum) {
        if (stepNum <= 7) {
          updateStepState(stepNum, 'completed', '1.2s');
          if (stepNum === 7) {
            renderCompletionCard(activeMissionId);
            const badge = document.getElementById('exec-counter-badge');
            if (badge) badge.textContent = '7/7 steps completed';
            const spinner = document.getElementById('exec-spinner');
            if (spinner) {
              spinner.className = 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
              spinner.textContent = '✓';
            }
            const header = document.getElementById('exec-status-header');
            if (header) header.textContent = 'Completed all steps';
          } else {
            const nextStep = stepNum + 1;
            if (nextStep === 7) {
              updateStepState(7, 'awaiting_approval');
              const header = document.getElementById('exec-status-header');
              if (header) header.textContent = 'Paused: Human authorization required';
              const spinner = document.getElementById('exec-spinner');
              if (spinner) {
                spinner.className = 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold';
                spinner.textContent = '⚠';
              }
              if (!document.getElementById('human-approval-card')) {
                renderHumanApprovalCard({
                  id: 'appr-plan-07',
                  action_type: 'calendar_create_reminder',
                  canonical_fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                });
              }
            } else {
              updateStepState(nextStep, 'in_progress');
              const header = document.getElementById('exec-status-header');
              const titleEl = document.getElementById('exec-step-title-' + nextStep);
              if (header) header.textContent = 'Executing: ' + (titleEl ? titleEl.textContent : ('Step ' + nextStep + ' of 7...'));
            }
            const badge = document.getElementById('exec-counter-badge');
            if (badge) badge.textContent = stepNum + '/7 steps completed';
          }
          const row = document.getElementById('exec-step-row-' + stepNum);
          if (row && row.nextElementSibling && row.nextElementSibling.classList.contains('step-telemetry-box')) {
            row.nextElementSibling.remove();
          }
        }
      }
      window.advanceStepInteractive = advanceStepInteractive;

      function advancePlanPanelInteractive(panelIdx) {
        if (panelIdx === 1) {
          advanceStepInteractive(1);
        } else if (panelIdx === 2) {
          updateStepState(2, 'completed', '0.9s');
          updateStepState(3, 'completed', '1.1s');
          advanceStepInteractive(4);
        } else if (panelIdx === 3) {
          advanceStepInteractive(5);
        } else if (panelIdx === 4) {
          advanceStepInteractive(6);
        } else if (panelIdx === 5) {
          const authBtn = document.getElementById('btn-authorize-exec');
          if (authBtn) {
            resolveApproval('approved');
          } else {
            advanceStepInteractive(7);
          }
        }
      }
      window.advancePlanPanelInteractive = advancePlanPanelInteractive;

      // Switch Right Side Panel Tabs
      function switchRightTab(tabKey) {
        const tabs = ['plan', 'tools', 'sources', 'results'];
        tabs.forEach(t => {
          const btn = document.getElementById('tab-btn-' + t);
          const panel = document.getElementById('tab-panel-' + t);
          if (btn) {
            if (t === tabKey) {
              btn.className = 'tab-btn font-bold text-xs text-blue-600 border-b-2 border-blue-600 pb-2.5 px-3 transition cursor-pointer';
            } else {
              btn.className = 'tab-btn font-medium text-xs text-slate-500 hover:text-slate-800 pb-2.5 px-3 transition cursor-pointer';
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

      // Dropdown toggle
      function toggleDropdown(id) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden');
      }

      function selectModel(name) {
        window.showToast ? window.showToast('Selected model: ' + name, 'info', '🤖') : showInfoToast('Selected model: ' + name);
        toggleDropdown('deep-research-menu');
      }

      let webEnabled = true;
      function toggleWebSearch() {
        webEnabled = !webEnabled;
        const btn = document.getElementById('web-toggle-btn');
        if (btn) {
          if (webEnabled) {
            btn.className = 'inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full transition';
            window.showToast ? window.showToast('Web search capability enabled', 'success', '🌐') : showInfoToast('Web search enabled');
          } else {
            btn.className = 'inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition';
            window.showToast ? window.showToast('Web search capability disabled', 'info', '🌐') : showInfoToast('Web search disabled');
          }
        }
      }

      function triggerMicSim() {
        window.showToast ? window.showToast('🎙️ Voice input listening... Speak naturally to Alexa+', 'info', '🎙️') : showInfoToast('🎙️ Microphone listening for voice input...');
      }

      function attachFileSim() {
        window.showToast ? window.showToast('📎 Opening file picker for contextual documents (.pdf, .docx)', 'info', '📎') : showInfoToast('📎 Select document to attach for contextual analysis');
      }

      function openDocPreview(filename) {
        window.showToast ? window.showToast('📄 Previewing extracted content from ' + filename, 'info', '📄') : showInfoToast('📄 Opening preview for ' + filename);
      }

      function triggerQuickAction(action) {
        if (action === 'reminder') {
          const btn = event?.currentTarget;
          if (btn) {
            btn.classList.add('border-emerald-300', 'bg-emerald-50', 'text-emerald-700');
            btn.innerHTML = '<span>✓</span><span>Reminder Set (9:45 AM)</span>';
          }
          window.showToast ? window.showToast('📅 Meeting reminder created for tomorrow at 9:45 AM! Added to Google Calendar.', 'success', '📅') : showInfoToast('📅 Meeting reminder created for tomorrow at 9:45 AM!');
        } else if (action === 'email') {
          const btn = event?.currentTarget;
          if (btn) {
            btn.classList.add('border-blue-300', 'bg-blue-50', 'text-blue-700');
            btn.innerHTML = '<span>✓</span><span>Brief Emailed</span>';
          }
          window.showToast ? window.showToast('✉️ Preparation checklist draft generated and sent to your email!', 'success', '✉️') : showInfoToast('✉️ Checklist email draft generated and sent to your inbox!');
        } else if (action === 'notion') {
          const btn = event?.currentTarget;
          if (btn) {
            btn.classList.add('border-purple-300', 'bg-purple-50', 'text-purple-700');
            btn.innerHTML = '<span>✓</span><span>Saved to Notion</span>';
          }
          window.showToast ? window.showToast('📓 Synchronized executive briefing to your Notion workspace!', 'success', '📓') : showInfoToast('📓 Briefing exported to your Notion workspace!');
        }
      }

      function showInfoToast(msg) {
        const toast = document.getElementById('action-toast');
        const toastMsg = document.getElementById('toast-msg');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => {
          toast.classList.remove('translate-y-0', 'opacity-100');
          toast.classList.add('translate-y-20', 'opacity-0');
        }, 2500);
      }

      // State tracking for live mission and approval
      let activeMissionId = null;
      let activeApprovalId = null;
      let activeFingerprint = null;
      let activeApprovalStepNum = 7;
      let missionPollTimer = null;
      let missionStartTime = null;

      const PRESET_CONFIG = {
        'Plan my day': [
          'Checking calendar and user context...',
          'Searching relevant roadmap documents...',
          'Retrieving meeting roadmap brief...',
          'Analyzing roadmap content & preparation gaps...',
          'Evaluating schedule & conflict alignment...',
          'Creating prioritized preparation checklist...',
          'Scheduling meeting reminder (Requires Approval)'
        ],
        'Analyze a document': [
          'Retrieving workspace and document context...',
          'Searching knowledge repository for target report...',
          'Retrieving complete document text & structure...',
          'Extracting key insights, findings & risks...',
          'Assessing schedule constraints & alignment...',
          'Synthesizing executive action items...',
          'Proposing document briefing notification (Requires Approval)'
        ],
        'Create a checklist': [
          'Retrieving project parameters & objectives...',
          'Searching repository for launch blueprints...',
          'Retrieving launch roadmap & specifications...',
          'Analyzing milestone deliverables & risks...',
          'Assessing timeline & dependency alignment...',
          'Creating step-by-step launch checklist...',
          'Proposing email checklist dispatch (Requires Approval)'
        ],
        'Find information': [
          'Configuring search scope and preferences...',
          'Searching knowledge base across indexed documents...',
          'Retrieving referenced document sections...',
          'Synthesizing answers and source citations...',
          'Evaluating cross-source consistency...',
          'Compiling structured information digest...',
          'Proposing digest notification alert (Requires Approval)'
        ],
        'Analyze data': [
          'Loading analytics preferences & baseline context...',
          'Searching data store for market trends & metrics...',
          'Retrieving structured metrics and benchmarks...',
          'Analyzing KPI trends, growth & variances...',
          'Assessing metric alignment & anomalies...',
          'Generating comprehensive data report tasks...',
          'Proposing report export & distribution (Requires Approval)'
        ],
        'Use my tools': [
          'Discovering integrated tools & connected services...',
          'Searching connected Drive & Notion repositories...',
          'Retrieving documents across active integrations...',
          'Cross-analyzing multi-source notes & briefs...',
          'Verifying tool workflows & schedule alignment...',
          'Synthesizing cross-tool action summary...',
          'Proposing workspace synchronization (Requires Approval)'
        ]
      };

      let currentAnimatedStep = 0;
      let isQueueRunning = false;
      let queueTimer = null;
      let latestPendingApproval = null;
      let latestMissionStatus = null;
      let targetCompletedSteps = 0;
      let taskDataCache = [];

      function setPlanPanelItemState(panelIdx, status) {
        const icon = document.getElementById('plan-panel-icon-' + panelIdx);
        const badge = document.getElementById('plan-panel-badge-' + panelIdx);
        const actionBtn = document.getElementById('plan-panel-action-' + panelIdx);
        if (!icon || !badge) return;

        if (status === 'completed') {
          icon.className = 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-xs';
          icon.textContent = '✓';
          badge.className = 'text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex-shrink-0';
          badge.textContent = '✓ Verified';
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default opacity-90';
            actionBtn.textContent = '✓ Verified';
            actionBtn.disabled = true;
          }
        } else if (status === 'in_progress') {
          icon.className = 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs ring-2 ring-blue-100';
          icon.textContent = '+';
          badge.className = 'text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse flex-shrink-0';
          badge.textContent = 'In Progress';
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer animate-pulse shadow-xs';
            actionBtn.textContent = '✓ Mark Complete';
            actionBtn.disabled = false;
          }
        } else if (status === 'awaiting_approval' || status === 'requires_approval') {
          icon.className = 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-amber-100';
          icon.textContent = '⚠';
          badge.className = 'text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0';
          badge.textContent = 'Requires Approval';
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer shadow-xs';
            actionBtn.textContent = 'Authorize';
            actionBtn.disabled = false;
          }
        } else if (status === 'cancelled' || status === 'rejected') {
          icon.className = 'w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0';
          icon.textContent = '✕';
          badge.className = 'text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex-shrink-0';
          badge.textContent = 'Rejected';
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-medium px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 cursor-default';
            actionBtn.textContent = 'Rejected';
            actionBtn.disabled = true;
          }
        } else {
          // pending
          icon.className = 'w-5 h-5 rounded-full border-2 border-slate-300 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0';
          icon.textContent = String(panelIdx);
          if (panelIdx === 5) {
            badge.className = 'text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0';
            badge.textContent = 'Requires Approval';
            if (actionBtn) {
              actionBtn.className = 'text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60';
              actionBtn.textContent = 'Authorize';
              actionBtn.disabled = true;
            }
          } else {
            badge.className = 'text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0';
            badge.textContent = 'Pending';
            if (actionBtn) {
              actionBtn.className = 'text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60';
              actionBtn.textContent = 'Verify';
              actionBtn.disabled = true;
            }
          }
        }
      }

      function updatePlanPanel(dagStepNum, status) {
        if (dagStepNum === 1) {
          setPlanPanelItemState(1, status);
          if (status === 'completed') {
            setPlanPanelItemState(2, 'in_progress');
          }
        } else if (dagStepNum >= 2 && dagStepNum <= 4) {
          if (status === 'in_progress') {
            setPlanPanelItemState(2, 'in_progress');
          } else if (status === 'completed' && dagStepNum === 4) {
            setPlanPanelItemState(2, 'completed');
            setPlanPanelItemState(3, 'in_progress');
          }
        } else if (dagStepNum === 5) {
          setPlanPanelItemState(3, status);
          if (status === 'completed') {
            setPlanPanelItemState(4, 'in_progress');
          }
        } else if (dagStepNum === 6) {
          setPlanPanelItemState(4, status);
          if (status === 'completed') {
            setPlanPanelItemState(5, 'awaiting_approval');
          }
        } else if (dagStepNum === 7) {
          setPlanPanelItemState(5, status);
        }
      }

      function resetStepperUI() {
        activeApprovalId = null;
        activeFingerprint = null;
        activeApprovalStepNum = 7;
        currentAnimatedStep = 0;
        isQueueRunning = false;
        if (queueTimer) {
          clearTimeout(queueTimer);
          queueTimer = null;
        }
        taskDataCache = [];
        latestPendingApproval = null;
        latestMissionStatus = null;
        targetCompletedSteps = 0;
        if (missionPollTimer) {
          clearInterval(missionPollTimer);
          missionPollTimer = null;
        }

        // Reset Header
        const spinner = document.getElementById('exec-spinner');
        if (spinner) {
          spinner.className = 'w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex items-center justify-center';
          spinner.textContent = '';
        }
        const headerText = document.getElementById('exec-status-header');
        if (headerText) headerText.textContent = 'Executing: Check calendar and meeting details...';
        const counterBadge = document.getElementById('exec-counter-badge');
        if (counterBadge) counterBadge.textContent = '0/7 steps completed';

        // Reset Checklist Steps 1 to 7: Step 1 active, 2-7 pending
        updateStepState(1, 'in_progress');
        for (let i = 2; i <= 7; i++) {
          updateStepState(i, 'pending');
        }

        // Reset Plan Panel Steps 1 to 5: Step 1 active, 2-5 pending
        setPlanPanelItemState(1, 'in_progress');
        for (let i = 2; i <= 5; i++) {
          setPlanPanelItemState(i, 'pending');
        }

        // Remove old approval or completed messages
        const oldApproval = document.getElementById('human-approval-card');
        if (oldApproval) oldApproval.remove();
        const oldApproved = document.getElementById('approval-success-msg');
        if (oldApproved) oldApproved.remove();
        const oldRejected = document.getElementById('approval-rejected-msg');
        if (oldRejected) oldRejected.remove();
        const oldCompletion = document.getElementById('mission-completed-card');
        if (oldCompletion) oldCompletion.remove();
      }

      function updateStepState(stepNum, status, durationStr) {
        const row = document.getElementById('exec-step-row-' + stepNum);
        const icon = document.getElementById('exec-step-icon-' + stepNum);
        const badge = document.getElementById('exec-step-badge-' + stepNum);
        const actionBtn = document.getElementById('exec-step-action-' + stepNum);

        updatePlanPanel(stepNum, status);

        if (status === 'completed') {
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-xs';
            icon.textContent = '✓';
          }
          if (badge) {
            badge.className = 'inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex-shrink-0';
            badge.textContent = '✓ Verified';
          }
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 cursor-default opacity-90';
            actionBtn.textContent = '✓ Verified';
            actionBtn.disabled = true;
          }
        } else if (status === 'in_progress') {
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg bg-blue-50/50 border border-blue-100/80 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs animate-pulse ring-2 ring-blue-200';
            icon.textContent = '+';
          }
          if (badge) {
            badge.className = 'inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full animate-pulse';
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>In progress';
          }
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer animate-pulse shadow-xs';
            actionBtn.textContent = '✓ Mark Complete';
            actionBtn.disabled = false;
          }
        } else if (status === 'awaiting_approval') {
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg bg-amber-50/60 border border-amber-200/80 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-amber-200';
            icon.textContent = '⚠';
          }
          if (badge) {
            badge.className = 'inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full';
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Awaiting Approval';
          }
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded border border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer shadow-xs';
            actionBtn.textContent = 'Authorize';
            actionBtn.disabled = false;
          }
        } else if (status === 'requires_approval') {
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full border-2 border-amber-300 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0';
            icon.textContent = String(stepNum);
          }
          if (badge) {
            badge.className = 'text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full';
            badge.textContent = 'Requires Approval';
          }
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60';
            actionBtn.textContent = 'Authorize';
            actionBtn.disabled = true;
          }
        } else if (status === 'cancelled' || status === 'rejected') {
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg bg-rose-50/50 border border-rose-100/80 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0';
            icon.textContent = '✕';
          }
          if (badge) {
            badge.className = 'inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full';
            badge.textContent = 'Rejected';
          }
          if (actionBtn) {
            actionBtn.className = 'text-[10px] font-medium px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 cursor-default';
            actionBtn.textContent = 'Rejected';
            actionBtn.disabled = true;
          }
        } else {
          // pending
          if (row) row.className = 'flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer';
          if (icon) {
            icon.className = 'w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0';
            icon.textContent = String(stepNum);
          }
          if (badge) {
            if (stepNum === 7) {
              badge.className = 'text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full';
              badge.textContent = 'Requires Approval';
            } else {
              badge.className = 'text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full';
              badge.textContent = 'Pending';
            }
          }
          if (actionBtn) {
            if (stepNum === 7) {
              actionBtn.className = 'text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 cursor-not-allowed opacity-60';
              actionBtn.textContent = 'Authorize';
            } else {
              actionBtn.className = 'text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed opacity-60';
              actionBtn.textContent = 'Verify';
            }
            actionBtn.disabled = true;
          }
        }
      }

      function renderHumanApprovalCard(approval) {
        if (!approval) return;
        activeApprovalId = approval.id;
        activeFingerprint = approval.canonical_fingerprint || approval.parameters_fingerprint || approval.canonicalFingerprint || '';

        let approvalStep = 7;
        if (approval.task_id) {
          const match = approval.task_id.match(/-(\d+)$/);
          if (match) approvalStep = parseInt(match[1], 10);
        }
        activeApprovalStepNum = approvalStep;

        let card = document.getElementById('human-approval-card');
        if (card) return;

        const container = document.getElementById('chat-stream-container');
        if (!container) return;

        card = document.createElement('div');
        card.id = 'human-approval-card';
        card.className = 'bg-amber-50/90 border-2 border-amber-300/90 rounded-2xl p-5 ml-12 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300';
        const actionName = approval.action_type || 'calendar_create_reminder';
        const fp = activeFingerprint;
        card.innerHTML = [
          '<div class="flex items-start justify-between gap-4">',
          '  <div class="flex items-start gap-3">',
          '    <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">⚠️</div>',
          '    <div class="min-w-0">',
          '      <div class="flex items-center gap-2">',
          '        <h4 class="text-xs font-bold text-amber-950">Consequential Action Requires Your Authorization</h4>',
          '        <span class="text-[10px] font-mono px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded font-semibold">Human-in-the-Loop</span>',
          '      </div>',
          '      <p class="text-xs text-amber-900 mt-1 leading-relaxed">',
          '        Alexa+ is requesting permission to execute: <strong class="font-mono text-[11px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 border border-amber-300">' + actionName + '</strong>.',
          '        This action will perform external notifications, calendar modifications, or deliverable exports.',
          '      </p>',
          '      <div class="mt-2.5 flex items-center gap-2 text-[11px] text-amber-800 font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200">',
          '        <span class="font-bold text-amber-950">Fingerprint:</span>',
          '        <span class="truncate max-w-[280px] font-mono select-all" title="' + fp + '">' + fp + '</span>',
          '      </div>',
          '    </div>',
          '  </div>',
          '</div>',
          '<div class="mt-4 pt-3 border-t border-amber-200/90 flex items-center justify-end gap-2.5">',
          '  <button type="button" id="btn-reject-exec" onclick="window.resolveApproval(&quot;rejected&quot;)" class="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"><span>✕</span><span>Reject Action</span></button>',
          '  <button type="button" id="btn-authorize-exec" onclick="window.resolveApproval(&quot;approved&quot;)" class="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"><span>✓</span><span>Authorize & Execute</span></button>',
          '</div>'
        ].join('');

        container.appendChild(card);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        const headerText = document.getElementById('exec-status-header');
        if (headerText) headerText.textContent = 'Paused: Human authorization required';
        updateStepState(approvalStep, 'awaiting_approval');
      }

      async function resolveApproval(decision) {
        if (!activeApprovalId) return;
        const btnAuth = document.getElementById('btn-authorize-exec');
        const btnReject = document.getElementById('btn-reject-exec');

        if (btnAuth) btnAuth.disabled = true;
        if (btnReject) btnReject.disabled = true;

        if (decision === 'rejected') {
          if (btnReject) {
            btnReject.innerHTML = '<span class="inline-block w-3 h-3 rounded-full border-2 border-rose-600 border-t-transparent animate-spin mr-1"></span> Rejecting...';
          }
        } else {
          if (btnAuth) {
            btnAuth.innerHTML = '<span class="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span> Authorizing...';
          }
        }

        try {
          const res = await fetch('/api/approvals/' + activeApprovalId + '/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decision: decision,
              expectedFingerprint: activeFingerprint
            })
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            const card = document.getElementById('human-approval-card');
            const stepToResume = activeApprovalStepNum || 7;

            if (decision === 'approved') {
              if (card) {
                card.outerHTML = [
                  '<div id="approval-success-msg" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 ml-12 text-xs text-emerald-950 flex items-center gap-3">',
                  '  <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✓</div>',
                  '  <div class="flex-1">',
                  '    <strong>Action Authorized by User</strong>',
                  '    <p class="text-slate-600 text-[11px] mt-0.5">Cryptographic signature verified. Autonomous execution finalized.</p>',
                  '  </div>',
                  '</div>'
                ].join('');
              }
              advanceStepInteractive(stepToResume);
              window.showToast ? window.showToast('Action authorized! Workflow completed.', 'success', '✓') : showInfoToast('Action authorized');
            } else {
              // Action rejected cleanly
              if (card) {
                card.outerHTML = [
                  '<div id="approval-rejected-msg" class="bg-rose-50 border border-rose-200 rounded-2xl p-4 ml-12 text-xs text-rose-950 flex items-center gap-3">',
                  '  <div class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">✕</div>',
                  '  <div class="flex-1">',
                  '    <strong class="text-rose-900 font-semibold">Action Rejected by User</strong>',
                  '    <p class="text-slate-600 text-[11px] mt-0.5">The consequential action was declined. No calendar modifications or external notifications were performed.</p>',
                  '    <div class="mt-2.5 flex items-center gap-2">',
                  '      <a href="/results" class="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-[11px] transition">View Generated Results →</a>',
                  '      <a href="/missions/' + (activeMissionId || '') + '" class="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium rounded-lg text-[11px] transition">Inspect Mission</a>',
                  '    </div>',
                  '  </div>',
                  '</div>'
                ].join('');
              }
              updateStepState(stepToResume, 'cancelled');
              const headerText = document.getElementById('exec-status-header');
              if (headerText) headerText.textContent = 'Mission ended: Action rejected by user';
              const spinner = document.getElementById('exec-spinner');
              if (spinner) {
                spinner.className = 'w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold';
                spinner.textContent = '✕';
              }
              if (missionPollTimer) clearInterval(missionPollTimer);
              window.showToast ? window.showToast('Action rejected by user.', 'info', '✕') : showInfoToast('Action rejected');
            }
          } else {
            const errMsg = data.error || ('Failed to ' + decision + ' action');
            alert(errMsg);
            if (btnAuth) {
              btnAuth.disabled = false;
              btnAuth.innerHTML = '<span>✓</span><span>Authorize & Execute</span>';
            }
            if (btnReject) {
              btnReject.disabled = false;
              btnReject.innerHTML = '<span>✕</span><span>Reject Action</span>';
            }
          }
        } catch (err) {
          alert('Error: ' + (err.message || String(err)));
          if (btnAuth) {
            btnAuth.disabled = false;
            btnAuth.innerHTML = '<span>✓</span><span>Authorize & Execute</span>';
          }
          if (btnReject) {
            btnReject.disabled = false;
            btnReject.innerHTML = '<span>✕</span><span>Reject Action</span>';
          }
        }
      }
      window.resolveApproval = resolveApproval;

      function renderCompletionCard(missionId) {
        let completionCard = document.getElementById('mission-completed-card');
        if (completionCard) return;

        const container = document.getElementById('chat-stream-container');
        if (!container) return;

        completionCard = document.createElement('div');
        completionCard.id = 'mission-completed-card';
        completionCard.className = 'flex items-start gap-3.5';
        completionCard.innerHTML = [
          '<div class="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">✓</div>',
          '<div class="flex-1 max-w-2xl bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950">',
          '  <strong>Mission Completed Successfully!</strong>',
          '  <p class="mt-1 text-slate-700">Autonomous workflow has finalized and independently verified all deliverable requirements.</p>',
          '  <div class="mt-2.5 flex items-center gap-2">',
          '    <a href="/results" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition">View Final Results →</a>',
          '    <a href="/missions/' + (missionId || '') + '" class="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-[11px] transition">Inspect DAG Logs</a>',
          '  </div>',
          '</div>'
        ].join('');
        container.appendChild(completionCard);
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        for (let i = 1; i <= 7; i++) {
          updateStepState(i, 'completed');
        }
        for (let i = 1; i <= 5; i++) {
          setPlanPanelItemState(i, 'completed');
        }
        const badge = document.getElementById('exec-counter-badge');
        if (badge) badge.textContent = '7/7 steps completed';
        const spinner = document.getElementById('exec-spinner');
        if (spinner) spinner.className = 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
        if (spinner) spinner.textContent = '✓';
        const header = document.getElementById('exec-status-header');
        if (header) header.textContent = 'Completed all steps';
      }

      function syncMissionData(tasks, missionStatus, pendingApproval) {
        if (!Array.isArray(tasks) || tasks.length === 0) return;

        taskDataCache = tasks;
        latestPendingApproval = pendingApproval;
        latestMissionStatus = missionStatus;

        let completedSteps = 0;
        tasks.forEach((t, idx) => {
          const stepNum = idx + 1;
          if (stepNum > 7) return;
          const titleEl = document.getElementById('exec-step-title-' + stepNum);
          if (titleEl && t.title) {
            titleEl.textContent = t.title;
          }

          // Strictly map live task state from backend
          if (t.status === 'completed') {
            completedSteps++;
            updateStepState(stepNum, 'completed');
            setPlanPanelItemState(stepNum, 'completed');
          } else if (t.status === 'in_progress') {
            updateStepState(stepNum, 'in_progress');
            setPlanPanelItemState(stepNum, 'in_progress');
          } else if (t.status === 'awaiting_approval') {
            updateStepState(stepNum, 'awaiting_approval');
            setPlanPanelItemState(stepNum, 'awaiting_approval');
          } else if (t.status === 'cancelled' || t.status === 'rejected') {
            updateStepState(stepNum, 'cancelled');
          }
        });

        const badge = document.getElementById('exec-counter-badge');
        if (badge && completedSteps > 0) {
          badge.textContent = completedSteps + '/7 steps completed';
        }

        if (pendingApproval && pendingApproval.status === 'pending') {
          activeApprovalId = pendingApproval.id;
          activeFingerprint = pendingApproval.canonical_fingerprint || pendingApproval.parameters_fingerprint || '';
          renderHumanApprovalCard(pendingApproval);
        }

        if (missionStatus === 'COMPLETED' || completedSteps === 7) {
          renderCompletionCard(activeMissionId);
        }
      }

      async function pollMissionState(mId) {
        try {
          const res = await fetch('/api/missions/' + mId + '/state');
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.tasks) {
            syncMissionData(data.tasks, data.mission?.status, data.pendingApproval);
          }
        } catch(e) {}
      }

      function connectMissionSSE(missionId) {
        activeMissionId = missionId;
        resetStepperUI();

        if (missionPollTimer) {
          clearInterval(missionPollTimer);
          missionPollTimer = null;
        }

        const evtSource = new EventSource('/api/missions/' + missionId + '/events');
        evtSource.onmessage = function(e) {
          try {
            const ev = JSON.parse(e.data);
            if (ev.type === 'state_sync' || ev.type === 'task_updated') {
              const tasks = ev.data?.tasks || [];
              syncMissionData(tasks, ev.data?.mission?.status, ev.data?.pendingApproval || null);
            } else if (ev.type === 'approval_required') {
              if (ev.data?.approval) {
                activeApprovalId = ev.data.approval.id;
                activeFingerprint = ev.data.approval.canonical_fingerprint || '';
                renderHumanApprovalCard(ev.data.approval);
              }
            } else if (ev.type === 'state_transition') {
              if (ev.data?.status === 'COMPLETED') {
                renderCompletionCard(activeMissionId);
              } else if (ev.data?.status === 'CANCELLED') {
                const header = document.getElementById('exec-status-header');
                if (header) header.textContent = 'Mission ended: Action rejected by user';
                const spinner = document.getElementById('exec-spinner');
                if (spinner) {
                  spinner.className = 'w-5 h-5 rounded-full bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold';
                  spinner.textContent = '✕';
                }
              }
            }
          } catch(err) {}
        };
      }

      // Enter key handler
      function handleInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendUserMessage();
        }
      }

      // Handle Preset Feature Card Click
      function handlePresetClick(btn) {
        if (!btn) return;
        const goal = btn.getAttribute('data-goal') || '';
        const title = btn.getAttribute('data-title') || '';
        launchPreset(goal, title);
      }
      window.handlePresetClick = handlePresetClick;

      // Preset Launch from Initial Landing Feature Cards
      function launchPreset(goal, title) {
        const landing = document.getElementById('initial-landing-view');
        const execView = document.getElementById('execution-stream-view');
        if (landing) landing.classList.add('hidden');
        if (execView) execView.classList.remove('hidden');

        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.value = goal;

        const userPrompt = document.getElementById('user-prompt-text');
        if (userPrompt) userPrompt.textContent = goal;

        const aiResponse = document.getElementById('ai-response-text');
        if (aiResponse) {
          aiResponse.textContent = "Got it. I'll help you with " + (title || 'your request') + ". I'll analyze your request, formulate the execution plan, call the appropriate tools, and verify all outcomes for you.";
        }

        resetStepperUI();

        // Apply custom step titles for this preset
        if (title && PRESET_CONFIG[title]) {
          const steps = PRESET_CONFIG[title];
          for (let i = 0; i < steps.length; i++) {
            const stepNum = i + 1;
            const titleEl = document.getElementById('exec-step-title-' + stepNum);
            if (titleEl) titleEl.textContent = steps[i];
          }
        }

        updateStepState(1, 'in_progress');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        executeMissionReal(goal);
      }

      function submitLandingPrompt() {
        const landingInput = document.getElementById('landing-prompt-input');
        if (!landingInput) return;
        const text = landingInput.value.trim();
        if (!text) {
          window.showToast ? window.showToast('Please describe what you want to do...', 'info', '💡') : null;
          return;
        }
        launchPreset(text, 'your goal');
      }

      function handleLandingInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitLandingPrompt();
        }
      }

      function togglePillActive(btn, pillName) {
        if (!btn) return;
        const isActive = btn.classList.contains('bg-blue-50');
        if (isActive) {
          btn.className = 'inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition cursor-pointer';
          window.showToast ? window.showToast(pillName + ' deselected', 'info', '⚙️') : null;
        } else {
          btn.className = 'inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 px-3 py-1 rounded-full transition cursor-pointer shadow-xs';
          window.showToast ? window.showToast(pillName + ' enabled for this mission', 'success', '✓') : null;
        }
      }

      function setModel(modelName) {
        const label = document.getElementById('selected-model-label');
        if (label) label.textContent = modelName;
        const menu = document.getElementById('landing-model-menu');
        if (menu) menu.classList.add('hidden');
        window.showToast ? window.showToast('Model switched to ' + modelName, 'info', '🤖') : null;
      }

      async function executeMissionReal(goalText) {
        try {
          const res = await fetch('/api/missions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify({ goal: goalText })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            window.showToast ? window.showToast('Failed to start mission: ' + (errData.error || res.statusText), 'error', '⚠️') : null;
            return;
          }
          const data = await res.json();
          if (data && data.missionId) {
            connectMissionSSE(data.missionId);
          }
        } catch(e) {
          window.showToast ? window.showToast('Network error starting mission', 'error', '⚠️') : null;
        }
      }

      async function sendUserMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const container = document.getElementById('chat-stream-container');
        if (container) {
          const newMsgHtml = document.createElement('div');
          newMsgHtml.className = 'flex items-start gap-3.5';
          newMsgHtml.innerHTML = [
            '<div class="w-9 h-9 rounded-full bg-[#8fa0b5] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">SM</div>',
            '<div class="flex-1 max-w-2xl">',
            '  <div class="bg-[#F0F5FD] border border-[#dbe6f6] rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 leading-relaxed shadow-xs">',
            text,
            '  </div>',
            '  <div class="flex justify-end pr-1 mt-1"><span class="text-[11px] text-slate-400">Just now</span></div>',
            '</div>'
          ].join('');
          container.appendChild(newMsgHtml);
          input.value = '';
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

          setTimeout(() => {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'flex items-start gap-3.5';
            aiMsg.innerHTML = [
              '<div class="w-9 h-9 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden p-1.5">',
              '  <div class="flex flex-col items-center">',
              '    <span class="text-[9px] font-black tracking-tighter text-white leading-none">amazon</span>',
              '    <div class="w-4 h-0.5 bg-[#FF9900] rounded-full mt-0.5"></div>',
              '  </div>',
              '</div>',
              '<div class="flex-1 max-w-2xl">',
              '  <span class="text-xs font-bold text-slate-900 block mb-1.5">Alexa+</span>',
              '  <p class="text-xs text-slate-700 leading-relaxed">I am on it! I have scheduled the autonomous workflow to process your request. You can inspect the execution in real-time in the stepper or under Missions.</p>',
              '  <span class="text-[11px] text-slate-400 mt-1.5 block">Just now</span>',
              '</div>'
            ].join('');
            container.appendChild(aiMsg);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }, 500);
        }

        resetStepperUI();
        updateStepState(1, 'in_progress');

        try {
          const res = await fetch('/api/missions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify({ goal: text })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            window.showToast ? window.showToast('Failed to start mission: ' + (errData.error || res.statusText), 'error', '⚠️') : null;
            return;
          }
          const data = await res.json();
          if (data && data.missionId) {
            connectMissionSSE(data.missionId);
          }
        } catch(e) {
          window.showToast ? window.showToast('Network error starting mission', 'error', '⚠️') : null;
        }
      }

      // Check URL query parameters for direct active execution mode
      (function() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('active') === 'true' || urlParams.get('missionId')) {
          const landing = document.getElementById('initial-landing-view');
          const execView = document.getElementById('execution-stream-view');
          if (landing) landing.classList.add('hidden');
          if (execView) execView.classList.remove('hidden');
          const mId = urlParams.get('missionId');
          if (mId) connectMissionSSE(mId);
        }
      })();

      // Close dropdowns on outside click
      document.addEventListener('click', function(e) {
        const menu = document.getElementById('deep-research-menu');
        if (menu && !menu.contains(e.target) && !e.target.closest('button[onclick*="deep-research-menu"]')) {
          menu.classList.add('hidden');
        }
        const landingMenu = document.getElementById('landing-model-menu');
        if (landingMenu && !landingMenu.contains(e.target) && !e.target.closest('button[onclick*="landing-model-menu"]')) {
          landingMenu.classList.add('hidden');
        }
      });

      // Return to Landing View handler
      function returnToLandingView() {
        const landing = document.getElementById('initial-landing-view');
        const execView = document.getElementById('execution-stream-view');
        if (landing) landing.classList.remove('hidden');
        if (execView) execView.classList.add('hidden');
        if (window.location.search) {
          window.history.pushState({ view: 'landing' }, '', '/new');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.returnToLandingView = returnToLandingView;

      // Register custom back handler for global header back button and Alt+Left
      window.onCustomBack = function() {
        const execView = document.getElementById('execution-stream-view');
        if (execView && !execView.classList.contains('hidden')) {
          returnToLandingView();
          return true; // handled
        }
        return false;
      };

      // Support browser back/forward buttons smoothly
      window.addEventListener('popstate', function(e) {
        const execView = document.getElementById('execution-stream-view');
        if (execView && !execView.classList.contains('hidden')) {
          if (!window.location.search.includes('active=true')) {
            returnToLandingView();
          }
        }
      });

      // Window bindings
      window.launchPreset = launchPreset;
      window.submitLandingPrompt = submitLandingPrompt;
      window.handleLandingInputKeyDown = handleLandingInputKeyDown;
      window.togglePillActive = togglePillActive;
      window.setModel = setModel;
    </script>
  `;

  return renderLayout({
    activeRoute: '/new',
    isLightContent: true,
    title: 'ORCHESTRA — New Conversation',
    bodyContent
  });
}
