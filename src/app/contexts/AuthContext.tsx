"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { auth } from "../firebase"
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth"

interface User {
  id: string
  email: string | null
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_EXPIRY_TIME = 15 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const loginTime = localStorage.getItem('loginTime')
        const currentTime = new Date().getTime()

        if (loginTime && (currentTime - parseInt(loginTime, 10) > SESSION_EXPIRY_TIME)) {
          console.log("Sesión expirada por inactividad. Cerrando sesión...")
          signOut(auth)
        } else {
          setUser({ id: firebaseUser.uid, email: firebaseUser.email })
        }
      } else {
        setUser(null)
        localStorage.removeItem('loginTime')
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem('loginTime', new Date().getTime().toString())
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const logout = async () => {
    // ✅ LIMPIAR CACHE AL CERRAR SESIÓN
    if (user) {
      localStorage.removeItem(`portfolio_${user.id}`)
      localStorage.removeItem(`portfolioTime_${user.id}`)
      localStorage.removeItem(`composition_${user.id}`)
      localStorage.removeItem(`compositionTime_${user.id}`)
    }
    localStorage.removeItem('exchangeRate')
    localStorage.removeItem('exchangeRateTime')
    localStorage.removeItem('loginTime')
    
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}