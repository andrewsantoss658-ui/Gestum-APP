
-- 1. Add missing UPDATE policies
CREATE POLICY "Users update own cash flow"
ON public.cash_flow FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sales"
ON public.sales FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sale items"
ON public.sale_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND s.user_id = auth.uid()));

CREATE POLICY "Users update own nota fiscal items"
ON public.nota_fiscal_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_items.nota_fiscal_id AND nf.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.notas_fiscais nf WHERE nf.id = nota_fiscal_items.nota_fiscal_id AND nf.user_id = auth.uid()));

-- 2. Revoke EXECUTE on internal SECURITY DEFINER trigger functions (not meant to be called directly)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_role_on_signup() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_master_role() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_master_role_update() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_conversation_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
-- has_role stays callable by authenticated (used by RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 3. Realtime channel authorization — restrict subscriptions per user
-- Topic convention: "user:<auth_uid>" or conversation-scoped channels
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own realtime topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id::text = replace(realtime.topic(), 'conversation:', '')
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'master'))
  )
);

CREATE POLICY "Users broadcast to own realtime topics"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id::text = replace(realtime.topic(), 'conversation:', '')
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'master'))
  )
);
