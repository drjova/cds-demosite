# -*- coding: utf-8 -*-
#
# This file is part of Invenio.
# Copyright (C) 2015 CERN.
#
# Invenio is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation; either version 2 of the
# License, or (at your option) any later version.
#
# Invenio is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Invenio; if not, write to the Free Software Foundation, Inc.,
# 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

"""Featured records."""

from invenio_ext.sqlalchemy import db


class Featured(db.Model):
    """Featured page."""

    __tablename__ = 'featured'

    id = db.Column(
        db.Integer(15, unsigned=True),
        primary_key=True,
        nullable=False
    )
    title = db.Column('title',  db.String(length=200), primary_key=False)
    text = db.Column('description', db.Text(length=None), primary_key=False)

    def __init__(self, title=None, text=None):
        """Init the object."""
        self.title = title
        self.text = text

    def __repr__(self):
        """Repr the object."""
        return '<Featured %r>' % (self.title)
