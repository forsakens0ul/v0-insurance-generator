/*
  # 创建报价器配置历史表

  1. 新建表
    - `quoter_configs`
      - `id` (uuid, primary key) - 记录ID
      - `name` (text) - 配置名称
      - `config_data` (jsonb) - 完整的配置数据（JSON格式）
      - `created_at` (timestamptz) - 创建时间
      - `updated_at` (timestamptz) - 更新时间
      
  2. 安全策略
    - 启用 RLS
    - 允许所有人读取配置（公开读取）
    - 允许所有人创建配置（用于演示目的）
    
  3. 索引
    - 按创建时间排序的索引
*/

-- 创建报价器配置表
CREATE TABLE IF NOT EXISTS quoter_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 启用 RLS
ALTER TABLE quoter_configs ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取
CREATE POLICY "Anyone can read quoter configs"
  ON quoter_configs
  FOR SELECT
  USING (true);

-- 创建策略：允许所有人创建
CREATE POLICY "Anyone can create quoter configs"
  ON quoter_configs
  FOR INSERT
  WITH CHECK (true);

-- 创建索引：按创建时间倒序
CREATE INDEX IF NOT EXISTS idx_quoter_configs_created_at 
  ON quoter_configs(created_at DESC);