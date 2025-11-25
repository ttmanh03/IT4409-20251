import { useState } from 'react'
import LoginPage from './components/LoginPage'
import JiraDashboard from './components/JiraDashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  
  return (
    <>
      {isAuthenticated ? (
        <JiraDashboard onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  )
}

export default App