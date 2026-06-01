const ROOT = document.getElementById("app");
const PAGE = document.body.dataset.page || "landing";

const ROUTES = {
  landing: "landing.html",
  userHome: "user-home.html",
  userProfile: "user-profile.html",
  userAppointments: "user-appointments.html",
  userRewards: "user-rewards.html",
  adminLogin: "admin-login.html",
  adminDashboard: "admin-dashboard.html",
  adminDonors: "admin-donors.html",
  adminBloodCentres: "admin-blood-centres.html",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function icon(name, className = "icon icon--sm") {
  return `<svg class="${className}" aria-hidden="true"><use href="icons.svg#${name}"></use></svg>`;
}

function moneyish(value) {
  return String(value).replace(/ /g, "&nbsp;");
}

function bloodTone(status) {
  if (status === "critical" || status === "Critical") return "critical";
  if (status === "low" || status === "Low") return "low";
  return "good";
}

function bloodPillLabel(status) {
  if (status === "critical") return "Critical";
  if (status === "low") return "Low";
  return "Adequate";
}

function metricTrendClass(tone) {
  if (tone === "crit") return "metric-card__trend--crit";
  if (tone === "warn") return "metric-card__trend--warn";
  return "metric-card__trend--up";
}

function centerToneDot(tone) {
  if (tone === "critical") return "background:#ff4d4d;";
  if (tone === "low") return "background:#ffcf62;";
  return "background:#28c96f;";
}

function profileSidebar(active, profile) {
  const items = [
    { href: ROUTES.userHome, label: "Dashboard", iconName: "menu", key: "userHome" },
    { href: ROUTES.userProfile, label: "My Profile", iconName: "user", key: "userProfile" },
    { href: ROUTES.userAppointments, label: "Appointment", iconName: "calendar", key: "userAppointments" },
    { href: ROUTES.userRewards, label: "Rewards", iconName: "star", key: "userRewards" },
  ];

  return `
    <aside class="sidebar">
      <div class="sidebar__top">
        <a class="sidebar__brand" href="${ROUTES.landing}">
          <span class="brand__mark">${icon("droplet")}</span>
          <span class="brand__text">
            <strong class="brand__title">BloodLine</strong>
            <span class="brand__sub">DONOR PORTAL</span>
          </span>
        </a>
      </div>
      <nav class="nav-list" aria-label="Sidebar navigation">
        <div class="nav-section">Main</div>
        ${items
          .map(
            (item) => `
              <a class="nav-item ${active === item.key ? "is-active" : ""}" href="${item.href}">
                ${icon(item.iconName)}
                <span>${item.label}</span>
              </a>
            `,
          )
          .join("")}
      </nav>
      <div class="sidebar__foot">
        <div class="avatar">${esc(profile.initials)}</div>
        <div>
          <div class="sidebar__name">${esc(profile.name)}</div>
          <div class="sidebar__meta">Donor - ${esc(profile.bloodType)}</div>
        </div>
      </div>
    </aside>
  `;
}

function adminSidebar(active, centreName) {
  const items = [
    { href: ROUTES.adminDashboard, label: "Dashboard", iconName: "menu", key: "adminDashboard" },
    { href: ROUTES.adminDonors, label: "Donors", iconName: "user", key: "adminDonors" },
    { href: ROUTES.adminBloodCentres, label: "Blood Centres", iconName: "location", key: "adminBloodCentres" },
  ];

  return `
    <aside class="sidebar">
      <div class="sidebar__top">
        <a class="sidebar__brand" href="${ROUTES.landing}">
          <span class="brand__mark">${icon("droplet")}</span>
          <span class="brand__text">
            <strong class="brand__title">BloodLine</strong>
            <span class="brand__sub">DONATION CENTRE PORTAL</span>
          </span>
        </a>
      </div>
      <div class="sidebar__panel">
        <div class="sidebar__lead">Blood Bank Staff Access</div>
        <div class="sidebar__copy">Update blood inventory levels in real time. Your inputs directly affect national donor routing.</div>
      </div>
      <nav class="nav-list" aria-label="Sidebar navigation">
        <div class="nav-section">Main</div>
        ${items
          .map(
            (item) => `
              <a class="nav-item ${active === item.key ? "is-active" : ""}" href="${item.href}">
                ${icon(item.iconName)}
                <span>${item.label}</span>
              </a>
            `,
          )
          .join("")}
        <div class="nav-section">Systems</div>
        <a class="nav-item" href="#"><span style="display:inline-flex">${icon("edit")}</span><span>Settings</span></a>
      </nav>
      <div class="sidebar__foot">
        <div class="avatar">OP</div>
        <div>
          <div class="sidebar__name">${esc(centreName)}</div>
          <div class="sidebar__meta">Centre Admin</div>
        </div>
      </div>
    </aside>
  `;
}

function renderBloodPublicCard(item) {
  return `
    <article class="inventory-card">
      <div class="inventory-card__top">
        <div class="blood-type">${esc(item.type)}</div>
        <span class="status-chip status-chip--${bloodTone(item.status)}">${esc(bloodPillLabel(item.status))}</span>
      </div>
      <div class="progress">
        <div class="progress__fill progress__fill--${bloodTone(item.status)}" style="width:${Number(item.pct)}%"></div>
      </div>
      <div class="inventory-card__foot">${esc(item.label)}</div>
    </article>
  `;
}

function renderBloodRow(item, unitsSuffix = "") {
  const tone = bloodTone(item.status);
  return `
    <div class="blood-row">
      <div class="blood-row__label">${esc(item.type)}</div>
      <div>
        <span class="pill pill--${tone === "good" ? "green" : tone === "low" ? "orange" : "rose"}">${esc(bloodPillLabel(item.status))}</span>
        <div class="blood-row__track">
          <div class="blood-row__fill progress__fill--${tone}" style="width:${Number(item.pct)}%"></div>
        </div>
      </div>
      <div class="source-chip">${esc(item.label)}${unitsSuffix}</div>
    </div>
  `;
}

function renderLoading(message = "Loading BloodLine...") {
  ROOT.innerHTML = `
    <main class="app" style="display:grid; place-items:center; min-height:100vh;">
      <div class="card" style="padding:24px 28px; width:min(420px, calc(100% - 32px)); text-align:center;">
        <div style="display:flex; justify-content:center; margin-bottom:12px;">${icon("droplet", "icon")}</div>
        <div style="font-weight:800; font-size:1.2rem;">${esc(message)}</div>
      </div>
    </main>
  `;
}

function renderError(error) {
  ROOT.innerHTML = `
    <main class="app" style="display:grid; place-items:center; min-height:100vh; padding:20px;">
      <div class="card" style="padding:24px 28px; width:min(620px, calc(100% - 32px));">
        <div class="alert-tag" style="margin-bottom:12px;">Unable to load page</div>
        <h1 style="margin:0 0 8px;">The BloodLine app could not load data from the server.</h1>
        <p style="margin:0; color:#6b615e;">${esc(error?.message || error)}</p>
      </div>
    </main>
  `;
}

async function getJson(url, options) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: options?.headers || {},
    ...options,
  });
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }
  return response.json();
}

