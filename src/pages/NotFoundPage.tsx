import { Title, Text, Button, Container, Group, Stack, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    // FIX #10: Адаптивный padding для мобильных
    <Container size="md" py={{ base: 60, md: 120 }}>
      <Stack align="center" gap="xl">
        <Box
          style={{
            position: 'relative',
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Blobs for premium feel */}
          <Box
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(25, 113, 194, 0.15) 0%, rgba(25, 113, 194, 0) 70%)',
              filter: 'blur(40px)',
              top: -50,
              left: -50,
              zIndex: 0,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(16, 152, 173, 0.15) 0%, rgba(16, 152, 173, 0) 70%)',
              filter: 'blur(40px)',
              bottom: -50,
              right: -50,
              zIndex: 0,
            }}
          />

          <Text
            style={{
              fontWeight: 900,
              fontSize: 'min(25vw, 180px)',
              lineHeight: 1,
              opacity: 0.1,
              position: 'absolute',
              zIndex: 0,
              userSelect: 'none',
              filter: 'blur(2px)',
            }}
          >
            404
          </Text>
          <Title
            className="gradient-text"
            style={{
              fontWeight: 900,
              fontSize: 'min(20vw, 120px)',
              lineHeight: 1,
              zIndex: 1,
              textShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }}
          >
            404
          </Title>
        </Box>
        
        <Stack align="center" gap="sm">
          <Title order={1} ta="center">Страница не найдена</Title>
          <Text c="dimmed" size="lg" ta="center" maw={500}>
            Похоже, вы забрели в неизведанную область нашего сервиса. 
            Вернитесь на главную, чтобы продолжить проверку текстов.
          </Text>
        </Stack>

        <Group justify="center" mt="xl">
          <Button 
            variant="gradient" 
            gradient={{ from: 'blue', to: 'cyan' }} 
            size="lg" 
            radius="md"
            onClick={() => navigate('/')}
          >
            Вернуться на главную
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            radius="md"
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
