import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function Whiteboard() {
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw />
		</div>
	)
}