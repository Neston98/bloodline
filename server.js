const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");
const data = require("./data");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(body);
}

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function serveStatic(res, pathname) {
  const target = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, target));
  if (!filePath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return true;
  }

  if (!(await fileExists(filePath))) return false;

  const body = await fs.readFile(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypeFor(filePath),
    "Cache-Control": "no-store",
  });
  res.end(body);
  return true;
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/status") {
    sendJson(res, 200, {
      ok: true,
      app: "BloodLine",
      now: new Date().toISOString(),
      routes: ["/api/status", "/api/landing", "/api/donor", "/api/inventory", "/api/admin", "/api/auth/singpass"],
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/landing") {
    sendJson(res, 200, {
      landingPage: data.landingPage,
      ui: data.ui,
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/donor") {
    sendJson(res, 200, {
      ui: data.ui,
      profile: data.donorProfile,
      appointments: data.donorAppointments,
      contacts: data.donorContacts,
      travel: data.donorTravel,
      rewards: data.donorRewards,
      appointmentsPage: data.userAppointmentsPage,
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/inventory") {
    sendJson(res, 200, {
      public: data.inventory.public,
      admin: data.inventory.admin,
      stockUnits: data.adminDashboard.stockUnits,
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin") {
    sendJson(res, 200, {
      ui: data.ui,
      alert: data.adminDashboard.alert,
      centre: data.adminDashboard.centre,
      dashboard: data.adminDashboard.cards,
      queue: data.adminDashboard.queue,
      donorAppointments: data.adminDashboard.donorAppointments,
      centres: data.adminDashboard.centres,
      stockUnits: data.adminDashboard.stockUnits,
      loginPage: data.adminLoginPage,
      donorsPage: data.adminDonorsPage,
      bloodCentresPage: data.adminBloodCentresPage,
    });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/singpass") {
    const body = await readBody(req);
    sendJson(res, 200, {
      ok: true,
      method: "mock-singpass",
      issuedAt: new Date().toISOString(),
      user: {
        nric: data.donorProfile.nric,
        name: data.donorProfile.fullName,
        bloodType: data.donorProfile.bloodType,
        centre: body.centre || "Bloodbank@One Punggol",
      },
    });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/admin") {
    const body = await readBody(req);
    sendJson(res, 200, {
      ok: true,
      centre: body.centre || data.adminDashboard.centre,
      role: "admin",
    });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/appointments") {
    const body = await readBody(req);
    sendJson(res, 201, {
      ok: true,
      appointmentId: `APPT-${Date.now()}`,
      centre: body.centre || "Bloodbank@One Punggol",
      time: body.time || "10:30 - 10:50",
      status: "Fast-Pass",
    });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/stock") {
    const body = await readBody(req);
    sendJson(res, 200, {
      ok: true,
      message: "Stock update accepted",
      bloodType: body.bloodType || "O-",
      delta: Number(body.delta || 0),
      centre: body.centre || data.adminDashboard.centre,
    });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const { pathname } = url;

    if (pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, pathname);
      if (!handled) sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendText(res, 405, "Method Not Allowed");
      return;
    }

    const served = await serveStatic(res, pathname);
    if (!served) {
      const indexPath = path.join(ROOT, "index.html");
      if (await fileExists(indexPath)) {
        const body = await fs.readFile(indexPath);
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(body);
        return;
      }
      sendText(res, 404, "Not Found");
    }
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, () => {
  console.log(`BloodLine server running at http://localhost:${PORT}`);
});
