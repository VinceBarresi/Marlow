ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'staff', 'admin'));

INSERT INTO users (id, email, password_hash, name, role)
SELECT '8f4c2a10-6b3e-4d5a-9c71-2e0b6a1d4f88', 'admin@marlow.test', password_hash, 'Avery Chen', 'admin'
FROM users
WHERE email = 'staff@marlow.test'
ON CONFLICT (email) DO NOTHING;
