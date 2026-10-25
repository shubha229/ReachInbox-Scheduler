# ReachInbox — Email Scheduler

A full-stack email scheduling application that allows users to compose emails, manage recipients, schedule email campaigns, and track scheduled and sent emails through a simple dashboard.

The application uses a React frontend, an Express and TypeScript backend, PostgreSQL for persistent storage, and BullMQ with Redis for background email scheduling and processing. Ethereal Email is used as a testing SMTP provider.

## Features

- **Google OAuth Authentication:** Sign in using a Google account.
- **Email Composition:** Create emails with a subject and message body.
- **Recipient Management:** Add recipient email addresses or upload recipient lists using CSV or TXT files.
- **Email Scheduling:** Set a future start time for an email campaign.
- **Rate Limiting:** Configure the delay between emails and the hourly sending limit.
- **Email Dashboard:** View scheduled and sent emails in separate tabs.
- **Persistent Storage:** Store user, sender, campaign, and email information in PostgreSQL.
- **Background Processing:** Use BullMQ and Redis to queue and process scheduled emails.
- **Testing SMTP:** Use Ethereal Email to test email processing without delivering messages to real inboxes.
- **Attachment UI:** Select and preview supported image files in the compose interface.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | BullMQ |
| Queue Storage | Redis |
| Authentication | Google OAuth, Express Session |
| Email Testing | Nodemailer, Ethereal Email |
| Validation | Zod |

## Project Structure

```text
reachinbox-scheduler/
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       └── ...
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── queue/
│       │   ├── email.queue.ts
│       │   ├── email.worker.ts
│       │   └── outbox.publisher.ts
│       ├── rate-limiter/
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── schedule.routes.ts
│       ├── services/
│       │   └── scheduler.service.ts
│       ├── mail/
│       ├── db.ts
│       └── index.ts
│
└── README.md
```

*The structure above represents the main files and folders used by the application; additional files may exist in your local project.*

## Prerequisites

Install or configure the following before running the application:

- Node.js and npm
- PostgreSQL
- Redis
- Google OAuth credentials
- An Ethereal Email test account

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd reachinbox-scheduler
```

Replace `<your-repository-url>` with your GitHub repository URL.

### 2. Install dependencies

Install the backend dependencies:

```bash
cd backend
npm install
```

Then install the frontend dependencies:

```bash
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend directory.

Add the required database, Redis, authentication, session, and SMTP settings. For example:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=your_postgresql_connection_string

SESSION_SECRET=your_session_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_configured_oauth_callback_url

ETHEREAL_USER=your_ethereal_email
ETHEREAL_PASS=your_ethereal_password

WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR_PER_SENDER=200
MIN_DELAY_BETWEEN_EMAILS_MS=2000
```

Configure any additional variables required by your existing Redis and SMTP configuration files. Environment variable names and OAuth callback URLs must match your backend implementation and Google Cloud configuration.

**Important:** Never commit your `.env` file, OAuth secrets, database credentials, or SMTP passwords to GitHub.

### 4. Set up the database

Make sure PostgreSQL is running and your database connection is configured correctly.

From the `backend` directory, run:

```bash
npx prisma generate
npx prisma migrate dev
```

These commands generate the Prisma client and apply pending database migrations. Use your project's existing migrations rather than creating duplicate migrations.

### 5. Start Redis

Ensure the Redis server is running and reachable using the connection settings configured for your backend. BullMQ relies on Redis to process queued email jobs.

### 6. Start the backend

From the `backend` directory, run:

```bash
npm run dev
```

The backend is configured to run on port `5000` by default. Check the terminal output for startup errors.

### 7. Start the frontend

Open another terminal and run:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by Vite, typically:

```text
http://localhost:5173
```

## How It Works

1. The user signs in through Google OAuth.
2. The user composes an email and provides recipient addresses.
3. The user selects a future start time, the delay between emails, and an hourly limit.
4. The backend validates the request and stores campaign and email records in PostgreSQL.
5. Pending email work is published to BullMQ and processed by a background worker using Redis.
6. The worker checks scheduling and rate limits before attempting to send each email.
7. The dashboard displays scheduled and sent email information.

The worker and database are responsible for email processing and persistence; the frontend dashboard provides the interface for composing and viewing emails.

## Testing

Ethereal Email is used as a test SMTP service. It allows you to inspect test messages without sending them to actual recipients.

Recommended checks:

- Sign in through Google OAuth.
- Schedule an email with one recipient.
- Schedule a campaign with multiple recipients.
- Verify that the scheduled time is in the future.
- Check that the configured delay and hourly limit are respected.
- Confirm that email and campaign records are stored in PostgreSQL.
- Verify that queued jobs are processed by the worker.
- Review the email's status and errors in the application or backend logs.

## Current Limitations

- Ethereal Email is for testing, not production email delivery.
- Actual delivery to real inboxes requires a properly configured production email provider.
- Image selection and preview in the compose interface do not, by themselves, guarantee that attachments are uploaded, persisted, or included in outgoing messages; end-to-end attachment support requires backend integration.
- Production use requires appropriate authentication, authorization, validation, logging, and email-provider configuration.

## Future Improvements

- Complete end-to-end attachment uploading and sending.
- Add persistent dashboard loading and automatic refresh.
- Add failed-email details and retry controls.
- Add campaign cancellation and detailed delivery reports.
- Add production email-provider integration and deployment configuration.

## Security Notes

- Keep secrets in environment variables.
- Do not expose OAuth credentials or SMTP passwords in frontend code.
- Validate recipient addresses and scheduling settings on the backend.
- Ensure authenticated users can access only their own campaigns and email records.
- Use HTTPS and secure session cookie settings when deploying to production.

## License

Add a license if you intend to distribute this project publicly.
