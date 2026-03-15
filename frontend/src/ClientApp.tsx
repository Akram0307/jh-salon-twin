import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ClientChat from './pages/client/ClientChat'

export default function ClientApp() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<ClientChat />} />
      </Routes>
    </Router>
  )
}
