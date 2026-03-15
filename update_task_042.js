const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '.a0proj', 'planned_tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// Update TASK-042
const taskId = 'TASK-042';
let updated = false;

tasks.tasks.forEach(task => {
  if (task.id === taskId) {
    task.status = 'done';
    task.completed = new Date().toISOString();
    updated = true;
    console.log(`Updated ${task.id} to done`);
  }
});

if (updated) {
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  console.log('planned_tasks.json updated successfully for TASK-042');
} else {
  console.log('TASK-042 not found in planned_tasks.json');
}
