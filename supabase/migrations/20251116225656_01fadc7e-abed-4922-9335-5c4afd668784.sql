-- Grant admin access to rac.matic@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('f19af17b-389e-490e-95d5-7567b3e2fb9e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;