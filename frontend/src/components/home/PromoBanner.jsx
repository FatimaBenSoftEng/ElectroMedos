import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PromoBanner.module.css';

function getTimeLeft() {
  const end = new Date();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 0);
  const diff = end - Date.now();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function PromoBanner() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.banner}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <span className={styles.label}>Offre de la semaine</span>
          <h2>Promotions jusqu&apos;à <strong>-50%</strong></h2>
          <p>Nouvelle collection high-tech — profitez de réductions exceptionnelles</p>
          <Link to="/products?ordering=-price" className={styles.cta}>
            Acheter maintenant
          </Link>
        </div>
        <div className={styles.countdown}>
          {[
            { value: time.days, label: 'Jours' },
            { value: time.hours, label: 'Heures' },
            { value: time.minutes, label: 'Min' },
            { value: time.seconds, label: 'Sec' },
          ].map((unit) => (
            <div key={unit.label} className={styles.unit}>
              <span className={styles.value}>{String(unit.value).padStart(2, '0')}</span>
              <span className={styles.unitLabel}>{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
