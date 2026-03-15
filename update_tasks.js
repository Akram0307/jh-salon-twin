const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '.a0proj', 'planned_tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// Update TASK-040 and TASK-041
const taskIds = ['TASK-040', 'TASK-041'];
let updated = false;

tasks.tasks.forEach(task => {
  if (taskIds.includes(task.id)) {
    task.status = 'done';
    task.completed = new Date().toISOString();
    updated = true;
    console.log(`Updated ${task.id} to done`);
  }
});

if (updated) {
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  console.log('planned_tasks.json updated successfully');
} else {
  console.log('No tasks found to update');
}
