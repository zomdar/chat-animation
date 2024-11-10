import styles from './styles.module.css';

export const LoadingIndicator = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingDots}>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);