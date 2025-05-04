import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const styles = {
    appContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: '100vh',
    },
    mainContent: {
      display: 'flex',
      flex: 1,
    },
    content: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto' as const,
    }
  };

  return (
    <div style={styles.appContainer}>
      <Navbar />
      <div style={styles.mainContent}>
        <Sidebar />
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout; 