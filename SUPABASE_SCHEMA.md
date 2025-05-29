# Supabase Database Schema

This document outlines the database schema for the AI Workout Pro application.

## Tables

### 1. users
Primary user information table.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 2. user_profiles
Extended user profile information for fitness preferences.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fitness_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT[] DEFAULT '{}',
  available_equipment TEXT[] DEFAULT '{"bodyweight"}',
  available_time INTEGER DEFAULT 30,
  limitations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. workout_sessions
Records of completed or attempted workout sessions.

```sql
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  target_muscles TEXT[] DEFAULT '{}',
  duration INTEGER, -- in minutes
  exercises JSONB, -- workout data from AI
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  calories_burned INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_created_at ON workout_sessions(created_at);
```

### 4. favorite_workouts
User's saved favorite workout routines.

```sql
CREATE TABLE favorite_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_data JSONB NOT NULL, -- workout menu data
  title VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE favorite_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorite_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorite_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON favorite_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorite_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_favorite_workouts_user_id ON favorite_workouts(user_id);
```

## Setup Instructions

1. **Enable UUID Extension** (if not already enabled):
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Set up Row Level Security (RLS)**:
   All tables have RLS policies that ensure users can only access their own data.

3. **Environment Variables**:
   Add these to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Authentication Setup**:
   Configure Supabase Auth with the providers you want to use (Google, GitHub, etc.)

## Data Relationships

- `users` → `user_profiles` (1:1)
- `users` → `workout_sessions` (1:many)
- `users` → `favorite_workouts` (1:many)

## Indexes

The schema includes indexes on frequently queried columns:
- `workout_sessions.user_id`
- `workout_sessions.created_at`
- `favorite_workouts.user_id`

## Security

- All tables use Row Level Security (RLS)
- Users can only access their own data
- Foreign key constraints ensure data integrity
- Check constraints validate data quality

## Sample Data

You can insert sample data for testing:

```sql
-- Sample user profile
INSERT INTO user_profiles (id, fitness_level, goals, available_equipment, available_time)
VALUES (
  'your-user-id',
  'intermediate',
  '{"筋力向上", "体重減少"}',
  '{"自重", "ダンベル", "ヨガマット"}',
  45
);

-- Sample workout session
INSERT INTO workout_sessions (user_id, title, target_muscles, duration, difficulty)
VALUES (
  'your-user-id',
  '上半身ワークアウト',
  '{"胸", "肩", "腕"}',
  30,
  'medium'
);
```