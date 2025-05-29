import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "./supabase"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error) {
          console.error("Auth error:", error)
          return null
        }

        if (data.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            image: data.user.user_metadata?.avatar_url,
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        const supabase = createClient()
        
        // Check if user exists in our database
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          // Create new user in our database
          const { error } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            })

          if (error) {
            console.error("Error creating user:", error)
            return false
          }

          // Create user profile
          await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              fitness_level: 'beginner',
              goals: [],
              available_equipment: ['bodyweight'],
              available_time: 30,
            })
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
})