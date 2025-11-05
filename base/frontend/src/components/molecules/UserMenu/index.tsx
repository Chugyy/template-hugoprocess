import React from 'react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  onLogout: () => void;
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = (props) => {
  return null;
};

export default UserMenu;