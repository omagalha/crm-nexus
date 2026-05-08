import { useState } from 'react';
import { Link } from 'react-router-dom';
import NexusSymbol from '../components/NexusSymbol.jsx';
import { solicitarRedefinicaoSenha } from '../services/authService.js';

export default function EsqueciSenha() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const email = new FormData(e.currentTarget).get('email');
    try {
      await solicitarRedefinicaoSenha(email);
      setEnviado(true);
    } catch {
      setErro('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
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

        {enviado ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <h1>E-mail enviado</h1>
            <p style={{ color: 'var(--nexus-muted)', margin: 0, lineHeight: 1.5 }}>
              Verifique sua caixa de entrada e clique no link de redefinição de senha.
              O link expira em 1 hora.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1>Recuperar senha</h1>
            <p style={{ color: 'var(--nexus-muted)', margin: '0', lineHeight: 1.5 }}>
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>

            {erro && <p className="login-erro">{erro}</p>}

            <label>
              E-mail
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <button className="btn btn-primary" type="submit" disabled={carregando}>
              {carregando ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>

            <Link
              to="/login"
              style={{ color: 'var(--nexus-muted)', fontSize: '0.875rem', textAlign: 'center', textDecoration: 'none' }}
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
