# Production Readiness Checklist

## Required before production exposure

- patient-scoped access control and role checks
- signed or restricted image storage
- secure secret management and environment segregation
- database identity and private networking hygiene
- audit logging for clinician actions and report generation
- independent model validation and probability calibration
- explicit data retention and deletion policies

## Current project status

The repository is intentionally not listed as production-ready. The project documentation clearly states that production deployment is disabled until key clinical data protection and authorization controls are implemented.

## Gate to pass before changing status

A production deployment gate should require:

1. end-to-end security validation
2. role-based access control review
3. access pattern testing for patient and screening data
4. model evidence review and clinical governance sign-off
5. infrastructure deployment review for network and secret protection

This checklist should be treated as a real operational gate rather than a documentation exercise.
