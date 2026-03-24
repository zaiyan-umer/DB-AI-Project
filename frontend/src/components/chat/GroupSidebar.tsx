import { useState } from 'react';
import { useSearchGroups, useCreateGroup, useJoinGroup, useLeaveGroup, useDeleteGroup } from '../../hooks/useGroup';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface Group {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

interface SearchGroup {
  id: string;
  name: string;
}

type GroupAction = 'leave' | 'delete';

interface Props {
  myGroups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (group: Group | null) => void;
}

export const GroupSidebar = ({ myGroups, activeGroupId, onSelectGroup }: Props) => {
  const [search, setSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<GroupAction | null>(null);
  const [targetGroup, setTargetGroup] = useState<Group | null>(null);

  const { data: searchResults } = useSearchGroups(search);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const handleCreate = () => {
    if (!newGroupName.trim()) return;
    createGroup.mutate(newGroupName.trim(), {
      onSuccess: () => {
        setNewGroupName('');
        setShowCreate(false);
      },
    });
  };


  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>, group: Group) => {
    e.stopPropagation();

    setTargetGroup(group);
    setPendingAction('leave');
    setConfirmOpen(true);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, group: Group) => {
    e.stopPropagation();

    setTargetGroup(group);
    setPendingAction('delete');
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!targetGroup || !pendingAction) return;

    const mutation = pendingAction === 'delete' ? deleteGroup : leaveGroup;

    mutation.mutate(targetGroup.id, {
      onSuccess: () => {
        if (activeGroupId === targetGroup.id) {
          onSelectGroup(null);
        }

        setConfirmOpen(false);
        setPendingAction(null);
        setTargetGroup(null);
      },
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setConfirmOpen(open);

    if (!open) {
      setPendingAction(null);
      setTargetGroup(null);
    }
  };

  return (
    <div className="w-72 h-full flex flex-col border-r bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Chats</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-green-500 hover:text-green-600 text-xl font-light cursor-pointer"
          title="Create group"
        >
          +
        </button>
      </div>

      {/* Create group input */}
      {showCreate && (
        <div className="px-4 py-2 border-b flex gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={handleCreate}
            disabled={createGroup.isPending}
            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-2 border-b">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full text-sm border rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Search results */}
      {search && searchResults && searchResults?.length > 0 && (
        <div className="border-b">
          <p className="text-xs text-gray-400 px-4 pt-2 pb-1">Search results</p>
          {searchResults.map((group: SearchGroup) => {
            const alreadyJoined = myGroups.some((g) => g.id === group.id);
            return (
              <div
                key={group.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">{group.name}</span>
                {alreadyJoined ? (
                  <span className="text-xs text-gray-400">Joined</span>
                ) : (
                  <button
                    onClick={() => joinGroup.mutate(group.id)}
                    className="text-xs text-green-500 hover:text-green-600 font-medium"
                  >
                    Join
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* My groups */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-xs text-gray-400 px-4 pt-3 pb-1">My Groups</p>
        {myGroups.length === 0 && (
          <p className="text-sm text-gray-400 px-4 py-2">
            No groups yet. Create or join one.
          </p>
        )}
        {myGroups.map((group) => (
          <div key={group.id} className="relative group/item">
            <button
              onClick={() => onSelectGroup(group)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${activeGroupId === group.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                }`}
            >
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {group.name[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-800 truncate">{group.name}</span>
            </button>

            {/* Action button — visible on hover */}
            {group.role === 'admin' ? (
              <button
                onClick={(e) => handleDelete(e, group)}
                disabled={deleteGroup.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 text-xs text-red-500 hover:text-red-700 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={(e) => handleLeave(e, group)}
                disabled={leaveGroup.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                Leave
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'delete' ? 'Delete Group?' : 'Leave Group?'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'delete'
                ? `This will permanently delete ${targetGroup?.name ?? 'this group'} and all its messages.`
                : `You will leave ${targetGroup?.name ?? 'this group'} and can rejoin later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={leaveGroup.isPending || deleteGroup.isPending}
              className='text-white hover:text-gray-200'
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmAction}
              disabled={!pendingAction || !targetGroup || leaveGroup.isPending || deleteGroup.isPending}
              className='text-white hover:text-gray-200'
            >
              {pendingAction === 'delete' ? 'Delete' : 'Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};