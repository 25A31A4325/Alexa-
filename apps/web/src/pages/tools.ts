import { renderLayout } from '../components/layout.js';

export interface DiscoveredToolItem {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface ToolsPageOptions {
  tools?: DiscoveredToolItem[];
  serverOnline?: boolean;
  errorMessage?: string;
}

/**
 * Trusted backend classification policy.
 * Maps known tool names to their operational risk profile.
 * If a tool is unclassified, strictly returns "Classification unavailable".
 */
export function classifyTool(toolName: string): {
  classification: string;
  consequential: boolean;
  category: string;
} {
  const KNOWN_POLICIES: Record<string, { classification: string; consequential: boolean; category: string }> = {
    search_knowledge: {
      classification: 'Read-Only (Knowledge Search)',
      consequential: false,
      category: 'Knowledge'
    },
    retrieve_document: {
      classification: 'Read-Only (Document Retrieval)',
      consequential: false,
      category: 'Knowledge'
    },
    analyze_document: {
      classification: 'Read-Only (Content Synthesis)',
      consequential: false,
      category: 'Synthesis'
    },
    get_conversation_context: {
      classification: 'Read-Only (Context Query)',
      consequential: false,
      category: 'Context'
    },
    get_task_status: {
      classification: 'Read-Only (Task Query)',
      consequential: false,
      category: 'Task'
    },
    detect_conflict: {
      classification: 'Read-Only (Conflict Detection)',
      consequential: false,
      category: 'Calendar'
    },
    validate_result: {
      classification: 'Read-Only (Verification Engine)',
      consequential: false,
      category: 'Verification'
    },
    create_task: {
      classification: 'State Mutator (Task Store)',
      consequential: false,
      category: 'Task'
    },
    update_task: {
      classification: 'State Mutator (Task Store)',
      consequential: false,
      category: 'Task'
    },
    save_context: {
      classification: 'State Mutator (Context Memory)',
      consequential: false,
      category: 'Context'
    },
    calendar_create_reminder: {
      classification: 'Consequential Action (Calendar Mutation)',
      consequential: true,
      category: 'Calendar'
    },
    calendar_create_event: {
      classification: 'Consequential Action (Calendar Event)',
      consequential: true,
      category: 'Calendar'
    },
    send_notification: {
      classification: 'Consequential Action (Outbound Alert)',
      consequential: true,
      category: 'Communication'
    },
    email_checklist: {
      classification: 'Consequential Action (Outbound Email)',
      consequential: true,
      category: 'Communication'
    },
    delete_data: {
      classification: 'Consequential Action (Data Deletion)',
      consequential: true,
      category: 'Data'
    },
    verify_action: {
      classification: 'Consequential Policy Gate',
      consequential: true,
      category: 'Security'
    }
  };

  if (KNOWN_POLICIES[toolName]) {
    return KNOWN_POLICIES[toolName]!;
  }

  // Strict fallback when classification is absent
  return {
    classification: 'Classification unavailable',
    consequential: false,
    category: 'Unclassified'
  };
}

export function renderToolsPage(options: ToolsPageOptions = {}): string {
  const { tools = [], serverOnline = false, errorMessage } = options;

  // 9 Core Capabilities matching reference image
  const catalogTools = [
    {
      id: 'doc-analysis',
      title: 'Document Analysis',
      category: 'Knowledge',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-500',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
      desc: 'Analyze documents, extract key information, and identify important insights.',
      mcpTool: 'analyze_document',
      secondaryMcp: 'retrieve_document',
      isConsequential: false
    },
    {
      id: 'calendar',
      title: 'Calendar',
      category: 'External Services',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
      iconBg: 'bg-blue-50 border-blue-100 text-blue-500',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`,
      desc: 'Check upcoming meetings, events and details from your connected calendar.',
      mcpTool: 'detect_conflict',
      secondaryMcp: 'calendar_read_events',
      isConsequential: false
    },
    {
      id: 'knowledge-search',
      title: 'Knowledge Search',
      category: 'Knowledge',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-500',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
      desc: 'Find relevant documents, information and past knowledge.',
      mcpTool: 'search_knowledge',
      secondaryMcp: 'retrieve_document',
      isConsequential: false
    },
    {
      id: 'task-management',
      title: 'Task Management',
      category: 'Planning',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`,
      desc: 'Create, update and track tasks with priorities and deadlines.',
      mcpTool: 'create_task',
      secondaryMcp: 'update_task',
      isConsequential: false
    },
    {
      id: 'data-analysis',
      title: 'Data Analysis',
      category: 'Data',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
      iconBg: 'bg-purple-50 border-purple-100 text-purple-600',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>`,
      desc: 'Query data, analyze trends and generate reports.',
      mcpTool: 'get_task_status',
      secondaryMcp: 'database_query',
      isConsequential: false
    },
    {
      id: 'notifications',
      title: 'Notifications',
      category: 'External Services',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
      iconBg: 'bg-sky-50 border-sky-100 text-sky-500',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`,
      desc: 'Set reminders and send notifications across connected services.',
      mcpTool: 'calendar_create_reminder',
      secondaryMcp: 'detect_conflict',
      isConsequential: false
    },
    {
      id: 'conversation-context',
      title: 'Conversation Context',
      category: 'Context',
      badgeClass: 'bg-pink-50 text-pink-700 border-pink-200/60',
      iconBg: 'bg-pink-50 border-pink-100 text-pink-500',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>`,
      desc: 'Get and save important context from your conversations.',
      mcpTool: 'get_conversation_context',
      secondaryMcp: 'save_context',
      isConsequential: false
    },
    {
      id: 'verification',
      title: 'Verification',
      category: 'Verification',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`,
      desc: 'Validate results, detect conflicts and verify actions.',
      mcpTool: 'verify_action',
      secondaryMcp: 'validate_result',
      isConsequential: true
    },
    {
      id: 'connected-services',
      title: 'Connected Services',
      category: 'External Services',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
      iconBg: 'bg-purple-50 border-purple-100 text-purple-600',
      iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`,
      desc: 'Access and work with your connected accounts and APIs.',
      mcpTool: 'detect_conflict',
      secondaryMcp: 'search_knowledge',
      isConsequential: false
    }
  ];

  // Dynamically augment catalog with any tools discovered from MCP server
  if (serverOnline && tools.length > 0) {
    const knownMcpTools = new Set(catalogTools.map(c => c.mcpTool));
    const extraDiscoveredTools = tools.filter(t => !knownMcpTools.has(t.name));

    extraDiscoveredTools.forEach((t) => {
      const policy = classifyTool(t.name);
      catalogTools.push({
        id: `discovered-${t.name}`,
        title: t.name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        category: policy.category === 'Unclassified' ? 'External Services' : policy.category,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
        iconBg: 'bg-blue-50 border-blue-100 text-blue-600',
        iconSvg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
        desc: t.description || 'Live MCP tool dynamically discovered over Streamable HTTP.',
        mcpTool: t.name,
        secondaryMcp: '',
        isConsequential: policy.consequential
      });
    });
  }

  let toolCardsHtml = '';

  if (!serverOnline) {
    toolCardsHtml = `
      <div class="col-span-full p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 mb-6">
        <div class="text-3xl">⚠️</div>
        <h3 class="text-base font-bold text-rose-800">MCP Server Offline / Tools Unavailable</h3>
        <p class="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
          Could not dynamically discover tools from the MCP server at <code class="bg-slate-100 px-1.5 py-0.5 rounded text-rose-800 font-mono">http://127.0.0.1:3001/mcp</code>.
          ${errorMessage ? `<br><span class="text-rose-600 font-mono mt-1 block">Error: ${errorMessage}</span>` : ''}
        </p>
        <p class="text-xs font-bold text-slate-700">0 Tools Available</p>
        <p class="text-[11px] text-slate-500">
          ORCHESTRA strictly disallows substituting imaginary or hardcoded tools when live MCP discovery is unavailable.
        </p>
      </div>
    `;
  } else {
    toolCardsHtml = catalogTools.map(item => {
      return `
        <div class="tool-card group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-lg hover:border-blue-400/60 transition-all duration-300 flex flex-col justify-between min-h-[165px] transform hover:-translate-y-1"
             data-category="${item.category}"
             data-title="${item.title}"
             data-tool-name="${item.mcpTool}"
             data-desc="${item.desc}">
          
          <div class="flex items-start gap-3.5">
            <!-- Left Colored Square Icon -->
            <div class="w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
              ${item.iconSvg}
            </div>

            <!-- Title & Description -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1.5">
                <h3 class="text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">${item.title}</h3>
                ${item.isConsequential ? `
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs" title="Requires human approval gate">
                    <span>🔒</span> Consequential Gate
                  </span>
                ` : ''}
              </div>
              <p class="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">${item.desc}</p>
            </div>
          </div>

          <!-- Bottom Row: Category Pill & Use -> Action -->
          <div class="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-lg border ${item.badgeClass}">
              ${item.category}
            </span>

            <button type="button" 
                    onclick="openToolDrawer('${item.title}', '${item.mcpTool}', '${item.secondaryMcp || ''}', '${item.category}')" 
                    class="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 group/btn transition cursor-pointer">
              <span>Use</span>
              <span class="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const bodyContent = `
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- 1. Page Header with Manage Tools Button -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tools</h1>
          <p class="text-xs sm:text-[13px] text-slate-500 mt-1">Use powerful tools to get information, analyze data, and take actions.</p>
        </div>

        <button type="button" 
                onclick="openManageToolsModal()" 
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition self-start sm:self-auto cursor-pointer">
          <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Manage Tools
        </button>
      </div>

      <!-- 2. Dark Navy Hero Banner with Amazon Smile Glow Wave Line -->
      <div class="relative overflow-hidden rounded-2xl bg-[#091122] border border-[#16233B] p-6 sm:p-7 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <!-- Floating Glass Bubbles inside Hero Banner -->
        <div class="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
          <div class="absolute top-2 left-1/3 w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400/25 via-blue-500/15 to-white/35 border border-sky-300/40 shadow-[inset_0_2px_5px_rgba(255,255,255,0.6),0_0_20px_rgba(56,189,248,0.3)]" style="animation: floatBubbleA 6.5s ease-in-out infinite;">
            <div class="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/75 rotate-[-30deg]"></div>
          </div>
          <div class="absolute bottom-2 left-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400/25 via-yellow-200/15 to-white/40 border border-amber-300/40 shadow-[inset_0_1.5px_4px_rgba(255,255,255,0.6),0_0_16px_rgba(255,184,0,0.3)]" style="animation: floatBubbleB 7.5s ease-in-out infinite 1s;">
            <div class="absolute top-1 left-1 w-1.5 h-0.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute -top-1 right-1/4 w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-400/20 via-sky-300/15 to-white/30 border border-indigo-300/30 shadow-[0_0_18px_rgba(99,102,241,0.25)]" style="animation: floatBubbleC 6s ease-in-out infinite 2s;">
            <div class="absolute top-1 left-1.5 w-1.5 h-1 rounded-full bg-white/80"></div>
          </div>
        </div>
        
        <!-- Left Content -->
        <div class="space-y-2 max-w-lg z-10">
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">Multiple capabilities. One intelligent agent.</h2>
          <p class="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
            Alexa+ can discover, understand, and use the right tools for your request.
          </p>
          <div class="pt-2">
            <button type="button" 
                    onclick="resetFilters()" 
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white backdrop-blur-sm transition cursor-pointer">
              Explore all tools →
            </button>
          </div>
        </div>

        <!-- Right Side: Glowing Orange Smile Horizon Wave + Hexagon Nodes -->
        <div class="relative w-full md:w-96 h-28 flex items-center justify-end z-10 flex-shrink-0 select-none">
          <svg class="w-full h-full" viewBox="0 0 380 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="smileGlowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stop-color="#FF9900" stop-opacity="0" />
                <stop offset="30%" stop-color="#FF9900" stop-opacity="0.6" />
                <stop offset="85%" stop-color="#FFB800" stop-opacity="1" />
                <stop offset="100%" stop-color="#FFA000" stop-opacity="1" />
              </linearGradient>
              <filter id="waveBloom" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Background Ambient Hexagon Tech Grid Glow -->
            <path d="M290 20 L305 12 L320 20 L320 36 L305 44 L290 36 Z" stroke="#1E3A8A" stroke-width="1.2" fill="rgba(30,58,138,0.15)" opacity="0.6" />
            <path d="M335 48 L350 40 L365 48 L365 64 L350 72 L335 64 Z" stroke="#1E3A8A" stroke-width="1.2" fill="rgba(30,58,138,0.15)" opacity="0.6" />
            <path d="M275 60 L290 52 L305 60 L305 76 L290 84 L275 76 Z" stroke="#1E3A8A" stroke-width="1.2" fill="rgba(30,58,138,0.15)" opacity="0.6" />

            <!-- Hexagon 1: Cube / MCP icon -->
            <g transform="translate(290, 16)">
              <rect x="0" y="0" width="28" height="28" rx="7" fill="#132342" stroke="#2563EB" stroke-width="1.5" />
              <path d="M14 6 L21 10 L14 14 L7 10 Z" stroke="#60A5FA" stroke-width="1.2" fill="none" />
              <path d="M7 10 L7 18 L14 22 L14 14 Z" stroke="#60A5FA" stroke-width="1.2" fill="none" />
              <path d="M21 10 L21 18 L14 22 L14 14 Z" stroke="#60A5FA" stroke-width="1.2" fill="none" />
            </g>

            <!-- Hexagon 2: Database / Cylinder icon -->
            <g transform="translate(322, 38)">
              <rect x="0" y="0" width="26" height="26" rx="7" fill="#132342" stroke="#2563EB" stroke-width="1.5" />
              <path d="M7 8 C7 6.5 10 5.5 13 5.5 C16 5.5 19 6.5 19 8 C19 9.5 16 10.5 13 10.5 C10 10.5 7 9.5 7 8 Z" stroke="#60A5FA" stroke-width="1.2" fill="none" />
              <path d="M7 8 V14 C7 15.5 10 16.5 13 16.5 C16 16.5 19 15.5 19 14 V8" stroke="#60A5FA" stroke-width="1.2" fill="none" />
              <path d="M7 13 C7 14.5 10 15.5 13 15.5 C16 15.5 19 14.5 19 13" stroke="#60A5FA" stroke-width="1.2" fill="none" />
            </g>

            <!-- Hexagon 3: Document icon -->
            <g transform="translate(344, 46)">
              <rect x="0" y="0" width="24" height="24" rx="6" fill="#132342" stroke="#2563EB" stroke-width="1.5" />
              <path d="M7 6 H14 L17 9 V18 H7 Z" stroke="#60A5FA" stroke-width="1.2" fill="none" />
              <path d="M10 11 H14 M10 14 H14" stroke="#60A5FA" stroke-width="1" />
            </g>

            <!-- Sweeping Glowing Orange Smile Wave Arc -->
            <path d="M10 82 C90 82, 170 85, 230 70 C270 60, 295 55, 318 64" 
                  stroke="url(#smileGlowGrad)" 
                  stroke-width="3" 
                  stroke-linecap="round"
                  filter="url(#waveBloom)" />

            <!-- Arrowhead pointing into hexagons -->
            <path d="M312 58 L324 64 L313 71" 
                  fill="none" 
                  stroke="#FFB800" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
          </svg>
        </div>

        <!-- Subtle ambient radial gradient behind the curve -->
        <div class="absolute right-0 bottom-0 w-80 h-32 opacity-25 pointer-events-none bg-gradient-to-t from-[#FF9900] via-blue-900 to-transparent rounded-full blur-2xl"></div>
      </div>

      <!-- 3. Category Filter Pills & Search Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        
        <!-- Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" id="filter-tabs">
          <button type="button" 
                  onclick="setFilter('all', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EBF5FF] text-[#2563EB] border border-blue-200 transition shadow-2xs">
            All Tools
          </button>
          <button type="button" 
                  onclick="setFilter('Knowledge', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            Knowledge
          </button>
          <button type="button" 
                  onclick="setFilter('Planning', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            Planning
          </button>
          <button type="button" 
                  onclick="setFilter('Context', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            Context
          </button>
          <button type="button" 
                  onclick="setFilter('Data', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            Data
          </button>
          <button type="button" 
                  onclick="setFilter('External Services', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            External Services
          </button>
          <button type="button" 
                  onclick="setFilter('Verification', this)" 
                  class="filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition">
            Verification
          </button>
        </div>

        <!-- Search Box -->
        <div class="relative min-w-[210px]">
          <input type="text" 
                 id="tool-search" 
                 oninput="filterTools()" 
                 placeholder="Search tools..." 
                 class="w-full bg-[#0A0D14] hover:bg-[#111827] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition" />
          <span class="absolute left-2.5 top-2 text-blue-400 text-xs">🔍</span>
        </div>
      </div>

      <!-- 4. 3-Column Tools Card Grid -->
      <div id="tools-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${toolCardsHtml}
      </div>

      <!-- 5. Bottom Tool Orchestration Pipeline Bar -->
      <div class="bg-[#F0F7FF] border border-[#BFDBFE] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xs">
        
        <!-- Left: Tool Orchestration Summary -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900">Tool Orchestration</h4>
            <p class="text-xs text-slate-600 mt-0.5">Alexa+ automatically selects and combines multiple tools to accomplish complex tasks.</p>
          </div>
        </div>

        <!-- Right: 5-Step Pipeline Flow -->
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          <!-- 1. Discover Tools -->
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <span class="text-xs font-semibold text-slate-700">Discover Tools</span>
          </div>

          <span class="text-slate-300 text-xs font-bold">→</span>

          <!-- 2. Select -->
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <span class="text-xs font-semibold text-slate-700">Select</span>
          </div>

          <span class="text-slate-300 text-xs font-bold">→</span>

          <!-- 3. Execute -->
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span class="text-xs font-semibold text-slate-700">Execute</span>
          </div>

          <span class="text-slate-300 text-xs font-bold">→</span>

          <!-- 4. Verify -->
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span class="text-xs font-semibold text-slate-700">Verify</span>
          </div>

          <span class="text-slate-300 text-xs font-bold">→</span>

          <!-- 5. Deliver Results -->
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <span class="text-xs font-semibold text-slate-700">Deliver Results</span>
          </div>

        </div>

      </div>

    </div>

    <!-- Interactive Drawer Modal: Use Tool Inspector -->
    <div id="tool-drawer" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 hidden flex justify-end">
      <div class="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div id="drawer-icon-box" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              🛠️
            </div>
            <div>
              <h3 id="drawer-title" class="text-sm font-bold text-slate-900">Tool Details</h3>
              <span id="drawer-category" class="text-[10px] text-slate-500 font-medium">Category</span>
            </div>
          </div>
          <button onclick="closeToolDrawer()" class="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Underlying MCP Tool</label>
            <div id="drawer-mcp-name" class="font-mono text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-blue-700 font-semibold"></div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Operational Policy</label>
            <div id="drawer-policy-box" class="text-xs p-2.5 rounded-xl border"></div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Tool Input Parameters (JSON)</label>
              <button type="button" id="drawer-run-btn" onclick="executeToolLive()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer">
                <span>▶ Test Live Tool (MCP)</span>
              </button>
            </div>
            <textarea id="drawer-params-input" rows="3" class="w-full font-mono text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"></textarea>
          </div>

          <div id="drawer-result-container" class="hidden">
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Live MCP Execution Output</label>
            <pre id="drawer-live-result" class="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl border border-slate-800 overflow-x-auto max-h-40"></pre>
          </div>

          <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
            💡 <strong>Autonomous Mission Orchestration:</strong> You can invoke this tool directly through natural language from <strong>New Conversation</strong>, or dispatch it as an autonomous mission step.
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button onclick="closeToolDrawer()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition">
            Close
          </button>
          <a id="drawer-start-mission-btn" href="/new" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
            Launch Mission with Tool →
          </a>
        </div>
      </div>
    </div>

    <!-- Manage Tools Modal -->
    <div id="manage-tools-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
      <div class="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Manage Model Context Protocol Tools</h3>
              <p class="text-[11px] text-slate-500">Live transport: Streamable HTTP (spec 2025-11-25)</p>
            </div>
          </div>
          <button onclick="closeManageToolsModal()" class="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100">✕</button>
        </div>

        <div class="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-xs font-bold text-slate-800 block">MCP Server Endpoint</span>
              <span class="text-[11px] font-mono text-slate-500">http://127.0.0.1:3001/mcp</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${serverOnline ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}">
              ${serverOnline ? '● CONNECTED' : '○ OFFLINE'}
            </span>
          </div>

          <div>
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Registered Backend Tool Catalog</h4>
            <div class="space-y-2 text-xs">
              ${tools.map(t => {
                const p = classifyTool(t.name);
                return `
                  <div class="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition" data-tool-name="${t.name}">
                    <div>
                      <span class="font-mono font-bold text-slate-900">${t.name}</span>
                      <p class="text-[11px] text-slate-500 mt-0.5">${t.description || 'MCP dynamic tool'}</p>
                    </div>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${p.consequential ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
                      ${p.consequential ? '🔒 Consequential Gate' : p.classification.split(' ')[0]}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">${tools.length} Tools Discovered</span>
          <button onclick="closeManageToolsModal()" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs">
            Done
          </button>
        </div>
      </div>
    </div>

    <!-- Client-side Filtering & Modal Script -->
    <script>
      let currentFilter = 'all';

      function setFilter(category, btnElement) {
        currentFilter = category;
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
          tab.className = 'filter-tab px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:text-slate-900 hover:bg-slate-200 transition';
        });

        if (btnElement) {
          btnElement.className = 'filter-tab px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EBF5FF] text-[#2563EB] border border-blue-200 transition shadow-2xs';
        }

        filterTools();
      }

      function resetFilters() {
        const firstTab = document.querySelector('.filter-tab');
        setFilter('all', firstTab);
        const searchInput = document.getElementById('tool-search');
        if (searchInput) {
          searchInput.value = '';
          filterTools();
        }
      }

      function filterTools() {
        const searchInput = document.getElementById('tool-search');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const cards = document.querySelectorAll('.tool-card');

        cards.forEach(card => {
          const category = card.getAttribute('data-category') || '';
          const title = (card.getAttribute('data-title') || '').toLowerCase();
          const desc = (card.getAttribute('data-desc') || '').toLowerCase();
          const toolName = (card.getAttribute('data-tool-name') || '').toLowerCase();

          const matchesCategory = (currentFilter === 'all') || (category === currentFilter);
          const matchesQuery = !query || title.includes(query) || desc.includes(query) || toolName.includes(query);

          if (matchesCategory && matchesQuery) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      }

      function openToolDrawer(title, mcpTool, secondaryTool, category) {
        const drawer = document.getElementById('tool-drawer');
        const titleEl = document.getElementById('drawer-title');
        const catEl = document.getElementById('drawer-category');
        const mcpEl = document.getElementById('drawer-mcp-name');
        const policyEl = document.getElementById('drawer-policy-box');
        const paramsEl = document.getElementById('drawer-params-input');
        const launchBtn = document.getElementById('drawer-start-mission-btn');

        if (titleEl) titleEl.textContent = title;
        if (catEl) catEl.textContent = 'Category: ' + category;
        if (mcpEl) {
          mcpEl.textContent = mcpTool + (secondaryTool ? ' + ' + secondaryTool : '');
          mcpEl.setAttribute('data-raw-tool', mcpTool);
        }

        const resultContainer = document.getElementById('drawer-result-container');
        if (resultContainer) resultContainer.classList.add('hidden');

        if (policyEl) {
          if (mcpTool === 'verify_action') {
            policyEl.className = 'text-xs p-2.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 font-semibold';
            policyEl.textContent = '🔒 Consequential Policy Gate — Requires SHA-256 fingerprint validation before execution.';
          } else {
            policyEl.className = 'text-xs p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 font-medium';
            policyEl.textContent = '✓ Safe Read / Context Execution — Fully autonomous execution permitted.';
          }
        }

        if (paramsEl) {
          if (mcpTool === 'search_knowledge') {
            paramsEl.value = JSON.stringify({ query: 'Q4 Product Roadmap', limit: 3 }, null, 2);
          } else if (mcpTool === 'retrieve_document') {
            paramsEl.value = JSON.stringify({ documentId: 'doc-q4-roadmap' }, null, 2);
          } else if (mcpTool === 'analyze_document') {
            paramsEl.value = JSON.stringify({ documents: ['doc-q4-roadmap'], analysis_type: 'key_points' }, null, 2);
          } else if (mcpTool === 'create_task') {
            paramsEl.value = JSON.stringify({ missionId: 'mission-demo', title: 'Review executive presentation slides', priority: 'high' }, null, 2);
          } else if (mcpTool === 'detect_conflict') {
            paramsEl.value = JSON.stringify({ items: [{ id: 'meeting-1', timeSlot: '10:00 AM - 11:00 AM', topic: 'Product Roadmap Discussion' }, { id: 'focus-time', timeSlot: '02:00 PM - 03:00 PM', topic: 'Architecture Focus' }] }, null, 2);
          } else if (mcpTool === 'verify_action') {
            paramsEl.value = JSON.stringify({ actionType: 'calendar_create_reminder', parameters: { title: 'Prep for meeting', reminderTime: 'Tomorrow at 09:30 AM' } }, null, 2);
          } else if (mcpTool === 'validate_result') {
            paramsEl.value = JSON.stringify({ originalGoal: 'Prepare for meeting', executedSteps: ['step-1', 'step-2', 'step-3'], deliverables: { briefing: 'complete' } }, null, 2);
          } else {
            paramsEl.value = JSON.stringify({ action: mcpTool, target: 'live_test' }, null, 2);
          }
        }

        if (launchBtn) {
          launchBtn.href = '/new?tool=' + encodeURIComponent(mcpTool);
        }

        if (drawer) drawer.classList.remove('hidden');
      }

      async function executeToolLive() {
        const mcpEl = document.getElementById('drawer-mcp-name');
        const rawTool = mcpEl ? mcpEl.getAttribute('data-raw-tool') : '';
        const paramsText = document.getElementById('drawer-params-input').value;
        const resultContainer = document.getElementById('drawer-result-container');
        const resultBox = document.getElementById('drawer-live-result');
        const runBtn = document.getElementById('drawer-run-btn');

        if (!rawTool || !resultBox || !resultContainer) return;

        let params = {};
        try {
          params = JSON.parse(paramsText || '{}');
        } catch(e) {
          alert('Invalid JSON parameters in textarea.');
          return;
        }

        if (runBtn) {
          runBtn.disabled = true;
          runBtn.innerHTML = 'Executing...';
        }
        resultContainer.classList.remove('hidden');
        resultBox.textContent = 'Calling live MCP Server over Streamable HTTP...';

        try {
          const res = await fetch('/api/tools/' + encodeURIComponent(rawTool) + '/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream, application/json'
            },
            body: JSON.stringify(params)
          });
          const data = await res.json();
          resultBox.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
          resultBox.textContent = 'Error: ' + err.message;
        } finally {
          if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '▶ Test Live Tool (MCP)';
          }
        }
      }

      function closeToolDrawer() {
        const drawer = document.getElementById('tool-drawer');
        if (drawer) drawer.classList.add('hidden');
      }

      function openManageToolsModal() {
        const modal = document.getElementById('manage-tools-modal');
        if (modal) modal.classList.remove('hidden');
      }

      function closeManageToolsModal() {
        const modal = document.getElementById('manage-tools-modal');
        if (modal) modal.classList.add('hidden');
      }
    </script>
  `;

  return renderLayout({
    activeRoute: '/tools',
    title: 'Tools Catalog — ORCHESTRA',
    bodyContent,
    isLightContent: true
  });
}
