import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session) fetchPerfil(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchPerfil(userId) {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();
    setPerfil(data);
  }

  async function updatePerfil(payload) {
    if (!session?.user?.id) throw new Error('Usuário não autenticado.');

    const nextPerfil = {
      id: session.user.id,
      email: perfil?.email ?? session.user.email,
      perfil: perfil?.perfil ?? 'consulta',
      ativo: perfil?.ativo ?? true,
      ...perfil,
      ...payload,
    };

    const { error } = await supabase
      .from('perfis')
      .upsert(nextPerfil, { onConflict: 'id' });

    if (error) throw error;
    setPerfil(nextPerfil);
    return nextPerfil;
  }

  return (
    <AuthContext.Provider value={{ session, perfil, loading: session === undefined, updatePerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
