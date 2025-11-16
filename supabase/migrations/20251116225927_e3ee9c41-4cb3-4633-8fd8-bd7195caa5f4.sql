-- Grant premium access to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('f19af17b-389e-490e-95d5-7567b3e2fb9e', 'premium')
ON CONFLICT (user_id, role) DO NOTHING;