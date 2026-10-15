import { motion } from 'framer-motion';
import {
  FiShield,
  FiTruck,
  FiHeadphones,
  FiCreditCard,
  FiSearch,
  FiShoppingCart,
  FiCheckCircle,
  FiPackage,
} from 'react-icons/fi';
import styles from './AboutPage.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const VALUES = [
  { icon: <FiShield />, title: 'Produits garantis', text: 'Tous nos articles sont vérifiés et garantis.' },
  { icon: <FiTruck />, title: 'Livraison rapide', text: 'Partout au Maroc, en un temps record.' },
  { icon: <FiHeadphones />, title: 'Service client', text: 'Une équipe à votre écoute 7j/7.' },
  { icon: <FiCreditCard />, title: 'Paiement sécurisé', text: 'Transactions 100% protégées.' },
];

const STEPS = [
  { icon: <FiSearch />, title: 'Choisissez vos produits', text: 'Parcourez nos catégories et trouvez ce qu\u2019il vous faut.' },
  { icon: <FiShoppingCart />, title: 'Ajoutez au panier', text: 'Sélectionnez la quantité et ajoutez au panier en un clic.' },
  { icon: <FiCheckCircle />, title: 'Validez la commande', text: 'Renseignez vos infos de livraison et confirmez.' },
  { icon: <FiPackage />, title: 'Recevez chez vous', text: 'Votre commande est livrée rapidement à votre porte.' },
];

const STATS = [
  { number: '500+', label: 'Produits' },
  { number: '1000+', label: 'Clients satisfaits' },
  { number: '12', label: 'Villes livrées' },
  { number: '24/7', label: 'Support client' },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>

      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className={styles.heroContent}
        >
 {/*<span className={styles.badge}>À propos de nous</span>
 */}      <h1 className={styles.heroTitle}>
            Bienvenue chez <span>ElectroMedos</span>
          </h1>
          <p className={styles.heroText}>
            Votre boutique en ligne spécialisée dans l'électronique.
            Qualité, prix compétitifs et livraison rapide partout au Maroc.
          </p>
        </motion.div>
      </section>

      {/* ===== Stats ===== */}
      <section className={`container ${styles.statsSection}`}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className={styles.statCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            custom={i}
            variants={fadeUp}
          >
            <span className={styles.statNumber}>{s.number}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* ===== Mission ===== */}
      <section className={`container ${styles.missionSection}`}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className={styles.missionText}
        >
          <h2 className={styles.sectionTitle}>Notre mission</h2>
          <p className={styles.text}>
            Chez ElectroMedos, notre mission est de rendre la technologie accessible à tous.
            Nous combinons qualité, fiabilité et un service client à votre écoute pour vous offrir
            la meilleure expérience d'achat en ligne au Maroc.
          </p>
        </motion.div>
       <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          custom={1}
          className={styles.missionVisual}
        >
          <div className={styles.glowCircle}>
            <img src="/logo.jpg" alt="ElectroMedos" className={styles.glowLogo} />
          </div>
        </motion.div>
      </section>

      {/* ===== Pourquoi nous choisir ===== */}
      <section className={`container ${styles.valuesSection}`}>
        <motion.h2
          className={styles.sectionTitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
        >
          Pourquoi nous choisir ?
        </motion.h2>

        <div className={styles.valuesGrid}>
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              className={styles.valueCard}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              custom={i}
              variants={fadeUp}
              whileHover={{ y: -6 }}
            >
              <div className={styles.valueIcon}>{v.icon}</div>
              <h3 className={styles.valueTitle}>{v.title}</h3>
              <p className={styles.valueText}>{v.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Comment commander ===== */}
      <section className={`container ${styles.stepsSection}`}>
        <motion.h2
          className={styles.sectionTitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
        >
          Comment passer commande ?
        </motion.h2>
        <motion.p
          className={styles.sectionSubtitle}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          custom={1}
        >
          4 étapes simples pour recevoir vos produits
        </motion.p>

        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              className={styles.stepCard}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              custom={i}
              variants={fadeUp}
            >
              <div className={styles.stepNumber}>{i + 1}</div>
              <div className={styles.stepIcon}>{s.icon}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepText}>{s.text}</p>
              {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <motion.section
        className={styles.ctaSection}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeUp}
      >
        <h2 className={styles.ctaTitle}>Prêt à découvrir nos produits ?</h2>
        <p className={styles.ctaText}>Explorez dès maintenant notre catalogue et profitez de nos offres.</p>
        <a href="/products" className={styles.ctaButton}>Voir les produits</a>
      </motion.section>

    </div>
  );
}