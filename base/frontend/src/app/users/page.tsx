'use client';
import React, { useState, useEffect } from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import TableView from '@/components/organisms/TableView';
import EditModal from '@/components/organisms/TableView/EditModal';
import { TableViewConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  role: string;
  verified: boolean;
  createdAt: string;
  score: number;
}

function UsersContent() {
  const { theme } = useTheme();

  const defaultUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin', verified: true, createdAt: '2024-01-15', score: 95 },
    { id: 2, name: 'Jane Smith with a very long name that should be truncated', email: 'jane.smith@example.com', status: 'Active', role: 'User', verified: false, createdAt: '2024-02-20', score: 87 },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Inactive', role: 'User', verified: true, createdAt: '2024-03-10', score: 92 },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'Active', role: 'Moderator', verified: true, createdAt: '2024-04-05', score: 89 }
  ];

  const [users, setUsers] = useState<User[]>(defaultUsers);

  useEffect(() => {
    const storedUsers = localStorage.getItem('kanban-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);
  
  const [addModal, setAddModal] = useState<{ isOpen: boolean; data: Partial<User> | null }>({
    isOpen: false,
    data: null
  });

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prev => {
      const updated = prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      );
      localStorage.setItem('kanban-users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDataUpdate = (updatedData: User[]) => {
    setUsers(updatedData);
    localStorage.setItem('kanban-users', JSON.stringify(updatedData));
  };

  const handleAddUser = () => {
    const newUser: Partial<User> = {
      name: '',
      email: '',
      status: 'Active',
      role: 'User',
      verified: false,
      createdAt: new Date().toISOString().split('T')[0],
      score: 0
    };
    setAddModal({ isOpen: true, data: newUser });
  };

  const handleAddSave = (userData: Partial<User>) => {
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser: User = {
      id: newId,
      name: userData.name || '',
      email: userData.email || '',
      status: userData.status || 'Active',
      role: userData.role || 'User',
      verified: userData.verified || false,
      createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
      score: userData.score || 0
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('kanban-users', JSON.stringify(updatedUsers));
    setAddModal({ isOpen: false, data: null });
  };

  const handleDelete = (row: User) => {
    setUsers(prev => prev.filter(user => user.id !== row.id));
  };

  const tableConfig: TableViewConfig<User> = {
    layout: 'table',
    searchEngine: {
      searchableFields: ['name', 'email', 'role'],
      defaultSort: { field: 'name', direction: 'asc' },
      pageSize: 10,
      showPagination: true
    },
    fields: [
      {
        key: 'name',
        label: 'Full Name',
        type: 'text',
        sortable: true,
        searchable: true,
        sizing: { minWidth: 120, maxWidth: 300 }
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'text',
        sortable: true,
        searchable: true,
        sizing: { minWidth: 150, maxWidth: 250 }
      },
      {
        key: 'status',
        label: 'Status',
        type: 'dropdown',
        sortable: true,
        sizing: { minWidth: 80, maxWidth: 120 },
        options: [
          { value: 'Active', label: 'Active', icon: 'check-circle', tagColor: 'success' },
          { value: 'Inactive', label: 'Inactive', icon: 'x-circle', tagColor: 'error' }
        ]
      },
      {
        key: 'role',
        label: 'Role',
        type: 'dropdown',
        sortable: true,
        searchable: true,
        options: [
          { value: 'Admin', label: 'Administrator', icon: 'shield', tag: 'Full Access', tagColor: 'error' },
          { value: 'User', label: 'Standard User', icon: 'user', tag: 'Limited', tagColor: 'primary' },
          { value: 'Moderator', label: 'Moderator', icon: 'users', tag: 'Manage', tagColor: 'warning' }
        ]
      },
      {
        key: 'verified',
        label: 'Verified',
        type: 'checkbox',
        sortable: true,
        sizing: { minWidth: 60, maxWidth: 80 }
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        type: 'date',
        sortable: true,
        sizing: { minWidth: 140, maxWidth: 160 }
      },
      {
        key: 'score',
        label: 'Score',
        type: 'number',
        sortable: true,
        sizing: { minWidth: 80, maxWidth: 100 }
      },
      {
        key: 'actions',
        label: 'Actions',
        type: 'actions',
        sizing: { autoSize: false, minWidth: 240 }
      }
    ],
    actions: [
      {
        key: 'view',
        label: 'View',
        icon: 'eye',
        variant: 'secondary',
        onClick: (user: User) => alert(`View user: ${user.name}`)
      }
    ],
    selectable: true,
    batchActions: [
      {
        key: 'delete',
        label: 'Delete Selected',
        icon: 'trash',
        variant: 'danger',
        onClick: () => alert('Delete selected users')
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.xl }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text variant="h1" style={{ margin: 0, marginBottom: theme.spacing.values.sm }}>
            Users
          </Text>
          <Text variant="body1" style={{ color: theme.colors.text.secondary, margin: 0 }}>
            Manage your users and their permissions.
          </Text>
        </div>
        <Button variant="primary" icon="plus" onClick={handleAddUser}>
          Add New User
        </Button>
      </div>

      <TableView 
        config={tableConfig} 
        data={users}
        toolbar={{
          search: true,
          filters: true,
          viewSwitcher: true,
          export: true
        }}
        onDataUpdate={handleDataUpdate}
      />

      {addModal.data && (
        <EditModal
          isOpen={addModal.isOpen}
          onClose={() => setAddModal({ isOpen: false, data: null })}
          onSave={handleAddSave}
          data={addModal.data}
          fields={tableConfig.fields.filter(f => f.type !== 'actions')}
          title="Add New User"
        />
      )}
    </div>
  );
}

export default function Users() {
  return (
    <DashboardTemplate
      header={<Header />}
      sidebar={<Sidebar />}
    >
      <UsersContent />
    </DashboardTemplate>
  );
}