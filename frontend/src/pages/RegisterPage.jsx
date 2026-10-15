import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getErrorMessage } from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      await login(form.username, form.password);
      notify('Compte créé avec succès', 'success');
      navigate('/');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="auth-card auth-card--wide">
        <h1>Inscription</h1>
        <p className="auth-card__subtitle">Créez votre compte ElectroMedos</p>
        <form onSubmit={handleSubmit} className="form form--grid">
          <label>
            Prénom
            <input type="text" name="first_name" className="input" value={form.first_name} onChange={handleChange} />
          </label>
          <label>
            Nom
            <input type="text" name="last_name" className="input" value={form.last_name} onChange={handleChange} />
          </label>
          <label className="form__full">
            Nom d&apos;utilisateur
            <input type="text" name="username" className="input" value={form.username} onChange={handleChange} required />
          </label>
          <label className="form__full">
            Email
            <input type="email" name="email" className="input" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Mot de passe
            <input type="password" name="password" className="input" value={form.password} onChange={handleChange} required minLength={8} />
          </label>
          <label>
            Confirmer
            <input type="password" name="password_confirm" className="input" value={form.password_confirm} onChange={handleChange} required />
          </label>
          <button type="submit" className="btn btn--primary btn--full form__full" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-card__footer">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </motion.div>
  );
}
