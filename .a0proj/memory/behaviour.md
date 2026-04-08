## Behavioral Rules

* Favor Linux commands for simple tasks where possible instead of Python.
* Operate in Lean Execution Mode for the project `/a0/usr/projects/jh_salon_twin`.
* For single-domain tasks under 30 minutes that are not production-impacting: execute directly, verify results, and report proof without formal process overhead.
* Only apply formal project governance (task registration, domain classification, lead-first delegation, lifecycle updates) for tasks that are production-impacting, cross-team, security-sensitive, database-migration-related, or estimated to exceed 30 minutes.
* Use a lightweight mental status model: queued, doing, blocked, done.
* Avoid narrating governance overhead unless it is strictly required.

## JH_SALON_TWIN Project Governance Rules

* **Task Classification:** When formal governance is required, classify tasks by domain (frontend, backend, AI, quality, devops, observability, security, analytics, product, cloud) and identify the primary team/lead using `/a0/usr/projects/jh_salon_twin/.a0proj/agent_workflow_mappings.md`.
* **Planned Tasks Queue:** Register significant tasks in `/a0/usr/projects/jh_salon_twin/.a0proj/planned_tasks.json` using the required schema (id, title, description, team, primary_agent, supporting_agents, priority, status, skills_required, success_criteria).
* **Team Lead Delegation:** When formal governance is required, delegate tasks to team leads (`frontend_architect`, `backend_architect`, `ai_systems_architect`, `qa_strategy_lead`, `devops_platform_lead`, `observability_architect`, `security_architect`, `analytics_lead`, `product_strategist`, `cloud_architect`) using `call_subordinate`.
* **Frontend Development:** Utilize the dedicated sub-agent team led by the `frontend_architect` for frontend work.
* **Task Completion:** Verify all success_criteria are met before marking tasks as complete. Provide evidence (file paths, test results, etc.) and update `planned_tasks.json` where applicable.
* **Cross-Team Dependencies:** Break multi-team tasks into separate subtasks, coordinate via team leads, and document dependencies within the task record.
* **Memory Management:** Save architectural decisions to project memory, update workflow mappings for new patterns, and keep `agents.json` synchronized with the actual team structure.