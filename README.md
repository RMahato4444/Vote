# LiveVote — Real-Time Voting Site

MERN + Tailwind CSS + Socket.IO real-time voting site.

## Candidates

Tyson, Jishu, Rahul, Souvik, Mukesh, Abhishek, Rana.

## Voting

- A browser/device can cast one vote.
- The vote goes to the candidate the user taps.
- The same browser/device cannot vote again unless its vote is removed.
- The voter can remove their vote while voting is open.
- Vote totals update in real time for connected users.
- Refresh Votes reloads the latest totals without casting a vote.

The one-vote rule is enforced using a unique browser/device ID stored in localStorage plus a unique voter record in MongoDB. This is one vote per browser/device, not identity-verified one-person-one-vote.

## Timer

The timer is visible on the normal voting page.

Only the admin can change or reset it.

## Hidden admin page

There is no link to the admin page from the voting page.

Open this URL directly:

```text
/admin-login
```

Default credentials:

```text
Username: sprite@piyo
Password: 1234567
```

You can override them in `server/.env` with:

```env
ADMIN_USERNAME=sprite@piyo
ADMIN_PASSWORD=1234567
ADMIN_SESSION_HOURS=12
```

The admin page can:

- set the timer;
- reset the timer;
- refresh the vote count;
- reset the page for a new round.

`Reset Page` clears the current votes/voter records, restarts the timer, and returns connected users from the winner screen to the normal voting screen.

## Winner screen

When the timer reaches zero:

- voting is blocked by the server;
- the normal page switches to an animated winner screen;
- the winner remains visible to visitors;
- a tie is shown as a tie;
- the winner screen ends when the admin uses `Reset Page`.

## Dummy profile pictures

Replace the files here later with your real images:

```text
client/public/assets/candidates/
```

Keep these file names or update `server/src/data.js`.

## Local setup

### Server

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example` and set your MongoDB URI.

```bash
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

If your API is not on localhost:5000, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## MongoDB

Local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/realtime-voting
```

Or use a MongoDB Atlas connection string.

## Docker

From the project root:

```bash
docker compose up -d
```
