import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function DesktopNotFound({ setIsHovering }: { setIsHovering: (val: boolean) => void }) {
  return (
    <section className="layout-content desktop-page-layout desktop-not-found">
      <div className="not-found-content">
        <motion.h1
          className="not-found-code"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          404
        </motion.h1>
        <motion.p
          className="not-found-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          THIS PAGE DOESN'T EXIST.
        </motion.p>
        <motion.p
          className="not-found-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          The link may be broken, or the page may have been removed.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link
            to="/"
            className="not-found-btn"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            BACK TO HOME
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
