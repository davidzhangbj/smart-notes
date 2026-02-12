<!--
 Sync Impact Report:
 ===================
 Version: 0.0.0 -> 1.0.0
 Rationale: Initial constitution establishment - major version bump as this is the first ratified constitution

 Modified Principles: N/A (initial version)
 Added Principles:
   - I. Search-First
   - II. Single User, Lightweight
   - III. Local Data Storage
   - IV. Mature Technology Stack
   - V. Documentation-Driven Development

 Added Sections:
   - Core Principles (5 principles)
   - Technical Standards
   - Governance

 Templates Status:
   - plan-template.md: ✅ Compatible - Constitution Check section exists and will reference these principles
   - spec-template.md: ✅ Compatible - No principle-specific constraints violated
   - tasks-template.md: ✅ Compatible - Task categorization supports these principles
   - agent-file-template.md: ✅ Compatible - No updates needed

 Follow-up TODOs: None
-->

# Smart Notes Constitution

## Core Principles

### I. Search-First (NON-NEGOTIABLE)

Search is the primary feature of this application. All design decisions MUST prioritize search accuracy and performance.

**Rules**:
- Search MUST return accurate results
- Search MUST be fast (sub-100ms for typical queries)
- Search indexing MUST be considered when designing data models
- Search relevance MUST be validated with real user queries
- NO feature that degrades search performance is acceptable without documented justification

**Rationale**: The core value proposition of a notes application is the ability to find information quickly. If search fails, the application fails.

### II. Single User, Lightweight

This is a single-user application. Keep it simple. Avoid features and complexity that serve multi-user or enterprise scenarios.

**Rules**:
- NO user authentication, authorization, or account management
- NO sharing, collaboration, or permission systems
- NO real-time synchronization between users
- NO microservices or distributed architecture
- Every feature MUST justify its existence against YAGNI (You Aren't Gonna Need It)

**Rationale**: Complexity is the enemy of reliability and maintainability. By constraining scope to single-user, we avoid entire classes of problems.

### III. Local Data Storage

All user data MUST be stored locally on the user's device.

**Rules**:
- Notes content, metadata, and indexes MUST be stored locally
- NO cloud dependencies for data persistence
- User retains full control and ownership of their data
- Export/portability MUST be supported

**Rationale**: Privacy, offline capability, and data sovereignty are foundational. Users should not lose access to their notes due to network issues or service shutdowns.

### IV. Mature Technology Stack

Only use technologies that are mature, stable, and well-documented.

**Rules**:
- Preferred languages/frameworks MUST have been in production use for 2+ years
- Technologies MUST have comprehensive, up-to-date documentation
- Technologies MUST have active community or commercial support
- NO experimental or bleeding-edge dependencies without documented justification
- When in doubt, choose boring over innovative

**Rationale**: Mature technologies have known patterns, fewer surprises, and better long-term maintainability.

### V. Documentation-Driven Development

All design and code involving database operations MUST reference authoritative documentation. NEVER guess.

**Rules**:
- Before implementing any database query or schema change, READ the official documentation
- NO assumptions about database behavior without verification
- Store links to relevant documentation in code comments when implementing non-trivial features
- When patterns change, update related documentation references

**Rationale**: Database behavior is nuanced. Guessing leads to subtle bugs, performance issues, and incorrect results.

## Technical Standards

### Performance

- Search queries: Target <100ms p95 for typical local datasets
- Application startup: Target <500ms cold start
- UI responsiveness: Maintain 60fps for all interactions

### Code Quality

- All code MUST be readable and maintainable
- Comments MUST explain "why", not "what"
- Prefer explicit over clever

### Dependencies

- Each dependency MUST serve a clear purpose
- Audit dependencies regularly for security vulnerabilities
- Prefer minimal, focused libraries over comprehensive frameworks

## Governance

### Amendment Process

1. Proposals MUST be documented with rationale
2. Changes MUST be reviewed for compatibility with existing principles
3. Version MUST be incremented according to semantic versioning:
   - MAJOR: Principle removal or backward-incompatible changes
   - MINOR: New principle or substantial expansion
   - PATCH: Clarifications, wording improvements, non-semantic changes

### Compliance

- All features MUST be validated against these principles during planning
- Violations MUST be explicitly documented and justified
- Complexity tracking is REQUIRED when principles cannot be fully satisfied

### Scope

This constitution governs all feature development for Smart Notes. It supersedes generic best practices when conflicts arise.

**Version**: 1.0.0 | **Ratified**: 2026-02-12 | **Last Amended**: 2026-02-12
