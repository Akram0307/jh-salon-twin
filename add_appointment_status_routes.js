const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'backend/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

// Check if appointmentStatusRoutes is already imported
if (!content.includes("import appointmentStatusRoutes from './routes/appointmentStatusRoutes'")) {
  // Find the line with the last import of a route
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("import") && lines[i].includes("Routes")) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    // Insert the new import after the last route import
    lines.splice(lastImportIndex + 1, 0, "import appointmentStatusRoutes from './routes/appointmentStatusRoutes';");
    content = lines.join('\n');
  }
}

// Check if appointmentStatusRoutes is already used
if (!content.includes("app.use('/api/appointments', appointmentStatusRoutes)")) {
  // Find the line with the last app.use of a route
  const lines = content.split('\n');
  let lastAppUseIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("app.use") && lines[i].includes("Routes")) {
      lastAppUseIndex = i;
    }
  }
  
  if (lastAppUseIndex !== -1) {
    // Insert the new app.use after the last route app.use
    lines.splice(lastAppUseIndex + 1, 0, "app.use('/api/appointments', appointmentStatusRoutes);");
    content = lines.join('\n');
  }
}

fs.writeFileSync(indexPath, content);
console.log('Updated index.ts with appointment status routes');
