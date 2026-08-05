// src/components/TopNav.jsx
// Barra superior fixa, visível em todos os módulos autenticados.
// Ajuste o import do logo conforme a organização de assets do projeto.

import { NavLink } from 'react-router-dom';
import { Home, Target, Wallet, ClipboardList, BarChart3, Users } from 'lucide-react';
import logoUrl from '../assets/pokersync-logo.svg'; // TODO: ajuste o path se necessário

const NAV = [
  { to: '/',        label: 'Início',  icon: Home },
  { to: '/treino',  label: 'Treino',  icon: Target },
  { to: '/banca',   label: 'Banca',   icon: Wallet },
  { to: '/revisao', label: 'Revisão', icon: ClipboardList },
  { to: '/nucleo',  label: 'Núcleo',  icon: BarChart3, soon: true },
  { to: '/equipe',  label: 'Equipe',  icon: Users,     soon: true },
];

export default function TopNav() {
  return (
    <header style={styles.nav}>
      <NavLink to="/" style={styles.brand}>
        <img src={logoUrl} alt="PokerSync" style={styles.logo} />
      </NavLink>

      <nav style={styles.links}>
        {NAV.map(({ to, label, icon: Icon, soon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive && !soon ? styles.linkActive : {}),
              ...(soon ? styles.linkSoon : {}),
            })}
            onClick={soon ? (e) => e.preventDefault() : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
            {soon && <span style={styles.soonBadge}>em breve</span>}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(12px, 1.8vh, 20px) clamp(20px, 4vw, 48px)',
    background: '#000',
    borderBottom: '0.5px solid #1E1E1E',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    height: 'clamp(36px, 4.5vh, 56px)',
    width: 'auto',
    display: 'block',
  },
  links: {
    display: 'flex',
    gap: 'clamp(4px, 0.6vw, 12px)',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 8,
    color: 'rgba(255,255,255,.6)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background .2s, color .2s',
  },
  linkActive: {
    color: '#fff',
    background: '#111',
  },
  linkSoon: {
    color: 'rgba(255,255,255,.3)',
    cursor: 'not-allowed',
  },
  soonBadge: {
    fontSize: 9,
    padding: '2px 6px',
    background: 'rgba(230,198,116,.15)',
    color: '#E6C674',
    borderRadius: 4,
    marginLeft: 4,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
  },
};
