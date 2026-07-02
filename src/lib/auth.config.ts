import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

// Simple user interface that matches our backend
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId?: string;
  image?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        try {
          const startResponse = await fetch(`${API_URL}/api/auth/login/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (!startResponse.ok) return null;

          const startData = await startResponse.json();
          const passwordResponse = await fetch(`${API_URL}/api/auth/login/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              challengeId: startData.challengeId,
              nonce: startData.nonce,
              password,
            }),
          });

          if (!passwordResponse.ok) return null;

          const data = await passwordResponse.json();
          if (!data.user || !data.accessToken) {
            return null;
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            organizationId: data.user.organizationId,
          } as User;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async signIn({ user: _user, account, profile: _profile }) {
      if (account?.provider) {
        try {
          // For OAuth providers, we'll handle user creation in the backend
          // This is a simplified version - in production you'd want more robust handling
          return true;
        } catch (error) {
          console.error('OAuth signin error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as User).role;
        token.organizationId = (user as User).organizationId;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).provider = token.provider as string;
        (session.user as any).organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (1 month)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
