import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', exact: true },
    { path: '/vehicles', label: 'Vehicles' },
    { path: '/maintenance', label: 'Maintenance' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/simulator', label: 'Simulator' },
  ];

  const styles = {
    sidebar: {
      width: '240px',
      backgroundColor: 'var(--background-primary)',
      borderRight: '1px solid #eaeaea',
      padding: '20px 0',
      height: 'calc(100vh - 60px)',
    },
    sidebarMenu: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    sidebarItem: {
      padding: '12px 20px',
      display: 'block',
      color: 'var(--text-primary)',
      textDecoration: 'none',
      fontWeight: 500,
      borderLeft: '3px solid transparent',
    },
    sidebarItemHover: {
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
      textDecoration: 'none',
    },
    sidebarItemActive: {
      backgroundColor: 'rgba(25, 118, 210, 0.16)',
      borderLeftColor: 'var(--primary-color)',
      color: 'var(--primary-color)',
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarMenu}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.sidebarItem,
              ...(isActive ? styles.sidebarItemActive : {})
            })}
            end={item.exact}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 