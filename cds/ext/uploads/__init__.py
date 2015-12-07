"""Setup extension."""
from invenio.ext.sqlalchemy import db

from flask.ext.storage import get_default_storage_class
from flask.ext.uploads import init


def setup_app(app):
    """Setup Flask-Uploads."""
    init(db, get_default_storage_class(app))
    return app
