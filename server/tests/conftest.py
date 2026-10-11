import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.state import get_state_store


@pytest.fixture(autouse=True)
def reset_state():
    """Resets in-memory state store before each test run."""
    store = get_state_store()
    store.reset()
    yield
    store.reset()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)
