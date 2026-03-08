
-- Allow admins to insert into points_ledger for manual adjustments
CREATE POLICY "Admins can insert ledger entries"
ON public.points_ledger
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
