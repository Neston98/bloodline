# BloodLine

BloodLine is a data-driven blood donation coordination web app prototype with separate user and admin screens.

## What's in the project

- A landing page, donor home page, profile page, appointments page, and rewards page
- An admin login page, dashboard page, donors page, and blood-centres page
- A Node server that serves the HTML shells and mock API responses from `data.js`
- A shared browser renderer in `app.js` that fetches page data from the server and paints each screen

## Files

- `index.html` - root redirect to the landing page
- `landing.html` - user landing page
- `user-home.html` - user home/dashboard page
- `user-profile.html` - user profile page
- `user-appointments.html` - user appointments page
- `user-rewards.html` - user rewards page
- `admin-login.html` - admin login page
- `admin-dashboard.html` - admin dashboard page
- `admin-donors.html` - admin donors page
- `admin-blood-centres.html` - admin blood centres page
- `app.js` - shared client renderer that fetches data and builds each screen
- `icons.svg` - shared SVG icon sprite
- `styles.css` - visual system, layout, and responsive behavior
- `data.js` - shared mock data source for all fetchable content
- `server.js` - minimal Node server and mock JSON API
- `package.json` - scripts for running the server

## API

- `GET /api/status`
- `GET /api/landing`
- `GET /api/donor`
- `GET /api/inventory`
- `GET /api/admin`
- `POST /api/auth/singpass`
- `POST /api/auth/admin`
- `POST /api/appointments`
- `POST /api/admin/stock`

## Next step

Run the app with:

```bash
npm start
```

Then open `http://localhost:3000`.
