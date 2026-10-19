# Authentication and Authorization

## Overview

Authentication is implemented as a token-based workflow in the backend and consumed by the frontend through the API client. The app supports sign-in for clinicians/admins and stores only a bearer token inside the client session. The project intentionally does not encourage or silently enable public production auth patterns.

## Current responsibilities

- `/api/auth/login`: signs a user in and returns an access token
- `/api/auth/register`: creates a user record for a non-clinician flow
- `/api/auth/me`: returns the signed-in account information
- `/api/auth/change-password`: allows the user to update credentials
- `/api/auth/logout`: clears active session state on the client side and server-side if needed

## Policy constraints

- Real-image upload and analysis workflows require an authenticated clinician/admin user.
- Public registration generates patient-oriented account types rather than clinician access.
- The backend does not permit a fully trusted production deployment without access control and environment hardening.

## Implementation notes

The backend performs token validation through configuration-backed security utilities and restricts the use of real-image workflows to signed-in users. This keeps the feature set aligned with the intended clinical operation while preserving local development simplicity.
