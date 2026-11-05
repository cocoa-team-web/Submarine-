-- После регистрации через Submarine Store замени email и выполни SQL в Supabase SQL Editor.
update public.profiles p
set role='owner'
from auth.users u
where p.id=u.id and lower(u.email)=lower('YOUR_EMAIL@example.com');
-- Убедись, что обновилась ровно одна строка.
