<template>
  <div class="shell">
    <aside :class="{ open }">
      <HrisLogo light class="brand" />
      <nav aria-label="Main">
        <template v-for="g in navGroups" :key="g.title">
          <span class="nav-label">{{ g.title }}</span>
          <NuxtLink
            v-for="n in g.items"
            :key="n.to"
            :to="n.to"
            :external="n.external"
            :target="n.external ? '_blank' : undefined"
            :rel="n.external ? 'noopener' : undefined"
            :class="{ active: !n.external && isActive(n.to) }"
            @click="open = false"
          >
            <span class="ico"><AppIcon :name="n.icon" /></span>{{ n.label }}
            <template v-if="n.external"><AppIcon name="external" :size="13" class="ext" /><span class="sr-only">(opens in a new tab)</span></template>
          </NuxtLink>
        </template>
      </nav>
      <div class="foot">
        <NuxtLink
          v-for="n in footNav"
          :key="n.to"
          :to="n.to"
          class="flink"
          :class="{ active: isActive(n.to) }"
          @click="open = false"
        >
          <AppIcon :name="n.icon" :size="16" />{{ n.label }}
        </NuxtLink>
        <small class="tag">Powering Innovation</small>
      </div>
    </aside>
    <div v-if="open" class="scrim" @click="open = false" />
    <div class="main">
      <header :class="{ hidden: hideHeader }">
        <button class="menu" aria-label="Menu" @click="open = !open">☰</button>
        <HeaderSearch />
        <button type="button" class="company" title="Switch company" @click="switchCompany"
          ><AppIcon name="people" :size="15" /><span>{{ company }}</span
          ><AppIcon name="chevron" :size="13"
        /></button>
        <NuxtLink to="/notifications" class="bell" aria-label="Notifications"
          ><AppIcon name="bell" :size="20" /><i v-if="unread">{{
            unread
          }}</i></NuxtLink
        >
        <div class="acct" @focusout="onBlur">
          <button
            class="user"
            aria-label="Account menu"
            :aria-expanded="menu"
            @click="menu = !menu"
          >
            <span class="avatar"><img v-if="photo" :src="photo" alt="">{{ photo ? '' : user.initials }}</span>
          </button>
          <Transition name="pop">
            <div v-if="menu" class="menu-pop" role="menu">
              <div class="who">
                <b>{{ user.name }}</b
                ><small>{{ user.role }} · {{ user.id }}</small>
              </div>
              <NuxtLink to="/profile" role="menuitem" @click="menu = false"
                ><AppIcon name="user" :size="16" /> My profile</NuxtLink
              >
              <button type="button" role="menuitem" class="danger" @click="signOut">
                <AppIcon name="logout" :size="16" /> Sign out
              </button>
            </div>
          </Transition>
        </div>
      </header>
      <main>
        <div class="wrap"><slot /></div>
      </main>
    </div>
  </div>
</template>

<script setup>
const open = ref(false)

