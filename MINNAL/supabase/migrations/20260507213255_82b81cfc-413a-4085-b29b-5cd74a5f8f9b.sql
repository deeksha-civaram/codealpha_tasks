CREATE TYPE public.task_category AS ENUM ('work','personal','study','health','shopping','other');
ALTER TABLE public.tasks ADD COLUMN category public.task_category NOT NULL DEFAULT 'other';