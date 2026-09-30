# Actrya Backend — Manager Mode Upgrade

This upgrade keeps the current project/kanban model and adds:

- `users.user_type`: `manager` or `employee`.
- Global manager/team links (`manager_employees`).
- Presence/heartbeat and work sessions (`user_presence`, `work_sessions`).
- Manager demands (`manager_demands`).
- Project members in bulk.
- Project creator remains permanent `owner`.
- Any active user, manager or employee, can create a project.
- Project owner can associate multiple users as `editor` or `viewer`.

Important distinction:

- `user_type` controls the product mode/UX (manager vs employee).
- `project_members.role` controls permissions inside each project (`owner`, `editor`, `viewer`).

The new migration is `1700000001000-ManagerMode.ts`. The container runs migrations automatically before starting NestJS.
