import { Link } from 'react-router-dom';

const NotFound = () => {
  const styles = {
    container: {
      textAlign: 'center' as const,
      padding: '50px 20px',
      maxWidth: '600px',
      margin: '0 auto',
    },
    title: {
      fontSize: '72px',
      margin: 0,
      color: 'var(--text-secondary)',
    },
    subtitle: {
      fontSize: '28px',
      margin: '0 0 20px 0',
      color: 'var(--text-primary)',
    },
    paragraph: {
      marginBottom: '30px',
      color: 'var(--text-secondary)',
    },
    backLink: {
      display: 'inline-block',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 500,
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <h2 style={styles.subtitle}>Page Not Found</h2>
      <p style={styles.paragraph}>The page you are looking for does not exist or has been moved.</p>
      <Link to="/" style={styles.backLink}>Back to Dashboard</Link>
    </div>
  );
};

export default NotFound; 