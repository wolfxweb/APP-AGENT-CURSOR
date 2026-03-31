export type BasicData = {
  id: number;
  user_id: number;
  month: number;
  year: number;
  activity_type: string;
  clients_served: number;
  sales_revenue: number;
  sales_expenses: number;
  input_product_expenses: number;
  fixed_costs: number | null;
  pro_labore: number | null;
  other_fixed_costs: number | null;
  ideal_profit_margin: number | null;
  ideal_service_profit_margin: number | null;
  service_capacity: string | null;
  work_hours_per_week: number | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

export type BasicDataLog = {
  id: number;
  basic_data_id: number;
  change_description: string;
  created_at: string;
};

export type CalculatorCalculateResult = {
  suggested_price: number;
  price_relation_pct: number | null;
  implied_unit_cost: number;
};

export type CalculatorHistoryRow = {
  id: number;
  user_id: number;
  basic_data_id: number | null;
  month: number | null;
  year: number | null;
  product_name: string | null;
  current_price: number;
  current_margin: number;
  company_margin: number | null;
  desired_margin: number;
  suggested_price: number;
  price_relation: number | null;
  competitor_price: number | null;
  notes: string | null;
  created_at: string;
};

export type DiagnosticoOut = {
  basic_data_id: number | null;
  month: number;
  year: number;
  activity_type: string;
  revenue: number;
  sales_expenses: number;
  input_product_expenses: number;
  fixed_costs_total: number;
  sales_expense_ratio_pct: number | null;
  input_expense_ratio_pct: number | null;
  variable_margin_pct: number | null;
  operating_margin_pct: number | null;
  ideal_margin_pct: number | null;
  margin_gap_pct: number | null;
  health_label: string;
  insights: string[];
};

export type EventoVenda = {
  id: number;
  user_id: number;
  nome_evento: string;
  nota: number;
  aumenta_vendas: boolean;
  diminui_vendas: boolean;
  meses_afetados: number[] | null;
  is_padrao: boolean;
  created_at: string;
  updated_at: string;
};

export type MesImportancia = {
  id: number;
  user_id: number;
  year: number;
  month: number;
  nota_atribuida: number | null;
  ritmo_negocio_percentual: number | null;
  peso_mes: number | null;
  quantidade_vendas_real: number | null;
  quantidade_vendas_estimada: number | null;
  created_at: string;
  updated_at: string;
};

export type Categoria = {
  id: number;
  user_id: number;
  nome: string;
  created_at: string;
  updated_at: string;
};

export type Produto = {
  id: number;
  user_id: number;
  nome: string;
  categoria_id: number | null;
  basic_data_id: number | null;
  faturamento_por_mercadoria: number | null;
  preco_venda: number | null;
  custo_aquisicao: number | null;
  percentual_faturamento: number | null;
  quantidade_vendas: number | null;
  gastos_com_vendas: number | null;
  gastos_com_compras: number | null;
  margem_contribuicao_informada: number | null;
  margem_contribuicao_corrigida: number | null;
  margem_contribuicao_valor: number | null;
  custos_fixos: number | null;
  ponto_equilibrio: number | null;
  margem_operacional: number | null;
  created_at: string;
  updated_at: string;
};

export type PrioridadeItemOut = {
  ordem: number;
  codigo: string;
  titulo: string;
  descricao: string;
  score: number;
  eixo: string;
};

export type SimuladorSlice = {
  revenue: number;
  sales_expenses: number;
  input_product_expenses: number;
  fixed_costs_total: number;
  operating_margin_pct: number | null;
  variable_margin_pct: number | null;
  ideal_margin_pct?: number | null;
};

export type SimuladorScenarioOut = {
  basic_data_id: number;
  month: number;
  year: number;
  inputs: Record<string, number>;
  baseline: SimuladorSlice;
  simulated: SimuladorSlice;
  delta_operating_margin_pp: number | null;
  delta_variable_margin_pp: number | null;
};

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  activity_type: string;
  status: string;
  access_level: string;
  created_at: string;
};

export type AdminUsersPageOut = {
  items: AdminUserRow[];
  page: number;
  page_size: number;
  total: number;
};

export type AdminLicenseRow = {
  id: number;
  activation_key: string;
  status: string;
  activation_email: string | null;
  activation_date: string | null;
  created_at: string;
};

export type UserMe = {
  id: number;
  name: string;
  email: string;
  whatsapp: string | null;
  activity_type: string;
  gender: string | null;
  birth_day: number | null;
  birth_month: number | null;
  married: boolean | null;
  children: number | null;
  grandchildren: number | null;
  cep: string | null;
  street: string | null;
  neighborhood: string | null;
  state: string | null;
  city: string | null;
  complement: string | null;
  company_activity: string | null;
  specialty_area: string | null;
  ideal_profit_margin: number | null;
  service_capacity: string | null;
  status: string;
  access_level: string;
  onboarding_completed: boolean;
  ja_acessou: boolean;
  created_at: string;
};
