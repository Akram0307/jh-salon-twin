const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

// Check if the new routes are already imported
if (!content.includes("import clientBookingRoutes from './routes/clientBookingRoutes'")) {
    // Add import after existing imports
    const importSection = content.match(/import.*from.*routes.*;/g);
    if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        content = content.replace(
            lastImport,
            lastImport + "\nimport clientBookingRoutes from './routes/clientBookingRoutes';\nimport staffWorkspaceRoutes from './routes/staffWorkspaceRoutes';"
        );
    }
}

// Check if the routes are already registered
if (!content.includes("app.use('/api/client', clientBookingRoutes)")) {
    // Add route registration after existing routes
    const routeSection = content.match(/app\.use\('.*\/api\/.*', .*Routes.*\);/g);
    if (routeSection) {
        const lastRoute = routeSection[routeSection.length - 1];
        content = content.replace(
            lastRoute,
            lastRoute + "\napp.use('/api/client', clientBookingRoutes);\napp.use('/api/staff', staffWorkspaceRoutes);"
        );
    }
}

fs.writeFileSync(indexPath, content);
console.log('Updated index.ts with new routes');
