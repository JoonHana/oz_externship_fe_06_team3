import { createContext, useContext } from 'react'

interface ModalContextValue {
  onClose?: () => void
}

export const ModalContext = createContext<ModalContextValue>({})
export const useModalContext = () => useContext(ModalContext)
