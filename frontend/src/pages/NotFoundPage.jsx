import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container page not-found">
      <h1>404</h1>
      <p>Page introuvable.</p>
      <Link to="/" className="btn btn--primary">Retour à l&apos;accueil</Link>
    </div>
  );
}
