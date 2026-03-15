const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

// Check if the new routes are already imported
const newImports = [
  "import userProfileRoutes from './routes/userProfileRoutes';",
  "import salonSettingsRoutes from './routes/salonSettingsRoutes';",
  "import staffProfileRoutes from './routes/staffProfileRoutes';"
];

let needsUpdate = false;
newImports.forEach(imp => {
  if (!content.includes(imp)) {
    needsUpdate = true;
  }
});

if (!needsUpdate) {
  console.log('New routes already imported.');
  process.exit(0);
}

// Find the line after settingsRoutes import
const settingsImportLine = "import settingsRoutes from './routes/settingsRoutes';";
const settingsIndex = content.indexOf(settingsImportLine);
if (settingsIndex === -1) {
  console.error('Could not find settingsRoutes import');
  process.exit(1);
}

// Find the end of the import block (next non-import line)
let importEndIndex = settingsIndex;
const lines = content.split('\n');
let inImportBlock = false;
let lineIndex = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('import ')) {
    inImportBlock = true;
    lineIndex = i;
  } else if (inImportBlock && !lines[i].startsWith('import ') && lines[i].trim() !== '') {
    // Found the first non-import line after imports
    importEndIndex = i;
    break;
  }
}

// Insert the new imports after the settingsRoutes import
const newImportLines = [
  "import userProfileRoutes from './routes/userProfileRoutes';",
  "import salonSettingsRoutes from './routes/salonSettingsRoutes';",
  "import staffProfileRoutes from './routes/staffProfileRoutes';"
];

// Insert after the settingsRoutes import line
let settingsLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(settingsImportLine)) {
    settingsLineIndex = i;
    break;
  }
}

if (settingsLineIndex === -1) {
  console.error('Could not find settingsRoutes import line');
  process.exit(1);
}

// Insert the new imports after the settingsRoutes import
lines.splice(settingsLineIndex + 1, 0, ...newImportLines);

// Now add the route usage
// Find the line with app.use('/api/settings', settingsRoutes);
const settingsRouteLine = "app.use('/api/settings', settingsRoutes);";
let settingsRouteIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(settingsRouteLine)) {
    settingsRouteIndex = i;
    break;
  }
}

if (settingsRouteIndex === -1) {
  console.error('Could not find settings route usage');
  process.exit(1);
}

// Insert the new route usages after the settings route
const newRouteUsages = [
  "app.use('/api/user-profile', userProfileRoutes);",
  "app.use('/api/salon-settings', salonSettingsRoutes);",
  "app.use('/api/staff-profile', staffProfileRoutes);"
];

lines.splice(settingsRouteIndex + 1, 0, ...newRouteUsages);

// Write the updated content
fs.writeFileSync(indexPath, lines.join('\n'));
console.log('Updated index.ts with new routes');
