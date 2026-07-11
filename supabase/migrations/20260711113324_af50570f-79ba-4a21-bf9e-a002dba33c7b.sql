
CREATE POLICY "Deny client role inserts" ON public.user_roles FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "Deny client role updates" ON public.user_roles FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny client role deletes" ON public.user_roles FOR DELETE TO authenticated, anon USING (false);
