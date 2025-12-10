import { useState } from 'react'
import LoginPage from './components/LoginPage'
import JiraDashboard from './components/JiraDashboard'
import ProjectsPage from './components/ProjectsPage'
import MembersPage from './components/MembersPage'
type Page = 'dashboard' | 'projects' | 'members';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard'); // Reset về dashboard khi logout
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  // Nếu chưa đăng nhập, hiển thị trang Login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Nếu đã đăng nhập, hiển thị trang tương ứng
  return (
    <>
      {currentPage === 'projects' ? (
        <ProjectsPage 
          onLogout={handleLogout} 
          onNavigate={handleNavigate}
        />
      ) : currentPage === 'members' ? (
        <MembersPage 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      ) : (
        <JiraDashboard 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}

export default App
