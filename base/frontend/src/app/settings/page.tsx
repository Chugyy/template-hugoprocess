'use client';
import React from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';

function SettingsContent() {
  const { theme, toggleDarkMode, isDarkMode } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.xl }}>
      <div>
        <Text variant="h1" style={{ margin: 0, marginBottom: theme.spacing.values.sm }}>
          Settings
        </Text>
        <Text variant="body1" style={{ color: theme.colors.text.secondary, margin: 0 }}>
          Manage your account and application preferences.
        </Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.values.lg, maxWidth: `${theme.layout.modal.maxWidth.medium}px` }}>
        <div style={{
          padding: theme.spacing.values.lg,
          backgroundColor: theme.colors.background.paper,
          borderRadius: `${theme.components.borderRadius.large}px`,
          border: `1px solid ${theme.colors.divider}`,
          boxShadow: theme.shadows.elevation['2']
        }}>
          <Text variant="h3" style={{ margin: 0, marginBottom: theme.spacing.values.md }}>
            Profile Information
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.md }}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              defaultValue="John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              defaultValue="john@example.com"
            />
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              defaultValue="+1 (555) 123-4567"
            />
            <Button variant="primary" style={{ alignSelf: 'flex-start' }}>
              Save Changes
            </Button>
          </div>
        </div>

        <div style={{
          padding: theme.spacing.values.lg,
          backgroundColor: theme.colors.background.paper,
          borderRadius: `${theme.components.borderRadius.large}px`,
          border: `1px solid ${theme.colors.divider}`,
          boxShadow: theme.shadows.elevation['2']
        }}>
          <Text variant="h3" style={{ margin: 0, marginBottom: theme.spacing.values.md }}>
            Appearance
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.tight}px` }}>
                <Text variant="body2" style={{ margin: 0 }}>
                  Dark Mode
                </Text>
                <Text variant="caption" style={{ color: theme.colors.text.secondary, margin: 0 }}>
                  Toggle between light and dark theme
                </Text>
              </div>
              <Button 
                variant={isDarkMode ? "primary" : "tertiary"}
                size="small"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? 'Dark' : 'Light'}
              </Button>
            </div>
          </div>
        </div>

        <div style={{
          padding: theme.spacing.values.lg,
          backgroundColor: theme.colors.background.paper,
          borderRadius: `${theme.components.borderRadius.large}px`,
          border: `1px solid ${theme.colors.divider}`,
          boxShadow: theme.shadows.elevation['2']
        }}>
          <Text variant="h3" style={{ margin: 0, marginBottom: theme.spacing.values.md }}>
            Notifications
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.md }}>
            {[
              { label: 'Email Notifications', description: 'Receive updates via email' },
              { label: 'Push Notifications', description: 'Get notified instantly' },
              { label: 'Marketing Emails', description: 'Promotional content and offers' }
            ].map((notification, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.tight}px` }}>
                  <Text variant="body2" style={{ margin: 0 }}>
                    {notification.label}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.text.secondary, margin: 0 }}>
                    {notification.description}
                  </Text>
                </div>
                <Button variant="tertiary" size="small">
                  Enable
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <DashboardTemplate
      header={<Header />}
      sidebar={<Sidebar />}
    >
      <SettingsContent />
    </DashboardTemplate>
  );
}