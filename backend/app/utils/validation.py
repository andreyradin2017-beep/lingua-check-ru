import re

# Регулярное выражение для проверки URL
# Должно поддерживать http/https и доменные имена
URL_REGEX = re.compile(
    r'^https?://'  # http:// или https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # домен
    r'localhost|'  # localhost
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # или IP
    r'(?::\d+)?'  # порт
    r'(?:/?|[/?]\S+)$', re.IGNORECASE)

def is_valid_url(url: str) -> bool:
    return bool(URL_REGEX.match(url))