// Hide the top bar while scrolling down; show it again on any scroll up (or near the top).
const hideHeader = ref(false)
let lastY = 0
let ticking = false
const onScroll = () => {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const y = window.scrollY
    if (y < 80) hideHeader.value = false
    else if (y > lastY + 6) hideHeader.value = !menu.value // keep it while the avatar menu is open
    else if (y < lastY - 6) hideHeader.value = false
    lastY = y
    ticking = false
  })
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
const menu = ref(false)
const onBlur = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) menu.value = false }
const { confirm } = useConfirm()
const signOut = async () => {
  menu.value = false
  const ok = await confirm({ title: 'Sign out?', message: 'You will need to sign in again to use HRIS.', confirmText: 'Sign out', tone: 'danger', icon: 'logout' })
  if (ok) navigateTo('/login')
}
const { user, notifications, companies } = useMockData()
// Profile photo chosen on the Profile page (no server endpoint yet — kept in app state).
const { photo } = useProfilePhoto()
const company = useState('company', () => companies[0])
// The company is part of the sign-in (tenant in the token), so switching = sign out, pick
// another company, sign in again.
const switchCompany = async () => {
  const ok = await confirm({
    title: 'Switch company?',
    message: `You'll be signed out of ${company.value}, then you can pick another company and sign in.`,
    confirmText: 'Sign out & switch', tone: 'primary', icon: 'people'
  })
  if (ok) navigateTo('/company-select')
}
const unread = computed(() => notifications.value.filter(n => n.unread).length)
// Approvals (Pending / Approved Records / Approved Requests) only shows for approvers.
const { canApprove } = useApprovals()
// Sidebar sections (like v1's MENU / RECORD-REQUEST / APPS headings).
const navGroups = [
  { title: 'Menu', items: [{ to: '/', label: 'Home', icon: 'home' }] },
  {
    title: 'My records',
    items: [
      { to: '/requests', label: 'Requests', icon: 'requests' },
      { to: '/leave-hours', label: 'Leave Hours', icon: 'hourglass' },
      { to: '/payroll', label: 'Payslip', icon: 'wallet', also: ['/timesheet'] }
    ]
  },
  {
    title: 'Team',
    items: [
      { to: '/whos-out', label: "Who's Out", icon: 'calendar' },
      { to: '/directory', label: 'Directory', icon: 'people' }
    ]
  },
  canApprove && { title: 'Approver', items: [{ to: '/approvals', label: 'Approvals', icon: 'check' }] },
  // Other Ardent apps (open in a new tab).
  { title: 'Apps', items: [{ to: 'https://ticket.ardentnetworks.com.ph/login', label: 'Ticket', icon: 'ticket', external: true }] }
].filter(Boolean)
const nav = navGroups.flatMap(g => g.items)
const footNav = [
  { to: '/support', label: 'Support', icon: 'bell' },
  { to: '/privacy-policy', label: 'Privacy Policy', icon: 'shield' }
]
const route = useRoute()
const isActive = (to) => to === '/' ? route.path === '/' : [to, ...(nav.find(n => n.to === to)?.also || [])].some(p => route.path.startsWith(p))
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
}
aside {
  width: 252px;
  flex-shrink: 0;
  background: var(--grad-navy);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1.4rem 0.9rem 1.1rem;
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  /* Zoomed in or a short window: the menu scrolls instead of being cut off. */
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}
aside::-webkit-scrollbar { width: 6px; }
aside::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.18); border-radius: 6px; }
aside::after {
  content: "";
  position: absolute;
  width: 260px;
  height: 260px;
  right: -130px;
  bottom: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 89, 105, 0.22),
    transparent 70%
  );
  pointer-events: none;
}
.brand {
  padding: 0 0.6rem 1.6rem;
}
.nav-label {
  font-size: 0.65rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
  padding: 0 0.8rem 0.5rem;
  font-weight: 700;
}
nav .nav-label {
  padding-bottom: 0.3rem;
}
nav .nav-label:not(:first-child) {
  margin-top: 0.9rem;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  position: relative;
  z-index: 1;
}
nav a {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.68);
  padding: 0.68rem 0.85rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.88rem;
  transition:
    background 0.15s,
    color 0.15s;
}
nav a .ext {
  margin-left: auto;
  opacity: 0.5;
}
nav a:hover .ext {
  opacity: 0.9;
}
nav a:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
nav a.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
nav a.active .ico {
  background: var(--grad-brand);
  color: #fff;
  box-shadow: 0 6px 14px -4px rgba(255, 89, 105, 0.6);
}
.ico {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.15s;
}
.foot {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
  z-index: 1;
}
.foot {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.8rem;
  gap: 0.15rem !important;
}
.flink {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.15s;
}
.flink:hover,
.flink.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.tag {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.32);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0 0.7rem;
}
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
header.hidden {
  transform: translateY(-100%);
}
header:focus-within {
  transform: none;
}
header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 2rem;
  background: #fff;
  border-bottom: 1px solid var(--border);
  /* Pinned, but slides away while scrolling down and returns on scroll up. */
  position: sticky;
  top: 0;
  transition: transform 0.25s ease, box-shadow 0.2s;
  z-index: 10;
}
.company {
  margin-left: auto;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: #fdecef;
  color: var(--ardent-red);
  font-size: 0.78rem;
  font-weight: 700;
  max-width: 240px;
}
.company span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.company:hover {
  background: #fbdde2;
}
.bell {
  position: relative;
  color: var(--text);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--border);
}
.bell:hover {
  box-shadow: var(--shadow);
}
.bell i {
  position: absolute;
  top: -3px;
  right: -3px;
  background: var(--ardent-alert);
  color: #fff;
  font:
    700 0.62rem Montserrat,
    sans-serif;
  font-style: normal;
  min-width: 18px;
  height: 18px;
  border-radius: 99px;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
}
.acct {
  position: relative;
}
.user {
  display: grid;
  place-items: center;
  padding: 3px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.user:hover,
.user[aria-expanded="true"] {
  border-color: rgba(198, 50, 76, 0.35);
}
.menu-pop {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 230px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  padding: 0.4rem;
  z-index: 30;
}
.menu-pop .who {
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0.7rem 0.7rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}
.menu-pop .who small {
  color: var(--muted);
  font-size: 0.72rem;
}
.menu-pop a,
.menu-pop button {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  font: 500 0.85rem 'Montserrat', sans-serif;
  text-align: left;
  cursor: pointer;
}
.menu-pop a:hover,
.menu-pop button:hover {
  background: #f4f5f7;
}
.menu-pop .danger {
  color: var(--ardent-red);
}
.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 0.12s,
    transform 0.12s;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--grad-brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
}
.avatar { overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar.sm {
  width: 32px;
  height: 32px;
}
main {
  padding: 1.5rem 2rem 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}
/* Content starts right after the sidebar and uses the full width (no centered gap).
   It also fills the screen height, so a Pager (margin-top: auto) sits at the bottom
   and does not move when a page has fewer rows or none. */
.wrap {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.wrap > :deep(*) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.menu {
  display: none;
  background: none;
  border: 0;
  font-size: 1.4rem;
  color: var(--text);
  cursor: pointer;
}
.scrim {
  display: none;
}
/* Short windows (or browser zoom): tighter sidebar so more of it fits before scrolling. */
@media (max-height: 760px) {
  aside { padding-top: 1rem; }
  .brand { padding-bottom: 1rem; }
  nav a { padding: 0.5rem 0.85rem; }
  .ico { width: 26px; height: 26px; }
  nav .nav-label:not(:first-child) { margin-top: 0.6rem; }
  .flink { padding: 0.4rem 0.85rem; }
}
@media (max-width: 860px) {
  aside {
    position: fixed;
    left: 0;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
  }
  aside.open {
    transform: none;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(19, 51, 65, 0.4);
    backdrop-filter: blur(2px);
    z-index: 15;
  }
  .menu {
    display: block;
  }
  header {
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
  }
  .company {
    padding: 0;
    width: 38px;
    height: 38px;
    justify-content: center;
    flex-shrink: 0;
  }
  .company > :last-child {
    display: none;
  }
  .bell {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
  }
  .acct {
    flex-shrink: 0;
  }
  .menu {
    flex-shrink: 0;
    padding: 0 0.25rem;
  }
  .company span {
    display: none;
  }
  main {
    padding: 1rem 1rem 2rem;
  }
}
</style>
