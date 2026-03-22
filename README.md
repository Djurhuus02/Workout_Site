LiftTracker

LiftTracker is a small workout tracking web app built with React + TypeScript + Vite, using Supabase for authentication and data storage, and deployed on Azure App Service.

Features
	•	Sign in with Google
	•	Create and save workouts
	•	View workout history
	•	Track personal records and progress
	•	Browse exercises by muscle group
	•	Persistent workout data per user

Tech Stack
	•	React
	•	TypeScript
	•	Vite
	•	Supabase Auth
	•	Supabase Database
	•	Azure App Service
	•	GitHub Actions

Getting Started

1. Clone the repository

git clone https://github.com/Djurhuus02/Workout_Site.git
cd Workout_Site

2. Install dependencies

npm install

3. Create environment variables

Create a .env file in the project root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run locally

npm run dev

Supabase Setup

The app uses a workouts table in Supabase.

Example setup:

create extension if not exists pgcrypto;

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

create policy "Users can view own workouts"
on public.workouts
for select
using (auth.uid() = user_id);

create policy "Users can insert own workouts"
on public.workouts
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own workouts"
on public.workouts
for delete
using (auth.uid() = user_id);

Deployment

This project is deployed with:
	•	GitHub Actions for build/deploy pipeline
	•	Azure App Service for hosting

Project Structure

src/
  components/
  context/
  hooks/
  lib/
  pages/
  types/

Status

This is a small personal project built to practice:
	•	authentication
	•	cloud deployment
	•	database integration
	•	full-stack workflow with React and Supabase

Future Improvements
	•	Edit workouts
	•	Better progress charts
	•	More detailed statistics
	•	Improved mobile UX

Author

Mathias Djurhuus
