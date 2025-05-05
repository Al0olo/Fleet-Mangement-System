import { Link } from 'react-router-dom';

const Navbar = () => {
  const styles = {
    navbar: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      height: '60px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'sticky' as const,
      top: 0,
      zIndex: 999,
    },
    navbarContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: '0 8px 0 8px',
      maxWidth: '100%',
    },
    navbarLogo: {
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      textDecoration: 'none',
    },
    navUser: {
      display: 'flex',
      alignItems: 'center',
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navbarContainer}>
        <Link to="/" style={styles.navbarLogo}>
          Fleet Management System
        </Link>
        <div style={styles.navUser}>
          <span>Admin User</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 