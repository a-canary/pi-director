---
description: Full implementation — scout → planner → builder → reviewer
---
Use the subagent tool to execute this as a chain:

1. **scout**: Find all code relevant to: $@
2. **planner**: Create an implementation plan for "$@" using the scout findings from {previous}
3. **builder**: Implement the plan from {previous}
4. **reviewer**: Review the implementation from {previous}
