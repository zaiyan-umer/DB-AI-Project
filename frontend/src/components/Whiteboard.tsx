import { computed, createUserId, Tldraw } from 'tldraw'
import { useSync } from '@tldraw/sync'
import 'tldraw/tldraw.css'

type WhiteboardProps = {
    groupId: string
    userId: string
    userName: string
    userColor: string
}

export default function Whiteboard({ groupId, userId, userName, userColor }: WhiteboardProps) {

    const store = useSync({
        uri: `wss://myserver.com/sync/room-${groupId}`,
        assets: {
            async upload(_asset, _file) {
                return { src: '' } 
            },
            resolve(asset) {
                return asset.props.src
            },
        },
        users: {
            currentUser: computed('current-user', () => ({
                id: createUserId(userId),
                typeName: 'user',
                name: userName,
                color: userColor,
                imageUrl: '',
                meta: {},
            })),
        },
    });

    if (store.status === "loading") {
        return <div>Connecting to collaboration session...</div>;
    }

    if (store.status === "error") {
        return <div>Failed to connect: {store.error.message}</div>;
    }

    return <Tldraw store={store.store} />;
}   