import { useEffect, useState } from 'react'

export function PermissionDialog(): React.JSX.Element | null {
  const [request, setRequest] = useState<any>(null)
  useEffect((): (() => void) => {
    const removeListener = window.api.onPermissionRequired((req) => {
      setRequest(req)
    })
    return (): void => removeListener()
  }, [])
  const respond = (decision: string): void => {
    window.api.sendPermissionDecision(request.id, decision)
    setRequest(null)
  }
  if (!request) return null

  return (
    <div className="flex items-center justify-center bg-black/50 fixed inset-0 z-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 ">Allow Tool Execution?</h3>

        <div className="mb-2 text-sm text-zinc-600">
          <strong className="text-zinc-900">Tool:</strong>{' '}
          <span className="font-mono text-blue-600">{request.toolName}</span>
        </div>

        <div className="mb-6 max-h-40 overflow-auto rounded-md bg-zinc-100 p-3 text-xs font-mono">
          <pre>{JSON.stringify(request.params, null, 2)}</pre>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => respond('deny')}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-700"
          >
            Deny
          </button>
          <button
            onClick={() => respond('approve_once')}
            className="rounded-md  bg-blue-600 px-2 py-1 font-medium text-white hover:bg-blue-700"
          >
            Allow Once
          </button>
          <button
            onClick={() => respond('approve_all')}
            className="rounded-md  bg-zinc-900 px-2 py-1 font-medium text-white hover:bg-zinc-800"
          >
            Always Allow
          </button>
        </div>
      </div>
    </div>
  )
}
