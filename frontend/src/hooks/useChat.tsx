import socket from "@/socket";
import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";


export type Group = {
    roomId: string;
    courseName: string;
    members: number;
}

export type Message = {
    id: string;
    createdAt: Date | null;
    roomId: string;
    senderId: string;
    content: string;
    senderName: string
}

// const mockGroups: Group[] = [
//     { roomId: "1", courseName: "Data Structures", members: 45 },
//     { roomId: "2", courseName: "Machine Learning", members: 12 },
//     { roomId: "3", courseName: "Web Dev Bootcamp", members: 89 },
//     { roomId: "4", courseName: "Algorithms Practice", members: 34 },
// ];

// const mockMessages: Message[] = [
//     { id: "1", createdAt: new Date("2024-01-01T10:30:00"), roomId: "1", senderId: "sarah-chen", senderName: "Sarah Chen", content: "Has anyone finished the assignment yet?" },
//     { id: "2", createdAt: new Date("2024-01-01T10:32:00"), roomId: "1", senderId: "mike-johnson", senderName: "Mike Johnson", content: "I'm still working on problem 3. It's tricky!" },
//     { id: "3", createdAt: new Date("2024-01-01T10:35:00"), roomId: "1", senderId: "you", senderName: "You", content: "I can help with that! The key is to use recursion." },
//     { id: "4", createdAt: new Date("2024-01-01T10:36:00"), roomId: "1", senderId: "sarah-chen", senderName: "Sarah Chen", content: "That would be great! Can you explain?" },
// ];
export function useChat() {
    const { data } = useCurrentUser();

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group>();
    // const [messages, setMessages] = useState<Message[]>(mockMessages);

    const [inputMessage, setInputMessage] = useState("");
    const [groupInput, setGroupInput] = useState('');

    useEffect(() => {
        setSelectedGroup(groups[0])
        // console.log(groups);
        
    }, [groups]);


    useEffect(() => {
        socket.emit('rooms:get');

        socket.on('rooms:list', roomsList => {
            setGroups(roomsList);
        })


        socket.on('room:joined', (group: Group) => {
            // console.log(group);
            setGroups(prev => {
                const exists = prev.find(g => g.roomId === group.roomId);
                if (exists) {
                    return prev.map(g => g.roomId === group.roomId ? group : g);
                }
                return [...prev, group];
            });
            setSelectedGroup(group);
        });

        socket.on('room:member_joined', (group: Group) => {
            setGroups(prev => prev.map(g =>
                g.roomId === group.roomId ? group : g
            ));
        })

        socket.on('room:error', (error) => {
            console.log('room error:', error);
        });

        socket.on('message:error', (error) => {
            console.log('message error:', error);
        });

        return () => {
            socket.off('room:joined');
            socket.off('room:member_joined');
            socket.off('rooms:list')
        };
    }, []);

    const handleCreateGroup = () => {
        if (!groupInput || !data.user) return
        socket.emit('room:join', groupInput, data.user.id)
        setGroupInput('')
    };

    return { inputMessage, setInputMessage, groupInput, setGroupInput, handleCreateGroup, groups, setSelectedGroup, selectedGroup }
}





// const handleSendMessage = () => {
//     if (!inputMessage.trim() || !data.user) return;


//     const { user } = data;
//     if (!groups || !user?.id || !inputMessage.trim()) {
//         console.log(user.id);

//         console.log("Input issue");
//         return;
//     }


//     socket.emit('send_message', {
//         roomId: selectedGroup.roomId,
//         senderId: user.id,
//         content: inputMessage.trim()
//     })
//     setInputMessage('')

//     const newMessage: Message = {
//         id: Date.now().toString(),
//         senderId: "You",
//         senderName: "You",
//         content: inputMessage,
//         roomId: selectedGroup.roomId,
//         createdAt: new Date(),
//     };
//     setMessages([...messages, newMessage]);
//     setInputMessage("");
// };
