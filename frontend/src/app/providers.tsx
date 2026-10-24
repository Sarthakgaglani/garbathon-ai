import React, { createContext, useContext, ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

const AppContext = createContext<{ initialized: boolean }>({ initialized: true })

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <AppContext.Provider value={{ initialized: true }}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