async function loadPageData(page) {
  if (page === "landing") {
    const [landing, inventory] = await Promise.all([getJson("/api/landing"), getJson("/api/inventory")]);
    return { ...landing, inventory };
  }

  if (page === "userHome" || page === "userProfile" || page === "userAppointments" || page === "userRewards") {
    const [donor, inventory] = await Promise.all([getJson("/api/donor"), getJson("/api/inventory")]);
    return { donor, inventory };
  }

  if (page === "adminLogin") {
    return getJson("/api/admin");
  }

  if (page === "adminDashboard" || page === "adminDonors" || page === "adminBloodCentres") {
    const [admin, inventory] = await Promise.all([getJson("/api/admin"), getJson("/api/inventory")]);
    return { admin, inventory };
  }

  return {};
}

function renderLanding(data) {
  const landing = data.landingPage;
  const inventory = data.inventory.public || [];

  ROOT.innerHTML = `
    <div class="landing">
      <header class="landing-topbar">
        <div class="landing-topbar__inner">
          <a class="brand" href="${ROUTES.landing}">
            <span class="brand__mark">${icon("droplet")}</span>
            <span class="brand__text">
              <strong class="brand__title">BloodLine</strong>
              <span class="brand__sub">DONOR PORTAL</span>
            </span>
          </a>
          <nav class="landing-nav" aria-label="Primary">
            ${landing.navLinks
              .map((link) => `<a href="${link.href}">${esc(link.label)}</a>`)
              .join("")}
          </nav>
          <a class="primary-button" href="${ROUTES.userHome}">${icon("user")} Login with Singpass</a>
        </div>
      </header>

      <main class="landing-wrap">
        <section class="hero">
          <div class="hero__alert">${icon("warning")} ${esc(landing.heroAlert)}</div>
          <h1 class="hero__title">${esc(landing.heroTitle)}</h1>
          <p class="hero__lede">${esc(landing.heroLede)}</p>
          <div class="hero__actions">
            <a class="ghost-button ghost-button--dark" href="${ROUTES.userHome}">${icon("shield")} Login with Singpass</a>
            <a class="ghost-button ghost-button--dark" href="#inventory">${icon("arrow-right")} Check blood supply</a>
          </div>
          <div class="landing-stats">
            ${landing.stats
              .map(
                (stat) => `
                  <div class="landing-stat">
                    <span class="landing-stat__value">${esc(stat.value)}</span>
                    <span class="landing-stat__label">${esc(stat.label)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="landing-section" id="inventory">
          <div class="section-label">Live inventory</div>
          <h2 class="section-title">${esc(landing.inventoryHeading)}</h2>
          <p class="section-subtitle">${esc(landing.inventorySubheading)}</p>
          <div class="inventory-grid">
            ${inventory.map(renderBloodPublicCard).join("")}
          </div>
        </section>

        <section class="landing-section" id="how">
          <div class="section-label">How it works</div>
          <h2 class="section-title">${esc(landing.workflowHeading)}</h2>
          <p class="section-subtitle">${esc(landing.workflowSubheading)}</p>
          <div class="workflow">
            <div class="workflow-track">
              <div class="workflow-dot">1</div>
              <div class="workflow-arrow">&#8594;</div>
              <div class="workflow-dot">2</div>
              <div class="workflow-arrow">&#8594;</div>
              <div class="workflow-dot">3</div>
              <div class="workflow-arrow">&#8594;</div>
              <div class="workflow-dot">4</div>
            </div>
            <div class="steps">
              ${landing.steps
                .map(
                  (step) => `
                    <div class="step">
                      <h3>${esc(step.title)}</h3>
                      <p>${esc(step.body)}</p>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
        </section>

        <section class="cta-band" id="banks">
          <div class="section-label" style="margin-bottom:4px;">${esc(landing.cta.eyebrow)}</div>
          <h2 class="cta-band__title">${esc(landing.cta.title)}</h2>
          <p class="section-subtitle">${esc(landing.cta.body)}</p>
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <a class="ghost-button ghost-button--dark" href="${ROUTES.userHome}">${icon("shield")} Login with Singpass</a>
            <a class="ghost-button ghost-button--dark" href="${ROUTES.adminLogin}">Blood bank login</a>
          </div>
        </section>

        <footer class="footer">
          <div class="footer__brand">
            <span class="brand__mark" style="width:24px;height:24px">${icon("droplet")}</span>
            <div>
              <strong>BloodLine</strong>
              <div class="brand__sub" style="color:#8e8079">DONOR PORTAL</div>
            </div>
          </div>
          <div>${esc(landing.footer)}</div>
        </footer>
      </main>
    </div>
  `;
}

function renderUserHome(data) {
  const donor = data.donor.profile;
  const inventory = data.inventory.public;
  const appointments = data.donor.appointments;
  const contacts = data.donor.contacts;
  const travel = data.donor.travel;
  const date = data.donor.ui?.date || "Tuesday, 20 May 2026";
  const critical = inventory.find((item) => item.type === donor.bloodType) || inventory[0];

  ROOT.innerHTML = `
    <div class="shell">
      ${profileSidebar("userHome", donor)}
      <main class="content">
        <div class="content__inner">
          <div class="page-head">
            <div>
              <h1 class="page-head__title">Good Morning, ${esc(donor.name.split(" ")[0])}</h1>
              <div class="page-head__date">${esc(date)}</div>
            </div>
            <div class="page-head__actions">
              <button class="lang-button">${icon("lang")} English ${icon("arrow-right")}</button>
            </div>
          </div>

          <div class="alert-card card">
            <div class="alert-card__icon">${icon("warning", "icon")}</div>
            <div>
              <h2 class="alert-card__title">CRITICAL ALERT</h2>
              <p class="alert-card__text">${esc(donor.bloodType)} blood is at ${esc(critical.pct)}% capacity nationally. Your blood type is urgently needed. You will be issued a Dynamic Fast-Pass for your next visit.</p>
            </div>
            <a class="primary-button" href="${ROUTES.userAppointments}">Schedule Now</a>
          </div>

          <div class="grid-4">
            <article class="metric-card card">
              <div class="metric-card__label">TOTAL DONATIONS</div>
              <div class="metric-card__value">${esc(donor.donations)}</div>
              <div class="metric-card__trend ${metricTrendClass("up")}">${icon("check")} +2 this year</div>
            </article>
            <article class="metric-card card">
              <div class="metric-card__label">YOUR BLOOD TYPE</div>
              <div class="metric-card__value">${esc(donor.bloodType)}</div>
              <div class="metric-card__trend ${metricTrendClass("crit")}">${icon("alert")} Critical nationally</div>
            </article>
            <article class="metric-card card">
              <div class="metric-card__label">REWARD POINTS</div>
              <div class="metric-card__value">${esc(donor.points.toLocaleString("en-SG"))}</div>
              <div class="metric-card__trend ${metricTrendClass("up")}">${icon("check")} +200 last visit</div>
            </article>
            <article class="metric-card card">
              <div class="metric-card__label">NEXT ELIGIBLE</div>
              <div class="metric-card__value">${esc(donor.nextEligible)}</div>
              <div class="metric-card__trend ${metricTrendClass("up")}">${icon("check")} Cleared to donate</div>
            </article>
          </div>

          <div class="portal-grid">
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">National Blood Supply</h2>
                  <div class="portal-card__subtitle">Live inventory across all centres</div>
                </div>
                <span class="pill pill--rose">LIVE</span>
              </div>
              <div class="blood-list">
                ${inventory
                  .map((item) => renderBloodRow(item))
                  .join("")}
              </div>
            </article>

            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Appointments</h2>
                  <div class="portal-card__subtitle">Upcoming & past sessions</div>
                </div>
                <a class="pill pill--rose" href="${ROUTES.userAppointments}">+ New</a>
              </div>
              <div class="appointments">
                ${appointments
                  .map(
                    (item) => `
                      <div class="appointment-row">
                        <div class="date-box ${item.state === "done" ? "date-box--muted" : ""}">${esc(item.date)}<span>${esc(item.month)}</span></div>
                        <div>
                          <div class="appointment-row__title">${esc(item.title)}</div>
                          <div class="appointment-row__meta">${esc(item.type)} ${item.state === "active" ? "Express" : ""}</div>
                          <div class="appointment-row__meta">${icon("calendar")} ${esc(item.time)} - ${esc(item.meta)}</div>
                        </div>
                        <span class="pill ${item.state === "active" ? "pill--rose" : "pill--green"}">${esc(item.status)}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          </div>

          <div class="portal-grid">
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Emergency Contact</h2>
                  <div class="portal-card__subtitle">Name - Relationship - Contact Number</div>
                </div>
              </div>
              <div class="contact-list">
                ${contacts
                  .map(
                    (item, index) => `
                      <div class="contact-item">
                        <div>
                          <div class="contact-item__name">${index + 1}. ${esc(item.name)}</div>
                          <div class="contact-item__meta">${esc(item.relation)}</div>
                          <div class="contact-item__meta">${esc(item.number)}</div>
                        </div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Travel History</h2>
                  <div class="portal-card__subtitle">Past 4 months - affects eligibility</div>
                </div>
                <span class="pill pill--rose">+ Add trip</span>
              </div>
              <div class="contact-list">
                ${travel
                  .map(
                    (item) => `
                      <div class="contact-item">
                        <div>
                          <div class="contact-item__name">${esc(item.country)} - ${esc(item.city)}</div>
                          <div class="contact-item__meta">${esc(item.note)}</div>
                          <div class="contact-item__meta">${esc(item.sub)}</div>
                        </div>
                        <span class="pill pill--green">${esc(item.status)}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderUserProfile(data) {
  const donor = data.donor.profile;
  const contacts = data.donor.contacts;
  const donations = data.donor.profile.donations;
  const date = data.donor.ui?.date || "Tuesday, 20 May 2026";
  const tier = donor.points >= 3000 ? "Platinum" : donor.points >= 2000 ? "Gold" : "Silver";

  ROOT.innerHTML = `
    <div class="shell">
      ${profileSidebar("userProfile", donor)}
      <main class="content">
        <div class="content__inner">
          <div class="page-head">
            <div>
              <h1 class="page-head__title">My Profile</h1>
              <div class="page-head__date">${esc(date)}</div>
            </div>
            <div class="page-head__actions">
              <button class="primary-button">${icon("edit")} Edit Profile</button>
            </div>
          </div>

          <article class="card donor-profile-card">
            <div class="donor-profile-card__top">
              <div class="avatar-lg">${esc(donor.initials)}</div>
              <div>
                <h2 class="donor-profile-card__name">${esc(donor.fullName)}</h2>
                <div class="donor-profile-card__id">Donor ID · ${esc(donor.id)}</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
                  <span class="pill pill--rose">${esc(donor.bloodType)}</span>
                  <span class="pill pill--green">Eligible to donate</span>
                </div>
              </div>
              <div style="text-align:right;">
                <div>Singpass verified</div>
                <div style="display:inline-flex; align-items:center; gap:6px; color:var(--good); margin-top:8px;">${icon("check")} verified</div>
              </div>
            </div>

            <div class="info-rows">
              <div class="info-row">
                <div>${icon("user")}</div>
                <div class="info-row__label">NRIC</div>
                <div class="info-row__value">${esc(donor.nric)}</div>
              </div>
              <div class="info-row">
                <div>${icon("calendar")}</div>
                <div class="info-row__label">Date of birth</div>
                <div class="info-row__value">${esc(donor.dob)} <span style="color:#6b6b6b; font-weight:600;">· Age ${esc(donor.age)}</span></div>
              </div>
              <div class="info-row">
                <div>${icon("phone")}</div>
                <div class="info-row__label">Mobile</div>
                <div class="info-row__value">${esc(donor.mobile)}</div>
              </div>
              <div class="info-row">
                <div>${icon("mail")}</div>
                <div class="info-row__label">Email</div>
                <div class="info-row__value"><a href="mailto:${esc(donor.email)}" style="text-decoration:underline;">${esc(donor.email)}</a></div>
              </div>
              <div class="info-row">
                <div>${icon("pin")}</div>
                <div class="info-row__label">Address</div>
                <div class="info-row__value">${esc(donor.address)}</div>
              </div>
            </div>

            <div class="mini-note">
              <div>${icon("shield")}</div>
              <div>NRIC and date of birth are pulled from Singpass and cannot be edited</div>
            </div>
          </article>

          <div class="portal-grid">
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Medical Details</h2>
                  <div class="portal-card__subtitle">Donor information</div>
                </div>
              </div>
              <div class="info-rows" style="margin-top:14px;">
                <div class="info-row">
                  <div>${icon("droplet")}</div>
                  <div class="info-row__label">Blood type</div>
                  <div class="info-row__value"><span class="pill pill--rose">${esc(donor.bloodType)}</span></div>
                </div>
                <div class="info-row">
                  <div>${icon("user")}</div>
                  <div class="info-row__label">Weight</div>
                  <div class="info-row__value">${esc(donor.weight)}</div>
                </div>
                <div class="info-row">
                  <div>${icon("calendar")}</div>
                  <div class="info-row__label">Last Hb reading</div>
                  <div class="info-row__value">${esc(donor.lastHb)} <div style="font-size:0.82rem; font-weight:500; color:#6e6e6e;">${esc(donor.lastHbMeta)}</div></div>
                </div>
              </div>
              <div class="mini-note">
                <div>${icon("shield")}</div>
                <div>Hb is recorded by donation centre staff after each visit</div>
              </div>
            </article>

            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Donation Summary</h2>
                  <div class="portal-card__subtitle">Lifetime giving record</div>
                </div>
              </div>
              <div class="info-rows" style="margin-top:14px;">
                <div class="info-row">
                  <div>${icon("droplet")}</div>
                  <div class="info-row__label">Total donations</div>
                  <div class="info-row__value">${esc(donations)}</div>
                </div>
                <div class="info-row">
                  <div>${icon("calendar")}</div>
                  <div class="info-row__label">First donation</div>
                  <div class="info-row__value">6 Jan 2019</div>
                </div>
                <div class="info-row">
                  <div>${icon("calendar")}</div>
                  <div class="info-row__label">Last donation</div>
                  <div class="info-row__value">4 Mar 2026</div>
                </div>
                <div class="info-row">
                  <div>${icon("calendar")}</div>
                  <div class="info-row__label">Next eligible</div>
                  <div class="info-row__value" style="color:var(--good);">Today</div>
                </div>
              </div>
              <div class="reward-banner" style="margin-top:10px; background:#f5f5f5; border-radius:10px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="display:flex; gap:10px; align-items:center;">
                  <span style="font-size:1.2rem;">${icon("star", "icon")}</span>
                  <div>
                    <strong>${esc(donor.points.toLocaleString("en-SG"))} points · ${esc(tier)} tier</strong>
                    <div>View full rewards</div>
                  </div>
                </div>
                ${icon("arrow-right")}
              </div>
            </article>
          </div>

          <article class="portal-card card" style="margin-top:18px;">
            <div class="portal-card__head">
              <div>
                <h2 class="portal-card__title">Emergency Contacts</h2>
                <div class="portal-card__subtitle">Name · Relationship · Contact Number</div>
              </div>
              <span class="pill pill--rose">+ Add</span>
            </div>
            <div class="contact-list">
              ${contacts
                .map(
                  (item) => `
                    <div class="contact-item">
                      <div>
                        <div class="contact-item__name">${esc(item.name)}</div>
                        <div class="contact-item__meta">${esc(item.relation)} · ${esc(item.number)}</div>
                      </div>
                      <div style="display:flex; gap:14px; color:#3b3b3b;">
                        ${icon("edit")}
                        ${icon("trash")}
                      </div>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </article>
        </div>
      </main>
    </div>
  `;
}

function renderUserAppointments(data) {
  const donor = data.donor.profile;
  const page = data.donor.appointmentsPage || {};
  const options = page.options || [];
  const current = page.selectedCentre || "Bloodbank@One Punggol";
  const first = data.donor.appointments[0];

  ROOT.innerHTML = `
    <div class="shell">
      ${profileSidebar("userAppointments", donor)}
      <main class="content">
        <div class="content__inner">
          <div class="appointment-shell">
            <article class="card location-card">
              <div class="location-card__top">
                <div>
                  <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    ${icon("pin")}
                    <h2 style="margin:0; font-size:1.3rem;">${esc(page.locationLabel || "Location")}</h2>
                  </div>
                  <select class="select-field" aria-label="Blood centre">
                    ${options
                      .map((option) => `<option ${option === current ? "selected" : ""}>${esc(option)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="map-preview" aria-hidden="true"></div>
              </div>
            </article>

            <article class="card availability-card">
              <div class="availability-card__top">
                <h2 style="margin:0; font-size:1.15rem;">${esc(page.availabilityLabel || "Pick Availability")}</h2>
                <span class="alert-tag">${esc(page.fastPassLabel || "Fast Pass")}</span>
              </div>
              <div class="availability-band">
                <div>
                  <label style="display:block; font-weight:700; margin-bottom:8px;">Date:</label>
                  <select class="select-field" aria-label="Date">
                    <option selected>${esc(page.dateLabel || first.date + " " + first.month)}</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-weight:700; margin-bottom:8px;">Time Range:</label>
                  <select class="select-field" aria-label="Time range">
                    <option selected>${esc(page.timeRangeLabel || first.time.replace(" - ", " - "))}</option>
                  </select>
                </div>
              </div>
              <div class="availability-actions">
                <button class="small-ghost" type="button">${esc(page.cancelLabel || "Cancel")}</button>
                <button class="pill pill--green" type="button" id="appointment-confirm">${esc(page.confirmLabel || "Confirm")}</button>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  `;

  const button = document.getElementById("appointment-confirm");
  if (button) {
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Saving...";
      try {
        await getJson("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            centre: current,
            time: page.timeRangeLabel || first.time,
            bloodType: donor.bloodType,
          }),
        });
        button.textContent = "Confirmed";
      } catch (error) {
        button.disabled = false;
        button.textContent = "Confirm";
        alert(error.message);
      }
    });
  }
}

function renderUserRewards(data) {
  const donor = data.donor.profile;
  const rewards = data.donor.rewards;
  const date = data.donor.ui?.date || "Tuesday, 20 May 2026";
  const points = donor.points;
  const tier = points >= 3000 ? "Platinum" : points >= 2000 ? "Gold" : "Silver";
  const progress = Math.min(100, Math.round((points / 3000) * 100));

  ROOT.innerHTML = `
    <div class="shell">
      ${profileSidebar("userRewards", donor)}
      <main class="content">
        <div class="content__inner">
          <div class="page-head">
            <div>
              <h1 class="page-head__title">Rewards</h1>
              <div class="page-head__date">${esc(date)}</div>
            </div>
          </div>

          <article class="card rewards-card">
            <div class="rewards-summary">
              <div class="award-badge">${icon("star", "icon")}</div>
              <div>
                <h2 style="margin:0; font-size:1.15rem;">Gold tier</h2>
                <div style="color:#9a9390;">${esc(points.toLocaleString("en-SG"))} pts · 600 pts to Platinum</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:2.2rem; font-weight:800; line-height:1;">${esc(points.toLocaleString("en-SG"))}</div>
                <div style="color:#9a9390;">available points</div>
              </div>
            </div>
            <div class="progress" style="margin-top:20px;">
              <div class="progress__fill progress__fill--good" style="width:${progress}%"></div>
            </div>
            <div class="progress-labels">
              <div>Gold · 2,000 pts</div>
              <div>Platinum · 3,000 pts</div>
            </div>
            <div class="grid-4" style="margin-top:22px;">
              <article class="metric-card card"><div class="metric-card__value" style="font-size:2rem;">${esc(donor.donations)}</div><div class="metric-card__label" style="margin-top:4px; text-transform:none; font-size:1rem; color:#222; font-weight:500;">donations</div></article>
              <article class="metric-card card"><div class="metric-card__value" style="font-size:2rem;">+200</div><div class="metric-card__label" style="margin-top:4px; text-transform:none; font-size:1rem; color:#222; font-weight:500;">pts per visit</div></article>
              <article class="metric-card card"><div class="metric-card__value" style="font-size:2rem;">${esc(tier)}</div><div class="metric-card__label" style="margin-top:4px; text-transform:none; font-size:1rem; color:#222; font-weight:500;">current tier</div></article>
              <article class="metric-card card"><div class="metric-card__value" style="font-size:2rem;">${esc(progress)}%</div><div class="metric-card__label" style="margin-top:4px; text-transform:none; font-size:1rem; color:#222; font-weight:500;">to Platinum</div></article>
            </div>
          </article>

          <div class="rewards-columns">
            <article class="card rewards-card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Redeem Vouchers</h2>
                  <div class="portal-card__subtitle">Use points for partner rewards</div>
                </div>
              </div>
              <div class="voucher-list">
                ${rewards.vouchers
                  .map(
                    (voucher) => `
                      <div class="voucher-item">
                        <div style="display:grid; grid-template-columns:64px minmax(0,1fr); gap:12px; align-items:center;">
                          <div class="voucher-item__logo">${esc(voucher.logo)}</div>
                          <div>
                            <div class="voucher-item__name">${esc(voucher.name)}</div>
                            <div class="voucher-item__meta">${esc(voucher.meta)}</div>
                          </div>
                        </div>
                        <button class="small-ghost" type="button">Redeem</button>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
              <div style="display:flex; justify-content:center; padding-top:10px;">${icon("arrow-right")}</div>
            </article>

            <article class="card rewards-card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Donation Milestones</h2>
                  <div class="portal-card__subtitle">Badges earned across your journey</div>
                </div>
              </div>
              <div class="milestone-list">
                ${rewards.milestones
                  .map((milestone) => {
                    const iconName = milestone.icon === "drop" ? "droplet" : milestone.icon;
                    return `
                      <div class="milestone-item">
                        <div style="display:grid; grid-template-columns:64px minmax(0,1fr); gap:12px; align-items:center;">
                          <div class="milestone-item__icon">${icon(iconName)}</div>
                          <div>
                            <div class="milestone-item__name">${esc(milestone.name)}</div>
                            <div class="milestone-item__meta">${esc(milestone.meta)}</div>
                          </div>
                        </div>
                        <span class="pill ${milestone.status === "Earned" ? "pill--green" : "pill--grey"}">${esc(milestone.status)}</span>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
              <div style="display:flex; justify-content:center; padding-top:10px;">${icon("arrow-right")}</div>
            </article>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderAdminLogin(data) {
  const page = data.loginPage || {};
  const centres = page.centres || [];

  ROOT.innerHTML = `
    <div class="admin-login">
      <aside class="admin-login__panel">
        <a class="brand" href="${ROUTES.landing}" style="align-self:flex-start;">
          <span class="brand__mark">${icon("droplet")}</span>
          <span class="brand__text">
            <strong class="brand__title">BloodLine</strong>
            <span class="brand__sub">DONATION CENTRE PORTAL</span>
          </span>
        </a>
        <h2>${esc(page.headline || "Blood Bank Staff Access")}</h2>
        <p>${esc(page.body || "Update blood inventory levels in real time. Your inputs directly affect national donor routing.")}</p>
        <div class="centre-list">
          <strong>BLOOD CENTRES</strong>
          <ul>
            ${centres
              .map(
                (centre) => `
                  <li>
                    <span class="dot dot--${centre.tone === "critical" ? "red" : centre.tone === "low" ? "yellow" : "green"}"></span>
                    ${esc(centre.name || centre)}
                  </li>
                `,
              )
              .join("")}
          </ul>
        </div>
      </aside>
      <main class="admin-login__content">
        <a class="back-circle" href="${ROUTES.landing}" aria-label="Back to landing">${icon("arrow-left")}</a>
        <form class="admin-form card" id="admin-login-form">
          <h1>${esc(page.title || "Sign in")}</h1>
          <p>${esc(page.subtitle || "Select your blood centre and enter your password")}</p>

          <div class="field">
            <label for="admin-centre">${esc(page.centreLabel || "Blood centre")}</label>
            <select id="admin-centre" class="select-field" name="centre">
              ${centres
                .map((centre) => `<option>${esc(centre.name || centre)}</option>`)
                .join("")}
            </select>
          </div>

          <div class="field field--password">
            <label for="admin-password">${esc(page.passwordLabel || "Password")}</label>
            <input id="admin-password" class="text-field" name="password" type="password" value="************" />
            <button class="field__button" type="button" aria-label="Show password">${icon("eye")}</button>
          </div>

          <button class="form-button" type="submit">${esc(page.submitLabel || "Sign in to admin portal")}</button>
        </form>
      </main>
    </div>
  `;

  const form = document.getElementById("admin-login-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const centre = new FormData(form).get("centre");
      const password = new FormData(form).get("password");
      try {
        await getJson("/api/auth/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ centre, password }),
        });
        window.location.href = ROUTES.adminDashboard;
      } catch (error) {
        alert(error.message);
      }
    });
  }
}

function renderAdminDashboard(data) {
  const admin = data.admin;
  const inventory = data.inventory.admin;
  const date = data.admin.ui?.date || "Tuesday, 20 May 2026";

  ROOT.innerHTML = `
    <div class="shell">
      ${adminSidebar("adminDashboard", admin.centre)}
      <main class="content">
        <div class="content__inner">
          <div class="page-head">
            <div>
              <h1 class="page-head__title">Good Morning</h1>
              <div class="page-head__date">${esc(date)}</div>
            </div>
          </div>

          <div class="alert-card card">
            <div class="alert-card__icon">${icon("warning", "icon")}</div>
            <div>
              <h2 class="alert-card__title">${esc(admin.alert?.title || "CRITICAL ALERT")}</h2>
              <p class="alert-card__text">${esc(admin.alert?.text || "O- blood is at 8% capacity nationally - 3 Fast-Passes auto-issued")}</p>
            </div>
          </div>

          <div class="grid-4">
            ${admin.dashboard
              .map(
                (item) => `
                  <article class="metric-card card">
                    <div class="metric-card__label">${esc(item.label.toUpperCase())}</div>
                    <div class="metric-card__value">${esc(item.value)}</div>
                    <div class="metric-card__trend ${metricTrendClass(item.tone)}">${icon(item.tone === "warn" ? "arrow-right" : item.tone === "crit" ? "alert" : "check")} ${esc(item.trend)}</div>
                  </article>
                `,
              )
              .join("")}
          </div>

          <div class="portal-grid">
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">National Blood Supply</h2>
                  <div class="portal-card__subtitle">Live inventory across all centres</div>
                </div>
                <span class="pill pill--rose">LIVE</span>
              </div>
              <div class="blood-list">
                ${inventory.map((item) => renderBloodRow(item, ` - ${admin.stockUnits[item.type]} / 50 units`)).join("")}
              </div>
            </article>
            <article class="portal-card card">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">Fast-Pass Queue</h2>
                  <div class="portal-card__subtitle">Priority donor routing</div>
                </div>
              </div>
              <div class="admin-queue">
                ${admin.queue
                  .map(
                    (item) => `
                      <div class="queue-item">
                        <div class="queue-avatar">${esc(item.initials)}</div>
                        <div>
                          <div class="queue-item__name">${esc(item.name)} - ${esc(item.blood)}</div>
                          <div class="queue-item__meta">${esc(item.centre)} - ${esc(item.time)}</div>
                        </div>
                        <span class="pill ${item.badge === "Fast-Pass" ? "pill--rose" : "pill--green"}">${esc(item.badge)}</span>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderAdminDonors(data) {
  const page = data.donorsPage || {};

  ROOT.innerHTML = `
    <div class="shell">
      ${adminSidebar("adminDonors", page.centre || "Bloodbank@One Punggol")}
      <main class="content">
        <div class="content__inner">
          <div class="donors-header">
            <h1 class="page-head__title" style="margin-bottom:10px;">${esc(page.heading || "Donors")}</h1>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              ${icon("pin")}
              <span class="location-pill">${esc(page.centre || "Bloodbank@One Punggol")}</span>
              <span style="color:#a29995;">${esc(page.appointmentsOnlyLabel || "appointments only")}</span>
            </div>
          </div>

          <article class="card donors-header__box">
            <div>
              <h2 class="donors-day">${esc(page.dateLabel || "Tuesday, 20 May 2026")}</h2>
              <p class="donors-subday">${esc(page.appointmentsCount || 0)} appointments at this centre</p>
            </div>
            <select class="select-field" style="width: 210px;">
              <option selected>${esc(page.filterLabel || "Today - 20 May")}</option>
            </select>
          </article>

          <div class="donors-layout" style="margin-top:18px;">
            <article class="card donors-panel">
              <div class="portal-card__head">
                <div>
                  <h2 class="portal-card__title">${esc(page.listTitle || "Today's appointments")}</h2>
                  <div class="portal-card__subtitle">${esc(page.listMeta || "")}</div>
                </div>
              </div>
              <div class="today-list">
                ${page.appointments
                  .map(
                    (item) => `
                      <div class="today-item" style="${item.selected ? "background:#ffe7e5;" : ""}">
                        <div class="time-stack"><strong>${esc(item.time)}</strong><div style="color:#a9a19d;">${esc(item.end)}</div></div>
                        <div>
                          <div class="today-item__name" style="font-weight:700;">${esc(item.name)}</div>
                          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
                            <span class="pill pill--rose">${esc(item.blood)}</span>
                            <span class="pill ${item.status === "Fast-Pass" ? "pill--rose" : "pill--green"}">${esc(item.status)}</span>
                          </div>
                        </div>
                        <div></div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>

            <article class="card donor-detail-panel">
              <div style="text-align:center; padding:18px 0 10px;">
                <div class="avatar-lg" style="margin:0 auto; width:60px; height:60px; font-size:1.2rem; background:#f2dfdf; color:#b11a0f;">${esc(page.selected.initials)}</div>
                <div style="margin-top:12px; font-size:1.2rem; font-weight:800;">${esc(page.selected.name)}</div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:8px;">
                  <span class="pill pill--rose">${esc(page.selected.bloodType)}</span>
                  <span class="pill pill--rose">${esc(page.selected.badge)}</span>
                </div>
              </div>
              <div class="info-rows">
                <div class="info-row">
                  <div>${icon("phone")}</div>
                  <div class="info-row__label">PHONE</div>
                  <div class="info-row__value">${esc(page.selected.phone)}</div>
                </div>
                <div class="info-row">
                  <div>${icon("mail")}</div>
                  <div class="info-row__label">EMAIL</div>
                  <div class="info-row__value"><a href="mailto:${esc(page.selected.email)}" style="text-decoration:underline;">${esc(page.selected.email)}</a></div>
                </div>
                <div class="info-row">
                  <div>${icon("calendar")}</div>
                  <div class="info-row__label">APPOINTMENT</div>
                  <div class="info-row__value">${esc(page.selected.appointment)}</div>
                </div>
                <div class="info-row">
                  <div>${icon("user")}</div>
                  <div class="info-row__label">EMERGENCY CONTACT</div>
                  <div></div>
                </div>
                ${page.selected.emergencyContacts
                  .map(
                    (contact) => `
                      <div style="display:grid; grid-template-columns:40px minmax(0,1fr); gap:10px; align-items:center; padding:10px 0; border-bottom:1px solid #ddd;">
                        <div></div>
                        <div>
                          <div style="color:#8d8782;">${esc(contact.name)}</div>
                          <div style="font-weight:800;">${esc(contact.phone)}</div>
                        </div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  `;
}

function renderAdminBloodCentres(data) {
  const page = data.bloodCentresPage || {};
  const inventory = data.inventory.admin;
  const units = data.admin?.stockUnits || {};

  ROOT.innerHTML = `
    <div class="shell">
      ${adminSidebar("adminBloodCentres", page.centre?.name || "Bloodbank@One Punggol")}
      <main class="content">
        <div class="content__inner">
          <div class="page-head">
            <div>
              <h1 class="page-head__title">${esc(page.heading || "Blood Centres")}</h1>
              <div class="page-head__date">${esc(page.updatedLabel || "Last Updated: Today, 09:42")}</div>
            </div>
            <button class="primary-button">${icon("save")} ${esc(page.saveLabel || "Save Changes")}</button>
          </div>

          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:14px;">
            ${icon("pin")}
            <span class="location-pill">${esc(page.locationLabel || "Bloodbank@One Punggol")}</span>
            <span style="color:#a99f9a;">${esc(page.inventoryLabel || "inventory")}</span>
          </div>

          <article class="card centre-summary">
            <div class="centre-summary__row">
              <div style="width:62px; height:62px; border-radius:12px; background:#f6e8e5; color:#b52a1c; display:grid; place-items:center;">${icon("location", "icon")}</div>
              <div>
                <h2 class="centre-summary__title">${esc(page.centre?.name || "Bloodbank@One Punggol")}</h2>
                <div class="centre-summary__meta">${esc(page.centre?.address || "")}</div>
              </div>
              <div class="centre-card__summary">
                <div class="summary-stat"><strong>${esc(page.centre?.totalUnits || 0)}</strong><span>Total units</span></div>
                <div class="summary-stat"><strong>${esc(page.centre?.criticalTypes || 0)}</strong><span>Critical Types</span></div>
                <div class="summary-stat"><strong>${esc(page.centre?.lowTypes || 0)}</strong><span>Low Types</span></div>
              </div>
            </div>
          </article>

          <div class="inventory-adjust-grid">
            ${inventory
              .map(
                (item) => `
                  <article class="card adjust-card">
                    <div class="adjust-card__top">
                      <div>
                        <div class="adjust-card__type">${esc(item.type)}</div>
                        <div style="margin-top:8px;"><span class="pill ${bloodTone(item.status) === "good" ? "pill--green" : bloodTone(item.status) === "low" ? "pill--orange" : "pill--rose"}">${esc(bloodPillLabel(item.status))}</span></div>
                      </div>
                    </div>
                    <div class="progress" style="margin-top:12px;">
                      <div class="progress__fill progress__fill--${bloodTone(item.status)}" style="width:${Number(item.pct)}%"></div>
                    </div>
                    <div style="margin-top:8px; color:#a8a09b;">${esc(item.label)} · ${esc(item.pct)}% / 50 units</div>
                    <div class="units-box">
                      <button class="unit-button" type="button" data-adjust="-1" data-type="${esc(item.type)}">${icon("minus")}</button>
                      <div class="units-count"><span>${esc(units[item.type] || 0)}</span>Units</div>
                      <button class="unit-button" type="button" data-adjust="1" data-type="${esc(item.type)}">${icon("plus")}</button>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>

          <p class="admin-bottom-note">${esc(page.note || "")}</p>
        </div>
      </main>
    </div>
  `;
}

async function boot() {
  try {
    document.body.classList.add("app");
    renderLoading();
    const data = await loadPageData(PAGE);

    switch (PAGE) {
      case "landing":
        renderLanding(data);
        break;
      case "userHome":
        renderUserHome(data);
        break;
      case "userProfile":
        renderUserProfile(data);
        break;
      case "userAppointments":
        renderUserAppointments(data);
        break;
      case "userRewards":
        renderUserRewards(data);
        break;
      case "adminLogin":
        renderAdminLogin(data);
        break;
      case "adminDashboard":
        renderAdminDashboard(data);
        break;
      case "adminDonors":
        renderAdminDonors(data);
        break;
      case "adminBloodCentres":
        renderAdminBloodCentres(data);
        break;
      default:
        renderLanding(data);
        break;
    }
  } catch (error) {
    renderError(error);
  }
}

boot();
