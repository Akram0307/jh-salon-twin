import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
  message?: string
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected UI error' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/80">Module recovery mode</p>
          <h3 className="mt-2 text-lg font-semibold text-white">This section hit a rendering issue</h3>
          <p className="mt-2 text-rose-100/80">{this.state.message ?? 'A component failed while rendering.'}</p>
        </div>
      )
    }

    return this.props.children
  }
}
