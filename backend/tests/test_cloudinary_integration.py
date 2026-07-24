import cloudinary.uploader

from app.integrations import cloudinary as cl


def test_generate_signed_upload_params_offline():
    params = cl.generate_signed_upload_params("charity/avatars", "image")
    assert params["folder"] == "charity/avatars"
    assert params["resource_type"] == "image"
    assert isinstance(params["timestamp"], int)
    assert isinstance(params["signature"], str) and params["signature"]
    assert "cloud_name" in params
    assert "api_key" in params


def test_destroy_calls_uploader(monkeypatch):
    called = {}

    def fake_destroy(public_id, **kwargs):
        called["public_id"] = public_id
        called["kwargs"] = kwargs
        return {"result": "ok"}

    monkeypatch.setattr(cloudinary.uploader, "destroy", fake_destroy)
    result = cl.destroy("charity/ev1", "image")
    assert result == {"result": "ok"}
    assert called["public_id"] == "charity/ev1"
    assert called["kwargs"].get("resource_type") == "image"
