import { renderLayout } from '../components/layout.js';

const SERVICES = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Productivity',
    description: 'Read your calendar, check availability, and create or update events after approval.',
    features: [
      { id: 'google-calendar-read', label: 'Read events and availability', scope: 'calendar.events.readonly', checked: true },
      { id: 'google-calendar-write', label: 'Create and update events (approval required)', scope: 'calendar.events', checked: false }
    ],
    icon: '📅',
    provider: 'google'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Communication',
    description: 'Search and read authorized messages. Sending email requires a separate scope and explicit approval.',
    features: [
      { id: 'gmail-read', label: 'Search and read messages', scope: 'gmail.readonly', checked: true },
      { id: 'gmail-send', label: 'Send email (approval required)', scope: 'gmail.send', checked: false }
    ],
    icon: '✉️',
    provider: 'google'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Knowledge',
    description: 'Find files by name and optionally retrieve supported document content.',
    features: [
      { id: 'google-drive-search', label: 'Search file names and metadata', scope: 'drive.metadata.readonly', checked: true },
      { id: 'google-drive-content', label: 'Read supported document contents', scope: 'drive.readonly', checked: false }
    ],
    icon: '📁',
    provider: 'google'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    description: 'List repositories, search, and read files granted to this GitHub App installation.',
    features: [
      { id: 'github-repositories', label: 'Read repository metadata and contents', scope: 'GitHub App read permissions', checked: true }
    ],
    icon: '⌘',
    provider: 'github'
  }
] as const;

