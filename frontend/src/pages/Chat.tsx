import { useState, useEffect } from 'react';
import socket from '../socket';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Chat = () => {
    type Message = {
        content: string;
        sender: string;
    }

    const [messages, setMessages] = useState<Message[]>([]);
    const [course, setCourse] = useState('');
    const [roomId, setRoomId] = useState('');
    const [joined, setJoined] = useState(false);
    const [message, setMessage] = useState('');
    const { data } = useCurrentUser();

    const sendMessage = () => {
        const { user } = data;
        if (!roomId || !user?.id || !message.trim()) {
            console.log(user.id);

            console.log("Input issue");
            return;
        }


        socket.emit('send_message', {
            roomId,
            senderId: user.id,
            content: message.trim()
        })
        setMessage('')
    }

    const joinRoom = () => {
        if (course) {
            socket.emit('join_room', course);
        }
    }

    useEffect(() => {
        console.log(data.user);

        socket.on('connect', () => {
            console.log("I've joined");
        })

        socket.on('joined_room', (id, roomName) => {
            console.log(id, "has joined", roomName);
        })

        socket.on('room_joined', (room) => {
            setRoomId(room.roomId);
            setJoined(true);
        })

        socket.on('prev_messages', (prevMessages) => {
            setMessages(prevMessages);
        })

        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        socket.on('error', (err) => {
            console.log('socket validation error:', err);
        })

        return () => {
            socket.off('connect');
            socket.off('joined_room');
            socket.off('room_joined');
            socket.off('prev_messages');
            socket.off('receive_message');
            socket.off('error');
        };
    }, [])


    if (!joined) {
        return (
            <div className='bg-black text-white w-screen h-screen flex justify-center items-center'>
                <input
                    className='px-6 py-4 mx-2 border border-white'
                    placeholder="Enter course name"
                    onChange={(e) => setCourse(e.target.value)}
                />
                <button className='text-white' onClick={joinRoom}>Join Room</button>
            </div>
        );
    }

    return (
        <div className='bg-black text-white w-screen h-screen flex justify-center items-center'>
            <div className='text-white text-l'>
                {messages.map((msg, i) => (
                    <p key={i}>{msg.content}</p>
                ))}
            </div>
            <input
                className='px-6 py-4 mx-2 border border-white'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
            />
            <button className='text-white' onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;