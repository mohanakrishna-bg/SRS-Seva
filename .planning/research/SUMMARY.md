# Research Summary

## Key Findings

**Stack:** 
The existing stack (React, FastAPI, SQLite) is highly optimal for a low-concurrency, on-premise deployment. A reverse tunnel solution is recommended for the internet-facing services to minimize security overhead.

**Table Stakes:** 
Devotee registration, seva booking, basic accounting/receipting. Differentiators like Voice Input and Kannada localization (already planned/existing) will significantly boost adoption among lay users.

**Watch Out For:** 
Avoid enterprise-level payment gateways in favor of direct UPI. Ensure internet exposure is handled via secure tunnels rather than simple port forwarding. Keep the UI extremely simple and avoid cluttering it with complex reporting dashboards until requested.
