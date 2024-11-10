import styles from './styles.module.css';

export const LoadingIndicator = () => (
  <li className={styles.loadingContainer}>
    <span className={styles.chatName}>
      Franklin
    </span>
    <div className={styles.messageContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingDots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={styles.shimmerOverlay} />
      </div>
    </div>
  </li>
);