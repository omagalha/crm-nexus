import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NexusSymbol from '../components/NexusSymbol.jsx';
import { redefinirSenha } from '../services/authService.js';
import { supabase } from '../services/supabase.js';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPronto(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    const formData = new FormData(e.currentTarget);
    const novaSenha = formData.get('senha');
    const confirmacao = formData.get('confirmacao');

    if (novaSenha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      await redefinirSenha(novaSenha);
      setConcluido(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setErro('Não foi possível redefinir a senha. O link pode ter expirado.');
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

        {concluido ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <h1>Senha redefinida!</h1>
            <p style={{ color: 'var(--nexus-muted)', margin: 0, lineHeight: 1.5 }}>
              Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes…
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Ir para o login
            </Link>
          </div>
        ) : !pronto ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <h1>Link inválido</h1>
            <p style={{ color: 'var(--nexus-muted)', margin: 0, lineHeight: 1.5 }}>
              Este link de recuperação é inválido ou já expirou. Solicite um novo link.
            </p>
            <Link to="/esqueci-senha" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1>Nova senha</h1>
            <p style={{ color: 'var(--nexus-muted)', margin: 0, lineHeight: 1.5 }}>
              Escolha uma senha forte com pelo menos 6 caracteres.
            </p>

            {erro && <p className="login-erro">{erro}</p>}

            <label>
              Nova senha
              <input name="senha" type="password" autoComplete="new-password" required minLength={6} />
            </label>
            <label>
              Confirmar nova senha
              <input name="confirmacao" type="password" autoComplete="new-password" required minLength={6} />
            </label>

            <button className="btn btn-primary" type="submit" disabled={carregando}>
              {carregando ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
