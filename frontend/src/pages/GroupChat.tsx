import { Button } from "../components/Button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Send,
    Users,
    Lock,
    UserCheck,
    MoreVertical,
    Search,
    Hash,
} from "lucide-react";
import { motion } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useState } from "react";


export function GroupChatPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const onCreateGroup = () => {
        handleCreateGroup();
        setShowCreateModal(false);
    };

    const { messages, inputMessage, setInputMessage, setNewGroupData, mockGroups, handleCreateGroup, handleSendMessage, newGroupData, setSelectedGroup, selectedGroup } = useChat()

    return (
        <div className="h-screen w-full flex bg-muted/30">
            {/* Groups Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-80 flex flex-col border-r border-border bg-card"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">Groups</h3>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)} title="Join Group">
                            <Users size={10} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)} title="Create Group">
                            <Plus size={10} color="white" />
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input type="text" placeholder="Search groups..." className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                    {mockGroups.map((group) => {
                        const isActive = selectedGroup.id === group.id;
                        return (
                            <motion.button
                                key={group.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedGroup(group)}
                                className={`w-full p-3 rounded-lg text-left transition-colors text-white  ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"

                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 opacity-70" />
                                        <span className="font-semibold text-sm">{group.name}</span>
                                    </div>
                                    {group.unread > 0 && !isActive && (
                                        <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-medium">
                                            {group.unread}
                                        </span>
                                    )}
                                </div>
                                <div className={`flex items-center gap-3 text-xs ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {group.members}
                                    </span>
                                    {group.locked && <Lock className="w-3 h-3" />}
                                    {group.needsApproval && <UserCheck className="w-3 h-3" />}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Chat Area */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 flex flex-col bg-background">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">{selectedGroup.name}</h3>
                            <p className="text-xs text-muted-foreground">{selectedGroup.members} members</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {messages.map((msg) => {
                        const isOwn = msg.user === "You";
                        return (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                                            {msg.avatar}
                                        </div>
                                    </div>
                                    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                                        {!isOwn && <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">{msg.user}</span>}
                                        <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                                            <p className="text-sm leading-relaxed">{msg.message}</p>
                                            <span className={`text-[10px] mt-1 block text-right ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>{msg.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="px-6 py-4 border-t border-border bg-card">
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            className="flex-1 rounded-full px-5 py-3 h-12 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button onClick={handleSendMessage} size="icon" className="h-12 w-12 rounded-full">
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Create Group Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Group Name</Label>
                            <Input placeholder="e.g., Data Structures Study" value={newGroupData.name} onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Checkbox id="locked" checked={newGroupData.locked} onCheckedChange={(v) => setNewGroupData({ ...newGroupData, locked: !!v })} />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="locked" className="cursor-pointer">Password Protected</Label>
                                    <p className="text-sm text-muted-foreground">Require password to join</p>
                                </div>
                            </div>
                            {newGroupData.locked && (
                                <div className="space-y-2 pl-7">
                                    <Label>Password</Label>
                                    <Input type="password" placeholder="Enter group password" value={newGroupData.password} onChange={(e) => setNewGroupData({ ...newGroupData, password: e.target.value })} />
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <Checkbox id="approval" checked={newGroupData.needsApproval} onCheckedChange={(v) => setNewGroupData({ ...newGroupData, needsApproval: !!v })} />
                                <div className="grid gap-0.5 leading-none">
                                    <Label htmlFor="approval" className="cursor-pointer">Admin Approval Required</Label>
                                    <p className="text-sm text-muted-foreground">Manually approve new members</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
                            <Button onClick={onCreateGroup} className="flex-1">Create Group</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Join Group Modal */}
            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Join a Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Group Code or Link</Label>
                            <Input placeholder="Enter group code..." />
                        </div>
                        <Button onClick={() => setShowJoinModal(false)} className="w-full">Join Group</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
