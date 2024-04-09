import Image from "next/image";
import styles from "./page.module.css";
import Chat from './component/Chat'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <Chat />
      </div>
    </main>
  );
}
