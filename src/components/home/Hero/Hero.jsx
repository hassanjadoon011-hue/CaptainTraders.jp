import { useNavigate } from 'react-router-dom'
import styles from './hero.module.css'
import heroImage from './captain-traders.jpg'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.buttons}>
          <button onClick={() => navigate('/cars')}>
            View Stock
          </button>

          <button onClick={() => navigate('/contact')}>
            Contact Us
          </button>
        </div>
      </div>
    </section>
  )
}