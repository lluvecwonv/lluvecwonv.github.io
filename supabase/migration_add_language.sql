-- Migration: Add language column to posts table
-- Run this on existing databases to add multilingual support

-- Add language column with default 'ko' (existing posts are Korean)
alter table public.posts
  add column if not exists language text not null default 'ko';

-- Update any existing posts that don't have a language set
update public.posts set language = 'ko' where language is null;
