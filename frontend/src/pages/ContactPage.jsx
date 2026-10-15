import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiSend,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import styles from './ContactPage.module.css';


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const CONTACT_INFO = [
  { icon: <FiPhone />, title: 'Téléphone', text: '+212 6 60 00 83 27' },
  { icon: <FiMail />, title: 'Email', text: 'contact@electromedos.com' },
  { icon: <FiMapPin />, title: 'Adresse', text: 'Fès, Maroc' },
  { icon: <FiClock />, title: 'Horaires', text: 'Lun - Sam, 9h - 19h' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: brancher sur l'API backend (Django REST) une fois prête
    console.log('Formulaire envoyé :', form);
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

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
{/*           <span className={styles.badge}>Contactez-nous</span>
 */}          <h1 className={styles.heroTitle}>
            Une question ? <span>On est là</span>
          </h1>
          <p className={styles.heroText}>
            Notre équipe vous répond rapidement, du lundi au samedi.
            Écrivez-nous ou choisissez le canal qui vous convient.
          </p>
        </motion.div>
      </section>

      {/* ===== Infos de contact ===== */}
      <section className={`container ${styles.infoSection}`}>
        {CONTACT_INFO.map((info, i) => (
          <motion.div
            key={info.title}
            className={styles.infoCard}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            custom={i}
            variants={fadeUp}
          >
            <div className={styles.infoIcon}>{info.icon}</div>
            <h3 className={styles.infoTitle}>{info.title}</h3>
            <p className={styles.infoText}>{info.text}</p>
          </motion.div>
        ))}
      </section>

      {/* ===== Formulaire + WhatsApp ===== */}
      <section className={`container ${styles.formSection}`}>
        <motion.form
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <h2 className={styles.sectionTitle}>Envoyez-nous un message</h2>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="name">Nom complet</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Votre nom"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vous@exemple.com"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="subject">Sujet</label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Sujet de votre message"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              placeholder="Écrivez votre message ici..."
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            <FiSend /> Envoyer le message
          </button>

          {sent && <p className={styles.successMsg}>Message envoyé avec succès !</p>}
        </motion.form>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          custom={1}
          className={styles.sideCard}
        >
          <div className={styles.glowCircleSmall}>
            <FaWhatsapp />
          </div>
          <h3 className={styles.sideTitle}>Réponse plus rapide ?</h3>
          <p className={styles.sideText}>
            Contactez-nous directement sur WhatsApp, notre équipe répond en quelques minutes.
          </p>
          <a
            href="https://wa.me/+212660008327"
            target="_blank"
            rel="noreferrer"
            className={styles.whatsappButton}
          >
            <FaWhatsapp /> Écrire sur WhatsApp
          </a>
        </motion.div>
      </section>

    </div>
  );
}