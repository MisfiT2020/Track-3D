import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'

import theme from './theme'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ChangePassword from './components/ChangePassword'
import AdminPanelUsers from './pages/AdminPanel'
import PredictComponent from './components/PredictComponent'
import ImportReport from './pages/ImportCSV'
import RecentImportsPage from './pages/RecentImportsPage'
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sudo-panel" element={<AdminPanelUsers />} />      
          <Route path="/change-password" element={<ChangePassword />} />      
          <Route path="/predict" element={<PredictComponent />} />      
          <Route path="/import-report" element={<ImportReport />} />
          <Route path="/recents" element={<RecentImportsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
