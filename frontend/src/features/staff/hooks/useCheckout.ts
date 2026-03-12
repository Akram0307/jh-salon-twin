import { useState } from 'react'

export const useCheckout = () => {
  const [checkoutState, setCheckoutState] = useState('idle')
  const run = async (_payload: unknown) => ({ success: true })
  const processPayment = {
    mutateAsync: run,
    mutate: (payload: unknown) => { void run(payload) },
    isPending: false,
  }
  return { checkoutState, setCheckoutState, processPayment }
}
