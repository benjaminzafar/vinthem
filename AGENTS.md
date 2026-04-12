This project uses Next.js with Vercel for frontend and Firestore as database. Before making any changes, always follow these security rules without exception:
Security:

Never hardcode any email, credential, or fallback secret in the codebase
If ENCRYPTION_SECRET is missing, throw an error and stop the server. Never use a default value
All admin routes must be protected by server-side authentication middleware using Firebase Admin SDK
Order creation is only allowed through the backend API routes, never from the client
When admin saves an API key, the Next.js API route encrypts and saves directly to Firestore. The encrypted value must never be sent back to the frontend
All API keys are encrypted with AES-256 before storing in Firestore
Price calculation always happens in the backend API route using Firestore prices, never frontend values
CORS is restricted to allowed domains only
Rate limiting must remain active on all public API routes
All user inputs must be sanitized before writing to Firestore
No API key or secret should exist as a plain text environment variable except ENCRYPTION_SECRET

Code Quality:
12. Never leave debug files or test scripts in the codebase
13. Always handle undefined or null values safely
14. Never silently swallow errors in catch blocks
15. Never use any type in TypeScript
After every change:
16. Confirm build passes with zero errors
17. Confirm lint passes with zero warnings
18. Confirm all admin routes still require authentication