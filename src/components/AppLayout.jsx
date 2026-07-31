// src/components/AppLayout.jsx
// Envolve todas as rotas autenticadas com o TopNav fixo.
// Uso no router: <Route element={<AppLayout />}> ...rotas... </Route>

import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function AppLayout() {
  return (
    <div style={styles.shell}>
      <TopNav />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  shell: {
    height: '100dvh',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    background: '#000',
    overflow: 'hidden',
  },
  main: {
    minHeight: 0,
    overflow: 'hidden',
  },
};
