import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';
import { productService } from '../services/productService';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productService.getCategories().then(({ data }) => {
      setCategories(data.results || data);
    }).catch(() => {});
  }, []);

  return (
    <div className={styles.layout}>
      <div className={styles.headerGroup}>
        <TopBar />
        <Header categories={categories} />
        <NavBar categories={categories} />
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
