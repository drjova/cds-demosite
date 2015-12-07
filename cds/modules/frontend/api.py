"""Featured api."""

from .models import Featured
from invenio.ext.sqlalchemy import db


def create_demo(title='Lorem ipsum', text='Hello is it me'):
    """create demo."""
    obj = Featured(title=title, text=text)
    db.session.add(obj)
    db.session.commit()


def get_featured():
    """Get featured."""
    return Featured.query.all()
