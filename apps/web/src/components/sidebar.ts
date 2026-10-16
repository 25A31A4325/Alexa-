export interface NavItem {
  id: string;
  label: string;
  route: string;
  iconName: string;
}

export const SIDEBAR_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Home', route: '/', iconName: 'home' },
  { id: 'new-conversation', label: 'New Conversation', route: '/new', iconName: 'plus-circle' },
  { id: 'missions', label: 'Missions', route: '/missions', iconName: 'compass' },
  { id: 'knowledge', label: 'Knowledge', route: '/knowledge', iconName: 'book-open' },
  { id: 'tools', label: 'Tools', route: '/tools', iconName: 'wrench' },
  { id: 'integrations', label: 'Integrations', route: '/integrations', iconName: 'share-2' },
  { id: 'activity', label: 'Activity', route: '/activity', iconName: 'bar-chart-2' },
  { id: 'settings', label: 'Settings', route: '/settings', iconName: 'settings' }
] as const;

export const INVARIANT_SIDEBAR_ITEMS = SIDEBAR_ITEMS;

export function renderSidebar(activeRoute: string): string {
  const itemsHtml = SIDEBAR_ITEMS.map((item) => {
    const isActive =
      item.route === '/'
        ? activeRoute === '/'
        : activeRoute.startsWith(item.route);

    const activeClasses = isActive
      ? 'bg-[#0e2643] text-white font-semibold border border-[#1d4875]/80 rounded-xl px-3.5 shadow-[0_0_15px_rgba(37,99,235,0.18)]'
      : 'text-[#8fa0b5] hover:bg-[#0c1828] hover:text-white rounded-xl px-3.5';

    return `
      <a href="${item.route}" 
         class="flex items-center gap-3 py-2.5 transition-all text-sm ${activeClasses}"
         data-nav-id="${item.id}"
         data-route="${item.route}"
         ${isActive ? 'aria-current="page"' : ''}>
        <span class="icon-${item.iconName} w-5 h-5 flex-shrink-0 text-slate-400"></span>
        <span class="nav-label">${item.label}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="w-64 bg-[#070e1a] border-r border-[#142032] flex flex-col justify-between flex-shrink-0 select-none z-20 min-h-0">
      <div class="p-3">
        <!-- Brand Header with Official Amazon Hackathon Branding -->
        <div class="px-2 pb-3 mb-2 border-b border-[#142032] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="/static/amazon-smile-logo.png" alt="Amazon Smile Logo" class="h-4 w-auto object-contain flex-shrink-0" />
            <span class="text-xs font-bold text-white tracking-tight">ORCHESTRA</span>
            <span class="text-[9px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.2 rounded">Alexa+</span>
          </div>
          <img src="/static/amazon-wordmark-logo.png" alt="Amazon Wordmark Logo" class="h-3 w-auto object-contain opacity-80 flex-shrink-0" />
        </div>

        <!-- Navigation Menu (Invariant 8 items in exact order) -->
        <nav class="flex flex-col gap-1.5" aria-label="Main Navigation">
          ${itemsHtml}
        </nav>
      </div>

      <!-- User Profile / Footer Badge matching reference design -->
      <div class="p-3 m-3 border border-[#162338] rounded-xl bg-[#0b1422] hover:bg-[#0e192c] transition flex items-center justify-between cursor-pointer">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            SM
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-semibold text-white truncate">Shanmukheswar</span>
            <span class="text-[11px] text-[#7c8ba1] truncate">Pro Builder</span>
          </div>
        </div>
        <span class="text-[#5e718d] text-sm font-bold pl-1">›</span>
      </div>
    </aside>
  `;
}
