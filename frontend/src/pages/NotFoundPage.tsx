import { Title, Text, Button, Container, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container size="md" py={80} style={{ textAlign: 'center' }}>
      <Title
        style={{
          fontWeight: 900,
          fontSize: '120px',
          lineHeight: 1,
          marginBottom: 'var(--mantine-spacing-xl)',
          color: 'var(--mantine-color-gray-3)'
        }}
      >
        404
      </Title>
      <Title order={1} mb="md">Вы нашли секретное место.</Title>
      <Text c="dimmed" size="lg" ta="center" mb="xl">
        К сожалению, это всего лишь страница 404. Возможно, вы ошиблись при вводе адреса 
        или страница была перемещена по другому URL.
      </Text>
      <Group justify="center">
        <Button variant="outline" size="md" onClick={() => navigate('/')}>
          Вернуться на главную
        </Button>
      </Group>
    </Container>
  );
}
