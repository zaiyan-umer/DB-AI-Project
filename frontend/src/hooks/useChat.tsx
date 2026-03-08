import { useState } from "react";


export type Group = {
    id: string;
    name: string;
    members: number;
    unread: number;
    locked: boolean;
    needsApproval: boolean;
}

export type Message = {
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: string;
}

const mockGroups: Group[] = [
    { id: "1", name: "Data Structures Study", members: 45, unread: 3, locked: false, needsApproval: false },
    { id: "2", name: "Machine Learning Project", members: 12, unread: 0, locked: true, needsApproval: false },
    { id: "3", name: "Web Dev Bootcamp", members: 89, unread: 12, locked: false, needsApproval: true },
    { id: "4", name: "Algorithms Practice", members: 34, unread: 0, locked: false, needsApproval: false },
];

const mockMessages: Message[] = [
    { id: "1", user: "Sarah Chen", avatar: "SC", message: "Has anyone finished the assignment yet?", timestamp: "10:30 AM" },
    { id: "2", user: "Mike Johnson", avatar: "MJ", message: "I'm still working on problem 3. It's tricky!", timestamp: "10:32 AM" },
    { id: "3", user: "You", avatar: "JD", message: "I can help with that! The key is to use recursion.", timestamp: "10:35 AM" },
    { id: "4", user: "Sarah Chen", avatar: "SC", message: "That would be great! Can you explain?", timestamp: "10:36 AM" },
];
export function useChat() {
    const [selectedGroup, setSelectedGroup] = useState<Group>(mockGroups[0]);
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [inputMessage, setInputMessage] = useState("");

    const [newGroupData, setNewGroupData] = useState({
        name: "",
        locked: false,
        needsApproval: false,
        password: "",
    });

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            user: "You",
            avatar: "JD",
            message: inputMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages([...messages, newMessage]);
        setInputMessage("");
    };

    const handleCreateGroup = () => {
        setNewGroupData({ name: "", locked: false, needsApproval: false, password: "" });
    };

    return { messages, inputMessage, setInputMessage, newGroupData, setNewGroupData, handleCreateGroup, mockGroups, handleSendMessage, setSelectedGroup, selectedGroup }
}