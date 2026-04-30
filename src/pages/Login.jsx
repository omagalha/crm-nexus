import { useState } from 'react';
import NexusSymbol from '../components/NexusSymbol.jsx';
import { login } from '../services/authService.js';

export default function Login() {
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setCarregando(true);
    const formData = new FormData(event.currentTarget);
    try {
      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
    } catch (e) {
      setErro('E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark">
            <NexusSymbol size={22} color="#3ddc68" />
          </span>
          <div>
            <strong>Nexus Educação</strong>
            <small>CRM Comercial</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h1>Entrar</h1>

          {erro && <p className="login-erro">{erro}</p>}

          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Senha
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
