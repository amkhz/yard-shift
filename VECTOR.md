---
# VECTOR.md — Project Doctrine
# This file is the single source of truth for project intent, audience, and knowledge.
# Read this before CLAUDE.md. Read CLAUDE.md before writing code.

vector_version: "0.1"

project:
  name: "YOUR PROJECT NAME"
  description: "One sentence. What is this and who is it for?"
  stage: "discovery"  # discovery | definition | development | delivery | maintenance
  started: "YYYY-MM-DD"
  repo: ""

owner:
  name: ""
  role: ""

knowledge:
  research: "./vector/research/"
  schemas: "./vector/schemas/"
  decisions: "./vector/decisions/"
---

# Identity

## Problem Statement
What problem does this project solve? Who experiences it? Why does it matter?

[Write 2-3 sentences. Be specific. "Users struggle with X" is weak. "Fiction authors with 100K+ word manuscripts lose track of character continuity because no existing tool indexes prose at the entity level" is strong.]

## Target Audience
Who is this for? What do they already use? What do they wish existed?

[Describe your primary user. Not a persona yet — that lives in /vector/research/personas/. This is the 2-sentence version.]

## Core Value Proposition
If this works, what changes for the user?

[One sentence. The "so that..." from a JTBD. Not features. Outcomes.]

## What This Is Not
What are you explicitly choosing NOT to build? What adjacent problems are out of scope?

[This section prevents scope creep. Be specific about boundaries.]

---

# Knowledge Map

## Research Status

| Artifact | Status | Location |
|----------|--------|----------|
| User Interviews | Not started | `./vector/research/interviews/` |
| Jobs to Be Done | Not started | `./vector/research/jtbd/` |
| Personas | Not started | `./vector/research/personas/` |
| Competitive Analysis | Not started | `./vector/research/competitive/` |
| Assumptions | Not started | `./vector/research/assumptions/` |

## Key Assumptions (Seed These Early)

1. [Assumption about your user — what do you believe is true but have not validated?]
2. [Assumption about the market — is there demand? How do you know?]
3. [Assumption about the solution — will your approach actually work?]

Mark each as: hypothesis | testing | validated | invalidated

## Open Questions

- [What do you need to learn before building?]
- [What would change your approach if the answer surprised you?]

---

# Architecture Doctrine

See ARCHITECTURE.md for technical implementation details.

This section captures the *why* behind technical decisions.

## Design Principles
1. [Principle that guides every technical decision]
2. [Principle that resolves ambiguity when two good options exist]
3. [Principle that you would defend in a code review]

## Constraints
- [Hard constraints: budget, timeline, team size, platform requirements]
- [Soft constraints: preferences, existing skills, ecosystem choices]

---

# Quality Gates

## Definition of Done
What does "done" mean for a feature in this project?

- [ ] [Your criteria — e.g., "Works without errors under normal use"]
- [ ] [Your criteria — e.g., "Edge cases handled gracefully"]
- [ ] [Your criteria — e.g., "Documented in ARCHITECTURE.md if it adds a new pattern"]

## Ship Criteria
What must be true before this project goes to real users?

- [ ] [Your criteria]
- [ ] [Your criteria]
