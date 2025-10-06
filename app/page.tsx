import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to My Year in the Chair</h1>
        <p className={styles.lead}>
          This repository has been reset with a fresh Next.js 14 starter so you can rebuild the project from a clean slate.
        </p>
        <p className={styles.body}>
          Start by running <code className={styles.code}>pnpm install</code> to fetch dependencies, then update the app directory with
          your desired pages and components.
        </p>
      </div>
    </main>
  );
}
