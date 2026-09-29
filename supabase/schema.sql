-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 50,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vendas (preenchida manualmente pelo usuário)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sites gerados (log de gerações)
CREATE TABLE generated_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  niche TEXT,
  city TEXT,
  palette TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sites publicados (acessíveis publicamente via /s/[slug])
CREATE TABLE published_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_sites ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário vê apenas seus próprios dados
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "sales_own" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "generated_sites_own" ON generated_sites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "published_sites_own" ON published_sites FOR ALL USING (auth.uid() = user_id);

-- Política pública: qualquer um pode LER sites publicados (para servir as páginas)
CREATE POLICY "published_sites_public_read" ON published_sites FOR SELECT USING (true);
