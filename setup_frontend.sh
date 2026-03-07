#!/bin/bash
set -e
cd /a0/usr/projects/jh_salon_twin
echo "Cleaning up previous failed attempt..."
rm -rf frontend
echo "Creating Vite React-TS project..."
npm create vite@latest frontend --yes -- --template react-ts
cd frontend
echo "Installing base dependencies..."
npm install
echo "Installing additional packages..."
npm install tailwindcss postcss autoprefixer firebase react-router-dom lucide-react
echo "Initializing Tailwind..."
npx tailwindcss init -p

echo "Configuring Tailwind..."
cat << 'INNER_EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
INNER_EOF

cat << 'INNER_EOF' > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
INNER_EOF

echo "Creating folder structure and placeholder components..."
mkdir -p src/components src/pages/client src/pages/staff src/pages/owner src/hooks src/context

cat << 'INNER_EOF' > src/pages/client/ClientChat.tsx
export default function ClientChat() { return <div className="p-4 text-xl font-bold">Client Chat (Instagram Style)</div>; }
INNER_EOF

cat << 'INNER_EOF' > src/pages/staff/MissionControl.tsx
export default function MissionControl() { return <div className="p-4 text-xl font-bold">Staff Mission Control</div>; }
INNER_EOF

cat << 'INNER_EOF' > src/pages/owner/OwnerPortal.tsx
export default function OwnerPortal() { return <div className="p-4 text-xl font-bold">Owner Portal</div>; }
INNER_EOF

cat << 'INNER_EOF' > src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientChat from './pages/client/ClientChat';
import MissionControl from './pages/staff/MissionControl';
import OwnerPortal from './pages/owner/OwnerPortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientChat />} />
        <Route path="/staff" element={<MissionControl />} />
        <Route path="/owner" element={<OwnerPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
INNER_EOF

echo "FRONTEND_SETUP_SUCCESS"
