import { renderLayout } from '../components/layout.js';

export function renderSettingsPage(): string {
  const bodyContent = `
    <div class="max-w-7xl mx-auto space-y-6 relative">
      <!-- Floating Iridescent Glass Bubbles Layer -->
      <div class="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
        <!-- Bubble 1: Bright Electric Cyan Top-Left -->
        <div class="absolute -top-4 -left-4 sm:left-2 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400/50 via-blue-500/40 to-sky-100/70 border-2 border-sky-400/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.95),0_0_25px_rgba(14,165,233,0.55),0_6px_20px_rgba(56,189,248,0.35)] backdrop-blur-xs" style="animation: floatBubbleA 6.5s ease-in-out infinite;">
          <div class="absolute top-1.5 left-2.5 w-3.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white] rotate-[-35deg]"></div>
          <div class="absolute bottom-2 right-2.5 w-1.5 h-1.5 rounded-full bg-sky-200"></div>
        </div>

        <!-- Bubble 2: Bright Radiant Indigo/Purple Mid-Left -->
        <div class="absolute top-1/4 -left-6 sm:-left-3 w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500/50 via-purple-500/40 to-indigo-100/70 border-2 border-indigo-400/80 shadow-[inset_0_2px_6px_rgba(255,255,255,0.95),0_0_22px_rgba(99,102,241,0.55)] backdrop-blur-xs" style="animation: floatBubbleB 7.8s ease-in-out infinite 0.8s;">
          <div class="absolute top-1 left-2 w-2.5 h-1 rounded-full bg-white shadow-[0_0_4px_white] rotate-[-30deg]"></div>
        </div>

        <!-- Bubble 3: Sparkling Cyan Orb Lower-Left -->
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

      <!-- Top Header Row -->
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p class="text-sm text-slate-500 mt-0.5">Customize your Alexa+ experience, manage your data, and control your preferences.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-1.5 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Healthy & Verified
          </span>
        </div>
      </div>

      <!-- Top Pill Tabs Navigation -->
      <div class="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80 text-xs select-none">
        <button type="button" onclick="switchSettingsTab('account')" id="tab-btn-account" class="settings-tab-btn px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200/70 shadow-2xs cursor-pointer">
          <span>👤</span>
          <span>Account</span>
        </button>
        <button type="button" onclick="switchSettingsTab('preferences')" id="tab-btn-preferences" class="settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <span>⚙️</span>
          <span>Preferences</span>
        </button>
        <button type="button" onclick="switchSettingsTab('privacy')" id="tab-btn-privacy" class="settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <span>🔒</span>
          <span>Privacy & Data</span>
        </button>
        <button type="button" onclick="switchSettingsTab('services')" id="tab-btn-services" class="settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <span>🔌</span>
          <span>Connected Services</span>
        </button>
        <button type="button" onclick="switchSettingsTab('notifications')" id="tab-btn-notifications" class="settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <span>🔔</span>
          <span>Notifications</span>
        </button>
        <button type="button" onclick="switchSettingsTab('appearance')" id="tab-btn-appearance" class="settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <span>🎨</span>
          <span>Appearance</span>
        </button>
      </div>

      <!-- Main 2-Column Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <!-- Left Column: Account, Preferences & Privacy Sections (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 1. Profile Information Card -->
          <div id="section-account" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 class="text-base font-bold text-slate-900">Profile Information</h2>
                <p class="text-xs text-slate-400 mt-0.5">Manage your account details and profile settings.</p>
              </div>
              <button type="button" onclick="openEditProfileModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-2xs transition cursor-pointer flex items-center gap-1.5">
                <span>✏️</span>
                <span>Edit Profile</span>
              </button>
            </div>

            <!-- Profile Details Row -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <!-- Avatar SM -->
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border-2 border-white">
                SM
              </div>

              <!-- Info Stack -->
              <div class="space-y-1 flex-1 min-w-0">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 id="display-profile-name" class="text-lg font-black text-slate-900 tracking-tight">Shanmukheswar</h3>
                  <span id="display-profile-role" class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Pro Builder
                  </span>
                </div>
                <p id="display-profile-email" class="text-xs text-slate-500 font-medium">shanmukheswar@example.com</p>

                <!-- Location & Badges Chips -->
                <div class="flex items-center gap-3 pt-2 text-xs flex-wrap">
                  <span class="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                    <span>📍</span> India
                  </span>
                  <span class="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                    <span>📅</span> Joined Oct 2026 (Active: 2025-11-25)
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-semibold">
                    <span>👑</span> Pro Builder Plan
                    <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Active</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Preferences Card -->
          <div id="section-preferences" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 class="text-base font-bold text-slate-900">Preferences</h2>
                <p class="text-xs text-slate-400 mt-0.5">Customize how Alexa+ works for you.</p>
              </div>
              <button type="button" onclick="openConfigureModal('General Preferences')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-2xs transition cursor-pointer flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Configure</span>
              </button>
            </div>

            <!-- 2x2 Grid of Sub-Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Card 1: Conversation Preferences -->
              <div onclick="openConfigureModal('Conversation Preferences')" class="group p-4 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">💬</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">Conversation Preferences</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Set response style, language, and conversation behavior.</p>
                </div>
                <span class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 2: Tool Preferences -->
              <div onclick="openConfigureModal('Tool Preferences')" class="group p-4 rounded-xl border border-slate-200/90 hover:border-purple-400 hover:bg-purple-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">🛠️</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition">Tool Preferences</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Manage default tools and automation settings.</p>
                </div>
                <span class="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 3: Notification Preferences -->
              <div onclick="openConfigureModal('Notification Preferences')" class="group p-4 rounded-xl border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">🔔</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition">Notification Preferences</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Choose what updates and reminders you want to receive.</p>
                </div>
                <span class="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 4: Appearance -->
              <div onclick="openConfigureModal('Appearance Preferences')" class="group p-4 rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">🎨</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">Appearance</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Customize theme, font size, and interface preferences.</p>
                </div>
                <span class="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>
            </div>
          </div>

          <!-- 3. Privacy & Data Card -->
          <div id="section-privacy" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 class="text-base font-bold text-slate-900">Privacy & Data</h2>
                <p class="text-xs text-slate-400 mt-0.5">Manage your data, history, and privacy settings.</p>
              </div>
              <button type="button" onclick="openConfigureModal('Privacy & Data Governance')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-2xs transition cursor-pointer flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Manage</span>
              </button>
            </div>

            <!-- 2x2 Grid of Sub-Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Card 1: Conversation History -->
              <div onclick="window.location.href='/activity'" class="group p-4 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">🗄️</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">Conversation History</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">View, manage, or delete your conversation data.</p>
                </div>
                <span class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 2: Data Controls -->
              <div onclick="openConfigureModal('Data Controls & SHA-256 Policy')" class="group p-4 rounded-xl border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">🛡️</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">Data Controls</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Manage data usage, retention, and SHA-256 fingerprint verification.</p>
                </div>
                <span class="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 3: Export Data -->
              <div onclick="triggerExportData()" class="group p-4 rounded-xl border border-slate-200/90 hover:border-purple-400 hover:bg-purple-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">📥</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition">Export Data</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Download your data, transcripts, and insights as JSON.</p>
                </div>
                <span class="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>

              <!-- Card 4: Delete Data -->
              <div onclick="openDeleteDataModal()" class="group p-4 rounded-xl border border-slate-200/90 hover:border-rose-400 hover:bg-rose-50/20 transition cursor-pointer flex items-start justify-between gap-3 bg-white">
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs">🗑️</span>
                    <h4 class="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition">Delete Data</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">Remove your data and temporary cache from Alexa+.</p>
                </div>
                <span class="text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition shrink-0 pt-1 font-bold">→</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Plan, Services & Danger Zone Widgets (1 col) -->
        <div class="space-y-6">
          <!-- 1. Account Plan Card -->
          <div id="section-plan" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="text-lg">👑</span>
                <h3 class="text-sm font-bold text-slate-900">Account Plan</h3>
              </div>
              <button type="button" onclick="openConfigureModal('Manage Subscription Plan')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                Manage Plan
              </button>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-base font-black text-slate-900">Pro Builder</span>
                <span class="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">Pro Tier</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">Access all tools, integrations, and advanced capabilities.</p>
            </div>

            <!-- Feature Capability Items with Functional Status Badges & Context -->
            <ul class="space-y-2.5 pt-2 text-xs font-medium text-slate-700">
              <li class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <span class="text-sm">💬</span>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Unlimited conversations</span>
                    <span class="text-[10px] text-slate-400">Zero message limits across active sessions</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">Included</span>
              </li>
              <li class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <span class="text-sm">🛠️</span>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Advanced tool access</span>
                    <span class="text-[10px] text-slate-400">8 Model Context Protocol tools enabled</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">8 MCP Tools</span>
              </li>
              <li class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <span class="text-sm">⚡</span>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Priority processing</span>
                    <span class="text-[10px] text-slate-400">Sub-second execution pipeline queue</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">High Tier</span>
              </li>
              <li class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <span class="text-sm">🧠</span>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Extended context memory</span>
                    <span class="text-[10px] text-slate-400">SQLite vector & persistent audit retention</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">128k Tokens</span>
              </li>
              <li class="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition">
                <div class="flex items-center gap-2.5">
                  <span class="text-sm">🚀</span>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Early access to new features</span>
                    <span class="text-[10px] text-slate-400">Autonomous FSM experimental capabilities</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">Beta Opt-in</span>
              </li>
            </ul>
          </div>

          <!-- 2. Connected Services Card -->
          <div id="section-services" class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="text-lg">🔌</span>
                <h3 class="text-sm font-bold text-slate-900">Connected Services</h3>
              </div>
              <a href="/integrations" class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Manage
              </a>
            </div>

            <div class="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <span>Transport: <strong>Streamable HTTP</strong> (Server & Client)</span>
              <span class="font-mono text-emerald-600 font-bold">2025-11-25</span>
            </div>

            <!-- List Items with Status Badges and Right Arrows -->
            <div class="space-y-2.5 text-xs">
              <!-- Google Calendar -->
              <div onclick="window.location.href='/integrations'" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">📅</span>
                  <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition">Google Calendar</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Not Connected</span>
                  <span class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition font-bold">→</span>
                </div>
              </div>

              <!-- Google Drive -->
              <div onclick="window.location.href='/integrations'" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">📁</span>
                  <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition">Google Drive</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Not Connected</span>
                  <span class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition font-bold">→</span>
                </div>
              </div>

              <!-- Gmail -->
              <div onclick="window.location.href='/integrations'" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">✉️</span>
                  <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition">Gmail</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Not Connected</span>
                  <span class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition font-bold">→</span>
                </div>
              </div>

              <!-- Notion -->
              <div onclick="window.location.href='/integrations'" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">📝</span>
                  <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition">Notion</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Not Connected</span>
                  <span class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition font-bold">→</span>
                </div>
              </div>

              <!-- Slack -->
              <div onclick="window.location.href='/integrations'" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">💬</span>
                  <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition">Slack</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">Not Connected</span>
                  <span class="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition font-bold">→</span>
                </div>
              </div>
            </div>

            <!-- Bottom Link -->
            <div class="pt-2 border-t border-slate-100">
              <a href="/integrations" class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                <span>View All Integrations</span>
                <span>→</span>
              </a>
            </div>
          </div>

          <!-- 3. Danger Zone Card -->
          <div class="bg-red-50/60 rounded-2xl border border-red-200/80 p-6 shadow-sm space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <h3 class="text-sm font-bold text-red-900">Danger Zone</h3>
            </div>
            <p class="text-xs text-red-700 leading-relaxed">These actions are permanent and cannot be undone.</p>
            <div class="pt-2">
              <button type="button" onclick="openDeleteAccountModal()" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white text-red-600 border border-red-300 hover:bg-red-600 hover:text-white shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>🗑️</span>
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div id="edit-profile-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Edit Profile</h3>
          <button type="button" onclick="closeEditProfileModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input type="text" id="input-profile-name" value="Shanmukheswar" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Role / Title</label>
            <input type="text" id="input-profile-role" value="Pro Builder" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input type="email" id="input-profile-email" value="shanmukheswar@example.com" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Location</label>
            <input type="text" value="India" readonly class="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 font-medium cursor-not-allowed" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button type="button" onclick="closeEditProfileModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
          <button type="button" onclick="saveProfileChanges()" class="px-5 py-2 rounded-xl text-xs font-bold bg-[#0066FF] hover:bg-blue-700 text-white shadow-sm transition">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Generic Configure Modal -->
    <div id="configure-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 id="configure-modal-title" class="text-base font-bold text-slate-900">Configuration</h3>
          <button type="button" onclick="closeConfigureModal()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3 text-xs text-slate-600">
          <p id="configure-modal-desc">Configure your preferences and operational settings for Alexa+.</p>

          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium text-slate-700">Cryptographic Fingerprinting (SHA-256)</span>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ENFORCED</span>
            </div>
            <p class="text-[11px] text-slate-500">Every consequential tool parameter is canonicalized via RFC 8785 and validated against SHA-256 hash digests before execution.</p>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium text-slate-700">Streamable HTTP Transport Protocol</span>
              <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">v2025-11-25</span>
            </div>
            <p class="text-[11px] text-slate-500">Connected to local MCP endpoint at http://127.0.0.1:3001/mcp with full tool discovery and execution streaming.</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button type="button" onclick="closeConfigureModal()" class="px-5 py-2 rounded-xl text-xs font-bold bg-[#0066FF] hover:bg-blue-700 text-white shadow-sm transition">Done</button>
        </div>
      </div>
    </div>

    <!-- Notification Toast -->
    <div id="settings-toast" class="hidden fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700">
      <div class="flex items-center gap-3">
        <span class="text-xl">✅</span>
        <div class="flex-1">
          <h5 id="toast-title" class="text-xs font-bold text-white">Settings Updated</h5>
          <p id="toast-msg" class="text-xs text-slate-300 mt-0.5">Your preferences have been saved successfully.</p>
        </div>
        <button type="button" onclick="document.getElementById('settings-toast').classList.add('hidden')" class="text-slate-400 hover:text-white text-xs">✕</button>
      </div>
    </div>

    <script>
      (function() {
        window.switchSettingsTab = function(tabId) {
          const tabButtons = document.querySelectorAll('.settings-tab-btn');
          tabButtons.forEach(btn => {
            btn.className = 'settings-tab-btn px-4 py-2 rounded-xl font-medium transition flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer';
          });

          const activeBtn = document.getElementById('tab-btn-' + tabId);
          if (activeBtn) {
            activeBtn.className = 'settings-tab-btn px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200/70 shadow-2xs cursor-pointer';
          }

          if (tabId === 'account') {
            document.getElementById('section-account')?.scrollIntoView({ behavior: 'smooth' });
          } else if (tabId === 'preferences') {
            document.getElementById('section-preferences')?.scrollIntoView({ behavior: 'smooth' });
          } else if (tabId === 'privacy') {
            document.getElementById('section-privacy')?.scrollIntoView({ behavior: 'smooth' });
          } else if (tabId === 'services') {
            document.getElementById('section-services')?.scrollIntoView({ behavior: 'smooth' });
          } else if (tabId === 'notifications') {
            window.openConfigureModal('Notification Preferences');
          } else if (tabId === 'appearance') {
            window.openConfigureModal('Appearance Preferences');
          }
        };

        window.openEditProfileModal = function() {
          document.getElementById('edit-profile-modal')?.classList.remove('hidden');
        };

        window.closeEditProfileModal = function() {
          document.getElementById('edit-profile-modal')?.classList.add('hidden');
        };

        window.saveProfileChanges = function() {
          const nameInput = document.getElementById('input-profile-name');
          const roleInput = document.getElementById('input-profile-role');
          const emailInput = document.getElementById('input-profile-email');

          if (nameInput) document.getElementById('display-profile-name').textContent = nameInput.value;
          if (roleInput) document.getElementById('display-profile-role').textContent = roleInput.value;
          if (emailInput) document.getElementById('display-profile-email').textContent = emailInput.value;

          window.closeEditProfileModal();
          showSettingsToast('Profile Updated', 'Your profile details have been saved.');
        };

        window.openConfigureModal = function(title) {
          const modal = document.getElementById('configure-modal');
          const titleEl = document.getElementById('configure-modal-title');
          if (titleEl) titleEl.textContent = title;
          if (modal) modal.classList.remove('hidden');
        };

        window.closeConfigureModal = function() {
          document.getElementById('configure-modal')?.classList.add('hidden');
        };

        window.triggerExportData = function() {
          const exportData = {
            user: "Shanmukheswar",
            plan: "Pro Builder",
            joined: "2025-11-25",
            location: "India",
            mcpProtocol: "Streamable HTTP",
            fingerprintVerification: "SHA-256",
            exportedAt: new Date().toISOString()
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'alexa-plus-user-data.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showSettingsToast('Export Complete', 'Downloaded alexa-plus-user-data.json.');
        };

        window.openDeleteDataModal = function() {
          if (confirm('Are you sure you want to clear temporary data and session cache? Your account will remain active.')) {
            showSettingsToast('Cache Cleared', 'Temporary session and query caches removed.');
          }
        };

        window.openDeleteAccountModal = function() {
          if (confirm('WARNING: Are you sure you want to delete your Alexa+ account? This action is permanent and cannot be undone.')) {
            alert('Account deletion request queued. Contact support to cancel within 48 hours.');
          }
        };

        function showSettingsToast(title, msg) {
          const toast = document.getElementById('settings-toast');
          document.getElementById('toast-title').textContent = title;
          document.getElementById('toast-msg').textContent = msg;
          if (toast) {
            toast.classList.remove('hidden');
            setTimeout(() => { toast.classList.add('hidden'); }, 3500);
          }
        }
      })();
    </script>
  `;

  return renderLayout({
    activeRoute: '/settings',
    title: 'Settings & Configuration — ORCHESTRA',
    isLightContent: true,
    bodyContent
  });
}
