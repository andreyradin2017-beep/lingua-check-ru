import { Stack, Text, Center, Box, Paper } from '@mantine/core';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Paper p="xl" radius="lg" bg="transparent" h="100%">
      <Center py={{ base: 40, md: 80 }}>
        <Stack align="center" gap="md" maw={400}>
          <Box 
            p="xl" 
            style={{ 
              backgroundColor: 'var(--mantine-color-default-hover)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mantine-color-dimmed)',
              width: 120,
              height: 120,
            }}
          >
            {icon}
          </Box>
          <Text fw={800} size="xl" ta="center">{title}</Text>
          <Text c="dimmed" size="md" ta="center">{description}</Text>
          {action && <Box mt="md">{action}</Box>}
        </Stack>
      </Center>
    </Paper>
  );
}
