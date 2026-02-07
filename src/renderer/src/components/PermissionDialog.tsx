import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export function PermissionDialog(): React.JSX.Element | null {
  const [request, setRequest] = useState<any>(null)
  useEffect((): (() => void) => {
    if (!window.api) return (): void => {}

    void window.api.getPendingPermission().then((pending) => {
      if (pending) setRequest(pending)
    })

    const removeListener = window.api.onPermissionRequired((req) => {
      setRequest(req)
    })
    return (): void => removeListener()
  }, [])
  const respond = (decision: string): void => {
    if (!window.api) return
    window.api.sendPermissionDecision(request.id, decision)
    setRequest(null)
  }
  if (!request) return null

  return (
    <AlertDialog open={!!request} onOpenChange={(open) => !open && setRequest(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Allow Tool Execution?</AlertDialogTitle>
          <AlertDialogDescription>
            <pre className="text-xs">{JSON.stringify(request.params, null, 2)}</pre>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => respond('deny')}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => respond('approve_once')}>Allow Once</AlertDialogAction>
          <AlertDialogAction onClick={() => respond('approve_all')}>Allow All</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
