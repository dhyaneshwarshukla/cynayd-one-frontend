import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamCardProps {
  team: Team;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  onViewMembers?: (team: Team) => void;
  className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  onViewMembers,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
          {team.description && (
            <p className="text-sm text-gray-600 mb-2">{team.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          team.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {team.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Members:</span>
          <span className="font-medium">{team.memberCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Created:</span>
          <span className="font-medium">{formatDate(team.createdAt)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Updated:</span>
          <span className="font-medium">{formatDate(team.updatedAt)}</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {onViewMembers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewMembers(team)}
            className="flex-1"
          >
            View Members
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(team)}
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(team)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
};
