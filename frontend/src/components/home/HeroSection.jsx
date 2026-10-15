import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HeroSection.module.css';

const SLIDES = [
  {
    id: 1,
    title: 'Collection Smartphones',
    subtitle: 'Les derniers flagships à prix imbattables',
    cta: '/products?category=smartphones',
    image: '/images/imagesouri.jpg',
   
  },
  {
    id: 2,
    title: 'Accessoires Premium',
    subtitle: 'Complétez votre setup high-tech',
    cta: '/products?category=accessoires',
    image: '/images/image1.jpg',
  },
  {
    id: 3,
    title: 'Univers Gaming',
    subtitle: 'Consoles, périphériques et écrans gaming',
    cta: '/products?category=gaming',
    image: '/images/imgepc.png',

  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  // Le timer repart à zéro à chaque changement de slide (clic flèche ou point)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const slide = SLIDES[current];

  return (
    <section className={styles.hero}>
      <div className={styles.banner}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className={styles.slide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={slide.image} alt="" className={styles.slideImage} />
            <div className={styles.slideOverlay} />
            <div className={styles.slideContent}>
              <span className={styles.tag}>Nouvelle collection</span>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
              <Link to={slide.cta} className={styles.cta}>
                Acheter maintenant
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

       {/*  <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={prev}
          aria-label="Slide précédente"
        >
          ‹
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={next}
          aria-label="Slide suivante"
        >
          ›
        </button> */}

        <div className={styles.dots}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={i === current ? styles.dotActive : styles.dot}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}