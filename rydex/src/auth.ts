import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import User from "./models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
 
const ADMIN_EMAILS = ['patraganesha35@gmail.com', 'asitraut2006@gmail.com'];
 
if (!process.env.GOOGLE_CLIENT_ID) console.warn("⚠️ GOOGLE_CLIENT_ID is missing");
if (!process.env.GOOGLE_CLIENT_SECRET) console.warn("⚠️ GOOGLE_CLIENT_SECRET is missing");
if (!process.env.AUTH_SECRET) console.warn("⚠️ AUTH_SECRET is missing");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }
        
        await connectDb()
        const user = await User.findOne({ email: credentials.email })
        
        if (!user || !user.password) {
          throw new Error("User does not exist")
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password)
        
        if (!isMatch) {
          throw new Error("Incorrect password")
        }

        if (ADMIN_EMAILS.includes(user.email) && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDb()
          let dbUser = await User.findOne({ email: user.email })
          
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              role: ADMIN_EMAILS.includes(user.email as string) ? 'admin' : 'user'
              // image: user.image (optional)
            })
          } else if (ADMIN_EMAILS.includes(user.email as string) && dbUser.role !== 'admin') {
            dbUser.role = 'admin';
            await dbUser.save();
          }
          
          // Attach DB data to the user object so JWT callback can see it
          user.id = dbUser._id.toString()
          user.role = dbUser.role
          return true
        } catch (error) {
          console.error("Error during Google sign-in:", error)
          return false
        }
      }
      return true 
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/", 
    error: "/", 
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60, // 10 days
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true // Added for stability in various environments
})