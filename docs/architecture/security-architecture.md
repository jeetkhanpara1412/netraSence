# Security Architecture

## Current approach

Security in NetraSense is built as a layered control model rather than a single flag. The implementation includes a FastAPI middleware layer, rate limiting, CORS restrictions, secure headers, and a practitioner-auth flow.

## Defensive controls already in place

- Security headers are added to each HTTP response.
- Access control is enforced for authenticated clinician and admin workflows.
- Rate limiting is applied to public-facing or non-auth routes.
- CORS origins are restricted to local development origins only.
- The backend refuses dangerous production defaults and requires explicit configuration for non-development environments.

## Important limitations

The project documentation explicitly identifies that production deployment remains disabled until stricter authorization and patient-scoped data access are implemented. This is the correct security posture: a real clinical tool should not share patient data across organizations or allow unauthorized access to screening results or images.

## Recommended production path

- enforce role-based access control for clinician vs admin vs patient roles
- scope patient and screening records to the correct tenant or organization
- protect image storage behind signed URLs or authenticated access
- add audit logging for user actions and review overrides
- require secret rotation and secure environment injection for deployed services

## Operational stance

The repository currently behaves like a secure prototype boundary, not a fully deployed clinical system. That is a valid and responsible position for a project that uses real retinal datasets and handles clinician workflow data.
