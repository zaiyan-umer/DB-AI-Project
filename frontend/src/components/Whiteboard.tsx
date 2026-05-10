import { useUpdateWhiteboard, useWhiteboard } from '@/hooks/useWhiteboard'
import { useEffect, useRef, useState } from 'react'
import { createTLStore, getSnapshot, loadSnapshot, Tldraw, type TLStoreWithStatus } from 'tldraw'
import 'tldraw/tldraw.css'

type WhiteboardProps = {
    groupId: string
}

export default function Whiteboard({ groupId }: WhiteboardProps) {
    const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' })
    const { data: boardData, isLoading, isError, error } = useWhiteboard(groupId)
    const updateWhiteboard = useUpdateWhiteboard(groupId)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (isLoading || !groupId) return

        if (isError) {
            setStoreWithStatus({ status: 'error', error: error as Error })
            return
        }

        const store = createTLStore()

        // only load if a snapshot actually exists
        if (boardData && boardData.snapshot) {
            loadSnapshot(store, boardData.snapshot)
        }

        // debounced save on every store change
        const unsub = store.listen(() => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                const { document } = getSnapshot(store)
                updateWhiteboard.mutate({ document })
            }, 2000)
        })

        setStoreWithStatus({ status: 'synced-local', store })

        return () => {
            unsub()
            // final save on unmount
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            const { document } = getSnapshot(store)
            updateWhiteboard.mutate({ document })
        }
    }, [groupId, isLoading])

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Tldraw store={storeWithStatus} />
        </div>
    )
}   