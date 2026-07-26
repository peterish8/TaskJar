```markdown
# TaskJar Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and workflows used in the TaskJar TypeScript codebase. TaskJar emphasizes clear documentation, consistent file and code organization, and a structured approach to planning and testing. The repository does not use a specific framework, focusing instead on strong conventions for maintainability and collaboration.

## Coding Conventions

### File Naming
- **Style:** `snake_case`
- **Example:**  
  ```
  user_profile.ts
  task_manager.test.ts
  ```

### Import Style
- **Relative imports** are used throughout the codebase.
- **Example:**
  ```typescript
  import { Task } from './task_model';
  import { calculate_due } from '../utils/date_utils';
  ```

### Export Style
- **Named exports** are preferred.
- **Example:**
  ```typescript
  // In task_model.ts
  export const Task = { /* ... */ };
  export function create_task() { /* ... */ }
  ```

### Commit Messages
- **Conventional commits** are used, especially with the `docs` prefix for documentation changes.
- **Examples:**
  ```
  docs: add requirements planning doc
  docs: define initial data model
  ```

## Workflows

### Add New Planning Document
**Trigger:** When you need to document a new aspect of project planning (e.g., requirements, architecture, data model).  
**Command:** `/add-planning-doc`

1. Create a new markdown file in the `.planning` directory for the specific planning aspect.
   - Example: `.planning/architecture.md`
2. Write or update the content relevant to that aspect.
3. Commit the new file with a message like:
   ```
   docs: add architecture planning doc
   ```
4. Push your changes to the repository.

**Example:**
```bash
echo "# Data Model" > .planning/data_model.md
git add .planning/data_model.md
git commit -m "docs: add data model planning doc"
git push
```

## Testing Patterns

- **Test files** follow the pattern: `*.test.*` (e.g., `task_manager.test.ts`)
- **Testing framework:** Not explicitly detected; follow the pattern for adding new tests.
- **Example:**
  ```typescript
  // task_manager.test.ts
  import { create_task } from './task_manager';

  test('should create a new task', () => {
    const task = create_task('Read SKILL.md');
    expect(task.name).toBe('Read SKILL.md');
  });
  ```

## Commands

| Command             | Purpose                                                      |
|---------------------|--------------------------------------------------------------|
| /add-planning-doc   | Start a new planning or documentation file in `.planning/`   |
```
