-- ============================================================================
-- Corrige duas falhas no controle de créditos
--
-- 1) A política "profiles_own" era FOR ALL, o que inclui UPDATE. Como a chave
--    anon do Supabase é pública (vai no bundle do navegador), qualquer cliente
--    logado podia rodar no console:
--        supabase.from('profiles').update({ credits: 999999 }).eq('id', seuId)
--    e se dar créditos infinitos. Verificado em 29/09/2026: o UPDATE passa.
--
-- 2) O débito era feito em duas etapas no código (lê saldo, depois grava
--    saldo-1). Com dois cliques simultâneos, ambos liam o mesmo valor e
--    gravavam o mesmo resultado: dois sites gerados, um crédito cobrado.
--
-- Depois desta migração, créditos só mudam por:
--   - handle_new_user()    (trigger security definer, dá os 50 iniciais)
--   - webhook da ApplyFy   (service role, ignora RLS)
--   - debitar_credito()    (security definer, desconta 1 de forma atômica)
-- ============================================================================

-- 1) Usuário passa a apenas LER o próprio perfil
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2) Débito atômico: verifica e desconta na mesma operação.
--    Não recebe o id como parâmetro de propósito — usa auth.uid(), assim
--    ninguém consegue debitar a conta de outra pessoa.
--    Retorna o novo saldo, ou NULL se não havia crédito suficiente.
CREATE OR REPLACE FUNCTION public.debitar_credito()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  saldo INTEGER;
BEGIN
  UPDATE public.profiles
     SET credits = credits - 1
   WHERE id = auth.uid()
     AND credits >= 1
  RETURNING credits INTO saldo;

  RETURN saldo;
END;
$fn$;

REVOKE ALL ON FUNCTION public.debitar_credito() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debitar_credito() TO authenticated;