export function renderIntegrationsPage(): string {
  const cards = SERVICES.map((service) => `
    <article id="integration-${service.id}" data-integration="${service.id}" data-provider="${service.provider}"
      class="integration-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-2xl" aria-hidden="true">${service.icon}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">${service.category}</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">${service.name}</h2>
            </div>
            <span id="status-${service.id}" class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">Loading status…</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-600">${service.description}</p>
          <div class="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
            <p class="text-xs font-bold text-slate-700">Permissions — choose what to authorize</p>
            ${service.features.map((feature) => `
              <label class="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" class="integration-scope mt-0.5 accent-blue-600" data-feature="${feature.id}" ${feature.checked ? 'checked' : ''}>
                <span>${feature.label}<span class="mt-0.5 block font-mono text-[10px] text-slate-400">${feature.scope}</span></span>
              </label>
            `).join('')}
            <p class="pt-1 text-[11px] leading-5 text-slate-500">The exact selected permissions will be shown on the provider’s consent screen. Unselected permissions are not requested.</p>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">Account:</span>
            <span id="account-${service.id}" class="text-xs text-slate-500">Not connected</span>
          </div>
          <div class="mt-2">
            <p class="text-xs font-semibold text-slate-500">Granted permissions</p>
            <div id="permissions-${service.id}" class="mt-1 flex flex-wrap gap-1.5"><span class="text-xs text-slate-400">None</span></div>
          </div>
          <p id="sync-${service.id}" class="mt-2 text-xs text-slate-400">Last successful sync: Never</p>
          <p id="error-${service.id}" class="mt-2 hidden rounded-lg bg-rose-50 p-2 text-xs text-rose-700" role="alert"></p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button id="connect-${service.id}" type="button" data-connect-provider="${service.provider}" data-connect-id="${service.id}"
              class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              Connect
            </button>
            <button id="disconnect-${service.id}" type="button" data-disconnect-id="${service.id}"
              class="hidden rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
              Disconnect
            </button>
            <button id="retry-${service.id}" type="button" data-retry-id="${service.id}"
              class="hidden rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Retry status check
            </button>
          </div>
          ${service.provider === 'google' ? '<p class="mt-3 text-[11px] text-slate-400">Google services share one account authorization. Disconnecting any Google service disconnects Gmail, Calendar, and Drive for this browser.</p>' : ''}
        </div>
      </div>
    </article>
  `).join('');

  const bodyContent = `
    <main class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Connections</p>
          <h1 class="mt-1 text-3xl font-black tracking-tight text-slate-900">Integrations</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Connect your own Google and GitHub accounts. ORCHESTRA only reports a provider as connected after OAuth succeeds and a live account check passes.</p>
        </div>
        <button id="refresh-integrations" type="button" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Refresh status</button>
      </header>

      <section class="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900">
        <strong>Account isolation:</strong> Provider credentials are encrypted and scoped to this signed browser session. They are never sent to the browser. Google and GitHub write actions remain blocked unless they run through an approved mission.
      </section>

      <div id="integration-page-error" class="hidden rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert"></div>
      <div id="integration-toast" class="hidden rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm" role="status" aria-live="polite"></div>
      <section id="integrations-grid" class="grid gap-4 xl:grid-cols-2">${cards}</section>
      <p class="text-xs leading-5 text-slate-400">Only Google and GitHub are currently implemented. Other services from the former demo catalog are intentionally omitted rather than shown with simulated connection states.</p>
    </main>

    <script>
      (function () {
        const statusText = {
          not_connected: 'Not connected',
          connecting: 'Connecting',
          connected: 'Connected',
          expired: 'Expired or revoked',
          error: 'Error'
        };
        const statusStyles = {
          not_connected: 'border-slate-200 text-slate-500 bg-white',
          connecting: 'border-blue-200 text-blue-700 bg-blue-50',
          connected: 'border-emerald-200 text-emerald-700 bg-emerald-50',
          expired: 'border-amber-200 text-amber-800 bg-amber-50',
          error: 'border-rose-200 text-rose-700 bg-rose-50'
        };
        const errorMessages = {
          AUTHORIZATION_DENIED: 'Authorization was canceled. No connection was created.',
          OAUTH_STATE_INVALID: 'The authorization session expired or did not match this browser. Start again.',
          OAUTH_NOT_CONFIGURED: 'Provider OAuth is not configured by the deployment owner.',
          AUTH_EXPIRED: 'Access expired or was revoked. Reconnect and authorize again.',
          PERMISSION_DENIED: 'The provider denied a requested permission. Review access and retry.',
          RATE_LIMITED: 'The provider rate limit was reached. Wait briefly and retry.',
          ACCOUNT_MISMATCH: 'A different account is connected. Disconnect it before switching accounts.'
        };

        function showToast(message, isError) {
          const toast = document.getElementById('integration-toast');
          toast.textContent = message;
          toast.className = 'rounded-xl border p-4 text-sm ' + (isError
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800');
        }

        function setCardStatus(item) {
          const badge = document.getElementById('status-' + item.id);
          const account = document.getElementById('account-' + item.id);
          const sync = document.getElementById('sync-' + item.id);
          const error = document.getElementById('error-' + item.id);
          const connect = document.getElementById('connect-' + item.id);
          const disconnect = document.getElementById('disconnect-' + item.id);
          const retry = document.getElementById('retry-' + item.id);
          const permissions = document.getElementById('permissions-' + item.id);
          const state = statusText[item.status] ? item.status : 'error';

          badge.textContent = statusText[state];
          badge.className = 'rounded-full border px-3 py-1 text-xs font-semibold ' + statusStyles[state];
          account.textContent = item.account || 'Not connected';
          sync.textContent = 'Last successful sync: ' + (item.lastSuccessfulSyncAt
            ? new Date(item.lastSuccessfulSyncAt).toLocaleString()
            : 'Never');
          permissions.replaceChildren();
          if (Array.isArray(item.permissions) && item.permissions.length) {
            item.permissions.forEach((permission) => {
              const tag = document.createElement('span');
              tag.className = 'rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600';
              tag.textContent = permission;
              permissions.appendChild(tag);
            });
          } else {
            permissions.textContent = 'None';
            permissions.className = 'mt-1 text-xs text-slate-400';
          }
          error.textContent = item.error || '';
          error.classList.toggle('hidden', !item.error);
          connect.disabled = item.status === 'connecting';
          connect.textContent = item.status === 'connected' ? 'Connected' : item.configured ? 'Connect / reconnect' : 'Provider setup required';
          disconnect.classList.toggle('hidden', item.status !== 'connected' && item.status !== 'expired' && item.status !== 'error');
          retry.classList.toggle('hidden', item.status !== 'error' && item.status !== 'expired');
        }

        async function refreshStatuses() {
          const pageError = document.getElementById('integration-page-error');
          pageError.classList.add('hidden');
          try {
            const response = await fetch('/api/integrations', { headers: { Accept: 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not load connection status.');
            if (!Array.isArray(data.integrations)) throw new Error('The backend returned an invalid connection status response.');
            data.integrations.forEach(setCardStatus);
          } catch (error) {
            pageError.textContent = error instanceof Error ? error.message : 'Could not load connection status.';
            pageError.classList.remove('hidden');
          }
        }

        async function startGoogle(id) {
          const card = document.getElementById('integration-' + id);
          const features = Array.from(card.querySelectorAll('[data-feature]:checked')).map((input) => input.dataset.feature);
          if (!features.length) {
            showToast('Select at least one Google feature permission before continuing.', true);
            return;
          }
          const button = document.getElementById('connect-' + id);
          button.disabled = true;
          button.textContent = 'Connecting…';
          try {
            const response = await fetch('/api/integrations/google/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ features })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not start Google authorization.');
            window.location.assign(data.authorizationUrl);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not start Google authorization.', true);
            button.disabled = false;
            button.textContent = 'Connect / reconnect';
          }
        }

        async function startGitHub(id) {
          const button = document.getElementById('connect-' + id);
          button.disabled = true;
          button.textContent = 'Connecting…';
          try {
            const response = await fetch('/api/integrations/github/connect', {
              method: 'POST',
              headers: { Accept: 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not start GitHub authorization.');
            window.location.assign(data.authorizationUrl);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not start GitHub authorization.', true);
            button.disabled = false;
            button.textContent = 'Connect / reconnect';
          }
        }

        async function disconnect(id) {
          const provider = id === 'github' ? 'GitHub' : 'Google';
          if (!window.confirm('Disconnect ' + provider + ' for this browser session?')) return;
          try {
            const response = await fetch('/api/integrations/' + encodeURIComponent(id) + '/disconnect', {
              method: 'POST',
              headers: { Accept: 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not disconnect provider.');
            showToast(data.message, !data.providerRevoked);
            await refreshStatuses();
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Could not disconnect provider.', true);
          }
        }

        document.querySelectorAll('[data-connect-provider]').forEach((button) => {
          button.addEventListener('click', () => {
            const id = button.dataset.connectId;
            if (button.dataset.connectProvider === 'google') void startGoogle(id);
            else void startGitHub(id);
          });
        });
        document.querySelectorAll('[data-disconnect-id]').forEach((button) => {
          button.addEventListener('click', () => void disconnect(button.dataset.disconnectId));
        });
        document.querySelectorAll('[data-retry-id]').forEach((button) => {
          button.addEventListener('click', () => void refreshStatuses());
        });
        document.getElementById('refresh-integrations').addEventListener('click', () => void refreshStatuses());

        const params = new URLSearchParams(window.location.search);
        if (params.get('oauth') === 'connected') {
          showToast('Provider authorization succeeded and a live account check passed.', false);
        } else if (params.get('oauth') === 'error') {
          const code = params.get('code') || '';
          showToast(errorMessages[code] || 'Provider authorization failed. Review setup and retry.', true);
        }
        void refreshStatuses();
      })();
    </script>
  `;

  return renderLayout({
    title: 'Integrations · ORCHESTRA',
    activeRoute: '/integrations',
    bodyContent,
    isLightContent: true
  });
}
