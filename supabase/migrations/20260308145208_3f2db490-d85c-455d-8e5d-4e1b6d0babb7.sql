
-- Create trigger on auth.users to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create profile for the user that just signed up
INSERT INTO public.profiles (user_id, username, first_name)
SELECT '2afe47ba-78a2-4825-879d-49f6ce2c5973', 'testuser123', 'testuser123'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = '2afe47ba-78a2-4825-879d-49f6ce2c5973');

-- Create user_roles entry too
INSERT INTO public.user_roles (user_id, role)
SELECT '2afe47ba-78a2-4825-879d-49f6ce2c5973', 'user'
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '2afe47ba-78a2-4825-879d-49f6ce2c5973');
